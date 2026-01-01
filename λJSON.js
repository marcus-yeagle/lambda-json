/**
 * λ.json - A Turing-complete, homoiconic strict subset of JSON
 * 
 * This module provides an interpreter for λ.json expressions, supporting:
 * - Basic arithmetic operations (+, -, *, /, %)
 * - Comparison operators (>, <, >=, <=)
 * - Logical operators (and, or, not)
 * - Lambda expressions and closures
 * - Conditional expressions (if, cond)
 * - Variable definitions and scoping (define, let, let*)
 * - Higher-order functions (map, filter, reduce)
 * - Lazy evaluation and streams
 * - Type predicates (null?, list?, number?, string?, etc.)
 * - Object operations (get, keys, values, assoc, merge)
 * 
 * @version 1.0.0
 */

/**
 * Interpreter options for configuring evaluation behavior
 * @typedef {Object} EvaluatorOptions
 * @property {boolean} strictMode - If true, throws on unbound symbols (default: false)
 * @property {boolean} warnDeprecated - If true, warns about deprecated features (default: true)
 * @property {number} maxRecursionDepth - Maximum call stack depth (default: 1000)
 * @property {number} maxExecutionTime - Maximum execution time in ms (default: 5000, 0 = unlimited)
 * @property {boolean} autoMemoize - If true, all lambda functions are automatically memoized (default: false)
 */

/**
 * Default options for the evaluator
 * @type {EvaluatorOptions}
 */
const defaultOptions = {
  strictMode: false,
  warnDeprecated: true,
  maxRecursionDepth: 1000,
  maxExecutionTime: 5000,  // 5 seconds
  autoMemoize: false       // Auto-memoize all lambdas
};

/**
 * Runtime state for tracking execution limits
 */
let executionState = {
  depth: 0,
  startTime: 0
};

/**
 * Reset execution state (call before starting new evaluation)
 */
function resetExecutionState() {
  executionState = {
    depth: 0,
    startTime: Date.now()
  };
}

/**
 * Check resource limits and throw if exceeded
 * @param {EvaluatorOptions} opts - Evaluator options
 * @throws {LambdaJSONError} If limits exceeded
 */
function checkLimits(opts) {
  // Check recursion depth
  if (opts.maxRecursionDepth > 0 && executionState.depth > opts.maxRecursionDepth) {
    throw new LambdaJSONError(
      ErrorType.RUNTIME_ERROR,
      `Maximum recursion depth exceeded (${opts.maxRecursionDepth})`
    );
  }
  
  // Check execution time
  if (opts.maxExecutionTime > 0) {
    const elapsed = Date.now() - executionState.startTime;
    if (elapsed > opts.maxExecutionTime) {
      throw new LambdaJSONError(
        ErrorType.RUNTIME_ERROR,
        `Maximum execution time exceeded (${opts.maxExecutionTime}ms)`
      );
    }
  }
}

/**
 * Track whether deprecation warnings have been shown (to avoid spam)
 * @type {Set<string>}
 */
const shownWarnings = new Set();

// ============================================
// Argument Evaluation (Performance Optimization)
// ============================================

/**
 * Evaluate arguments into a fresh array using a for loop instead of .map()
 * This avoids closure allocation overhead in hot paths.
 * 
 * NOTE: Array pooling was considered but doesn't work because evaluate()
 * can be called recursively during argument evaluation, which would
 * overwrite the pooled array before it's consumed.
 * 
 * @param {Array} args - Unevaluated argument expressions
 * @param {Environment|Object} env - Environment for evaluation
 * @param {EvaluatorOptions} opts - Evaluator options
 * @returns {Array} Evaluated arguments in a new array
 * @private
 */
function evaluateArgsFresh(args, env, opts) {
  const len = args.length;
  const result = new Array(len);
  for (let i = 0; i < len; i++) {
    result[i] = evaluate(args[i], env, opts);
  }
  return result;
}

// ============================================
// Memoization Support
// ============================================

/**
 * Create a cache key from function arguments.
 * Uses JSON.stringify for primitives and arrays/objects.
 * Functions cannot be meaningfully hashed, so they use identity.
 * 
 * @param {Array} args - Arguments to create key from
 * @returns {string} Cache key
 * @private
 */
function makeMemoKey(args) {
  // Fast path for common cases (0-2 primitive args)
  const len = args.length;
  if (len === 0) return '[]';
  if (len === 1) {
    const a = args[0];
    const t = typeof a;
    if (t === 'number' || t === 'boolean' || a === null) {
      return String(a);
    }
    if (t === 'string') {
      return JSON.stringify(a);
    }
  }
  if (len === 2) {
    const a = args[0], b = args[1];
    const ta = typeof a, tb = typeof b;
    if ((ta === 'number' || ta === 'boolean' || a === null) &&
        (tb === 'number' || tb === 'boolean' || b === null)) {
      return `${a},${b}`;
    }
  }
  
  // General case: use JSON.stringify with a replacer for functions
  return JSON.stringify(args, (key, value) => {
    if (typeof value === 'function') {
      // Functions can't be serialized; use a unique marker
      return `__fn_${value.name || 'anonymous'}__`;
    }
    return value;
  });
}

// ============================================
// Environment Class (Performance Optimization)
// ============================================

/**
 * Environment class for efficient variable bindings with parent chain lookup.
 * Uses Map internally for faster lookups than plain objects.
 * 
 * @class
 */
class Environment {
  /**
   * Create a new environment
   * @param {Environment|null} parent - Parent environment for scope chain
   */
  constructor(parent = null) {
    /** @type {Map<string, *>} */
    this.bindings = new Map();
    /** @type {Environment|null} */
    this.parent = parent;
  }

  /**
   * Look up a variable in this environment or parent chain
   * @param {string} name - Variable name
   * @returns {*} The value, or undefined if not found
   */
  get(name) {
    if (this.bindings.has(name)) {
      return this.bindings.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    return undefined;
  }

  /**
   * Check if a variable exists in this environment or parent chain
   * @param {string} name - Variable name
   * @returns {boolean} True if the variable exists
   */
  has(name) {
    if (this.bindings.has(name)) {
      return true;
    }
    if (this.parent) {
      return this.parent.has(name);
    }
    return false;
  }

  /**
   * Set a variable in this environment
   * @param {string} name - Variable name
   * @param {*} value - Variable value
   */
  set(name, value) {
    this.bindings.set(name, value);
  }

  /**
   * Create a child environment extending this one
   * @returns {Environment} New environment with this as parent
   */
  extend() {
    return new Environment(this);
  }

  /**
   * Create an environment from a plain object (for backwards compatibility)
   * @param {Object} obj - Plain object with variable bindings
   * @param {Environment|null} parent - Optional parent environment
   * @returns {Environment} New environment with the object's bindings
   * @static
   */
  static fromObject(obj, parent = null) {
    const env = new Environment(parent);
    if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        env.set(key, value);
      }
    }
    return env;
  }

  /**
   * Convert environment to plain object (for debugging/serialization)
   * @param {boolean} includeParent - Whether to include parent bindings
   * @returns {Object} Plain object representation
   */
  toObject(includeParent = false) {
    const obj = {};
    if (includeParent && this.parent) {
      Object.assign(obj, this.parent.toObject(true));
    }
    for (const [key, value] of this.bindings) {
      obj[key] = value;
    }
    return obj;
  }
}

// ============================================
// Error Types
// ============================================

/**
 * Error types for λJSON evaluation errors
 * @enum {string}
 */
const ErrorType = {
  TYPE_ERROR: 'TypeError',
  ARITY_ERROR: 'ArityError',
  UNBOUND_SYMBOL: 'UnboundSymbol',
  SYNTAX_ERROR: 'SyntaxError',
  RUNTIME_ERROR: 'RuntimeError',
  DIVISION_BY_ZERO: 'DivisionByZero',
  INVALID_EXPRESSION: 'InvalidExpression'
};

/**
 * Custom error class for λJSON evaluation errors
 * Provides structured error information for better error handling
 */
class LambdaJSONError extends Error {
  /**
   * Create a λJSON error
   * @param {string} type - Error type from ErrorType enum
   * @param {string} message - Human-readable error message
   * @param {*} [expression] - The expression that caused the error
   */
  constructor(type, message, expression = null) {
    super(message);
    this.name = 'LambdaJSONError';
    this.type = type;
    this.expression = expression;
    
    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LambdaJSONError);
    }
  }

  /**
   * Convert error to JSON-serializable format
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      error: true,
      type: this.type,
      message: this.message,
      expression: this.expression
    };
  }

  /**
   * Create a TypeError
   * @param {string} message - Error message
   * @param {*} [expression] - The expression
   * @returns {LambdaJSONError}
   */
  static typeError(message, expression) {
    return new LambdaJSONError(ErrorType.TYPE_ERROR, message, expression);
  }

  /**
   * Create an ArityError (wrong number of arguments)
   * @param {string} operator - The operator name
   * @param {number} expected - Expected argument count
   * @param {number} received - Received argument count
   * @param {*} [expression] - The expression
   * @returns {LambdaJSONError}
   */
  static arityError(operator, expected, received, expression) {
    const message = `${operator} requires ${expected} argument(s), got ${received}`;
    return new LambdaJSONError(ErrorType.ARITY_ERROR, message, expression);
  }

  /**
   * Create an UnboundSymbol error
   * @param {string} symbol - The unbound symbol name
   * @returns {LambdaJSONError}
   */
  static unboundSymbol(symbol) {
    return new LambdaJSONError(
      ErrorType.UNBOUND_SYMBOL,
      `Unbound symbol: ${symbol}`,
      symbol
    );
  }

  /**
   * Create a DivisionByZero error
   * @param {*} [expression] - The expression
   * @returns {LambdaJSONError}
   */
  static divisionByZero(expression) {
    return new LambdaJSONError(
      ErrorType.DIVISION_BY_ZERO,
      'Division by zero',
      expression
    );
  }

  /**
   * Create an InvalidExpression error
   * @param {*} expression - The invalid expression
   * @returns {LambdaJSONError}
   */
  static invalidExpression(expression) {
    return new LambdaJSONError(
      ErrorType.INVALID_EXPRESSION,
      `Invalid λ.json expression: ${JSON.stringify(expression)}`,
      expression
    );
  }
}

/**
 * Global environment containing built-in operators and functions
 * This is stored as a plain object for backwards compatibility,
 * but wrapped in an Environment for internal use.
 * @type {Object.<string, Function>}
 */
const globalEnvBindings = {
  /**
   * Addition operator - supports numbers and strings
   * Optimized to avoid intermediate allocations
   * @param {Array} args - Arguments to add
   * @returns {number|string} Sum of arguments
   */
  '+': (args) => {
    const len = args.length;
    if (len === 0) return 0;
    
    // Fast path: check first element type and accumulate
    const first = args[0];
    if (typeof first === 'number') {
      let sum = first;
      for (let i = 1; i < len; i++) {
        const a = args[i];
        if (typeof a !== 'number') {
          throw new Error('Type mismatch: + requires all numbers or all strings');
        }
        sum += a;
      }
      return sum;
    } else if (typeof first === 'string') {
      let result = first;
      for (let i = 1; i < len; i++) {
        const a = args[i];
        if (typeof a !== 'string') {
          throw new Error('Type mismatch: + requires all numbers or all strings');
        }
        result += a;
      }
      return result;
    } else {
      throw new Error('Type mismatch: + requires all numbers or all strings');
    }
  },

  /**
   * Subtraction operator
   * Optimized to avoid intermediate allocations
   * @param {Array<number>} args - Numbers to subtract
   * @returns {number} Difference of arguments
   */
  '-': (args) => {
    const len = args.length;
    if (len === 0) return 0;
    
    const first = args[0];
    if (typeof first !== 'number') {
      throw new Error('Type error: - requires numeric arguments');
    }
    
    if (len === 1) return -first;
    
    let result = first;
    for (let i = 1; i < len; i++) {
      const a = args[i];
      if (typeof a !== 'number') {
        throw new Error('Type error: - requires numeric arguments');
      }
      result -= a;
    }
    return result;
  },

  /**
   * Multiplication operator
   * Optimized to avoid intermediate allocations
   * @param {Array<number>} args - Numbers to multiply
   * @returns {number} Product of arguments
   */
  '*': (args) => {
    const len = args.length;
    if (len === 0) return 1;
    
    let product = 1;
    for (let i = 0; i < len; i++) {
      const a = args[i];
      if (typeof a !== 'number') {
        throw new Error('Type error: * requires numeric arguments');
      }
      product *= a;
    }
    return product;
  },

  /**
   * Division operator
   * Optimized to avoid intermediate allocations
   * @param {Array<number>} args - Numbers to divide
   * @returns {number} Quotient of arguments
   */
  '/': (args) => {
    const len = args.length;
    if (len === 0) {
      throw new Error('Division requires at least one argument');
    }
    
    const first = args[0];
    if (typeof first !== 'number') {
      throw new Error('Type error: / requires numeric arguments');
    }
    
    if (len === 1) return first;
    
    let result = first;
    for (let i = 1; i < len; i++) {
      const a = args[i];
      if (typeof a !== 'number') {
        throw new Error('Type error: / requires numeric arguments');
      }
      if (a === 0) {
        throw new Error('Division by zero');
      }
      result /= a;
    }
    return result;
  },

  /**
   * Greater than comparator - checks if arguments are in descending order
   * @param {Array<number>} args - Numbers to compare
   * @returns {boolean} True if each element is greater than the next
   */
  '>': (args) => {
    if (args.length < 2) return true;
    return args.every((val, index) => index === 0 || args[index - 1] > val);
  },

  /**
   * Less than comparator - checks if arguments are in ascending order
   * @param {Array<number>} args - Numbers to compare
   * @returns {boolean} True if each element is less than the next
   */
  '<': (args) => {
    if (args.length < 2) return true;
    return args.every((val, index) => index === 0 || args[index - 1] < val);
  },

  /**
   * Greater than or equal comparator - checks if arguments are in non-ascending order
   * @param {Array<number>} args - Numbers to compare
   * @returns {boolean} True if each element is >= the next
   */
  '>=': (args) => {
    if (args.length < 2) return true;
    return args.every((val, index) => index === 0 || args[index - 1] >= val);
  },

  /**
   * Less than or equal comparator - checks if arguments are in non-descending order
   * @param {Array<number>} args - Numbers to compare
   * @returns {boolean} True if each element is <= the next
   */
  '<=': (args) => {
    if (args.length < 2) return true;
    return args.every((val, index) => index === 0 || args[index - 1] <= val);
  },

  /**
   * Modulo operator
   * Optimized to avoid intermediate allocations
   * @param {Array<number>} args - Numbers for modulo operation
   * @returns {number} Result of successive modulo operations
   */
  '%': (args) => {
    const len = args.length;
    if (len < 2) {
      throw new Error('% requires at least 2 arguments');
    }
    
    const first = args[0];
    if (typeof first !== 'number') {
      throw new Error('Type error: % requires numeric arguments');
    }
    
    let result = first;
    for (let i = 1; i < len; i++) {
      const a = args[i];
      if (typeof a !== 'number') {
        throw new Error('Type error: % requires numeric arguments');
      }
      result %= a;
    }
    return result;
  },

  /**
   * Absolute value
   * @param {Array<number>} args - Single number
   * @returns {number} Absolute value
   */
  'abs': (args) => {
    if (args.length !== 1) {
      throw new Error('abs requires exactly one argument');
    }
    if (typeof args[0] !== 'number') {
      throw new Error('Type error: abs requires a numeric argument');
    }
    return Math.abs(args[0]);
  },

  /**
   * Minimum value
   * @param {Array<number>} args - Numbers to compare
   * @returns {number} Smallest number
   */
  'min': (args) => {
    if (args.length === 0) {
      throw new Error('min requires at least one argument');
    }
    if (!args.every((a) => typeof a === 'number')) {
      throw new Error('Type error: min requires numeric arguments');
    }
    return Math.min(...args);
  },

  /**
   * Maximum value
   * @param {Array<number>} args - Numbers to compare
   * @returns {number} Largest number
   */
  'max': (args) => {
    if (args.length === 0) {
      throw new Error('max requires at least one argument');
    }
    if (!args.every((a) => typeof a === 'number')) {
      throw new Error('Type error: max requires numeric arguments');
    }
    return Math.max(...args);
  },

  /**
   * Floor function - rounds down to nearest integer
   * @param {Array<number>} args - Single number
   * @returns {number} Floor value
   */
  'floor': (args) => {
    if (args.length !== 1) {
      throw new Error('floor requires exactly one argument');
    }
    if (typeof args[0] !== 'number') {
      throw new Error('Type error: floor requires a numeric argument');
    }
    return Math.floor(args[0]);
  },

  /**
   * Ceiling function - rounds up to nearest integer
   * @param {Array<number>} args - Single number
   * @returns {number} Ceiling value
   */
  'ceil': (args) => {
    if (args.length !== 1) {
      throw new Error('ceil requires exactly one argument');
    }
    if (typeof args[0] !== 'number') {
      throw new Error('Type error: ceil requires a numeric argument');
    }
    return Math.ceil(args[0]);
  },

  /**
   * Round function - rounds to nearest integer
   * @param {Array<number>} args - Single number
   * @returns {number} Rounded value
   */
  'round': (args) => {
    if (args.length !== 1) {
      throw new Error('round requires exactly one argument');
    }
    if (typeof args[0] !== 'number') {
      throw new Error('Type error: round requires a numeric argument');
    }
    return Math.round(args[0]);
  },

  /**
   * Null predicate - checks if value is null
   * @param {Array} args - Single value to check
   * @returns {boolean} True if null
   */
  'null?': (args) => {
    if (args.length !== 1) {
      throw new Error('null? requires exactly one argument');
    }
    return args[0] === null;
  },

  /**
   * List predicate - checks if value is an array
   * @param {Array} args - Single value to check
   * @returns {boolean} True if array
   */
  'list?': (args) => {
    if (args.length !== 1) {
      throw new Error('list? requires exactly one argument');
    }
    return Array.isArray(args[0]);
  },

  /**
   * Number predicate - checks if value is a number
   * @param {Array} args - Single value to check
   * @returns {boolean} True if number
   */
  'number?': (args) => {
    if (args.length !== 1) {
      throw new Error('number? requires exactly one argument');
    }
    return typeof args[0] === 'number';
  },

  /**
   * String predicate - checks if value is a string
   * @param {Array} args - Single value to check
   * @returns {boolean} True if string
   */
  'string?': (args) => {
    if (args.length !== 1) {
      throw new Error('string? requires exactly one argument');
    }
    return typeof args[0] === 'string';
  },

  /**
   * Boolean predicate - checks if value is a boolean
   * @param {Array} args - Single value to check
   * @returns {boolean} True if boolean
   */
  'boolean?': (args) => {
    if (args.length !== 1) {
      throw new Error('boolean? requires exactly one argument');
    }
    return typeof args[0] === 'boolean';
  },

  /**
   * Object predicate - checks if value is an object (not array, not null)
   * @param {Array} args - Single value to check
   * @returns {boolean} True if plain object
   */
  'object?': (args) => {
    if (args.length !== 1) {
      throw new Error('object? requires exactly one argument');
    }
    return args[0] !== null && typeof args[0] === 'object' && !Array.isArray(args[0]);
  },

  /**
   * Function predicate - checks if value is a function
   * @param {Array} args - Single value to check
   * @returns {boolean} True if function
   */
  'function?': (args) => {
    if (args.length !== 1) {
      throw new Error('function? requires exactly one argument');
    }
    return typeof args[0] === 'function';
  },

  // ============================================
  // Object Operations
  // ============================================

  /**
   * Get a value from an object by key
   * @param {Array} args - [object, key]
   * @returns {*} The value at the key, or null if not found
   */
  'get': (args) => {
    if (args.length !== 2) {
      throw new Error('get requires exactly 2 arguments: object and key');
    }
    const [obj, key] = args;
    if (obj === null || typeof obj !== 'object') {
      throw new Error('get requires an object as first argument');
    }
    if (typeof key !== 'string') {
      throw new Error('get requires a string key as second argument');
    }
    return obj[key] !== undefined ? obj[key] : null;
  },

  /**
   * Get all keys from an object
   * @param {Array} args - [object]
   * @returns {Array<string>} Array of keys
   */
  'keys': (args) => {
    if (args.length !== 1) {
      throw new Error('keys requires exactly one argument');
    }
    const obj = args[0];
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('keys requires an object argument');
    }
    return Object.keys(obj);
  },

  /**
   * Get all values from an object
   * @param {Array} args - [object]
   * @returns {Array} Array of values
   */
  'values': (args) => {
    if (args.length !== 1) {
      throw new Error('values requires exactly one argument');
    }
    const obj = args[0];
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('values requires an object argument');
    }
    return Object.values(obj);
  },

  /**
   * Associate a key-value pair in an object (returns new object)
   * @param {Array} args - [object, key, value]
   * @returns {Object} New object with the key-value pair added/updated
   */
  'assoc': (args) => {
    if (args.length !== 3) {
      throw new Error('assoc requires exactly 3 arguments: object, key, and value');
    }
    const [obj, key, value] = args;
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('assoc requires an object as first argument');
    }
    if (typeof key !== 'string') {
      throw new Error('assoc requires a string key as second argument');
    }
    return { ...obj, [key]: value };
  },

  /**
   * Dissociate (remove) a key from an object (returns new object)
   * @param {Array} args - [object, key]
   * @returns {Object} New object without the key
   */
  'dissoc': (args) => {
    if (args.length !== 2) {
      throw new Error('dissoc requires exactly 2 arguments: object and key');
    }
    const [obj, key] = args;
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('dissoc requires an object as first argument');
    }
    if (typeof key !== 'string') {
      throw new Error('dissoc requires a string key as second argument');
    }
    const result = { ...obj };
    delete result[key];
    return result;
  },

  /**
   * Merge multiple objects (returns new object)
   * @param {Array} args - Objects to merge (later ones override earlier)
   * @returns {Object} Merged object
   */
  'merge': (args) => {
    if (args.length === 0) {
      return {};
    }
    for (const obj of args) {
      if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        throw new Error('merge requires all arguments to be objects');
      }
    }
    return Object.assign({}, ...args);
  },

  /**
   * Check if an object has a key
   * @param {Array} args - [object, key]
   * @returns {boolean} True if object has the key
   */
  'has-key?': (args) => {
    if (args.length !== 2) {
      throw new Error('has-key? requires exactly 2 arguments: object and key');
    }
    const [obj, key] = args;
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('has-key? requires an object as first argument');
    }
    if (typeof key !== 'string') {
      throw new Error('has-key? requires a string key as second argument');
    }
    return Object.prototype.hasOwnProperty.call(obj, key);
  },

  /**
   * Logical AND operator - evaluates arguments lazily
   * @param {Array} args - Expressions to evaluate
   * @param {Object} env - Environment for evaluation
   * @returns {boolean} True if all arguments evaluate to truthy
   */
  and: (args, env) => {
    for (const arg of args) {
      if (!evaluate(arg, env)) {
        return false;
      }
    }
    return true;
  },

  /**
   * Logical OR operator - evaluates arguments lazily
   * @param {Array} args - Expressions to evaluate
   * @param {Object} env - Environment for evaluation
   * @returns {boolean} True if any argument evaluates to truthy
   */
  or: (args, env) => {
    for (const arg of args) {
      if (evaluate(arg, env)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Logical NOT operator
   * @param {Array} args - Single expression to negate
   * @param {Object} env - Environment for evaluation
   * @returns {boolean} Negation of the argument
   */
  not: (args, env) => {
    if (args.length !== 1) {
      throw new Error('not requires exactly one argument');
    }
    return !evaluate(args[0], env);
  },
};

/**
 * Global environment instance wrapping the built-in bindings
 * @type {Environment}
 */
const globalEnv = Environment.fromObject(globalEnvBindings);

/**
 * Backwards-compatible global environment object accessor
 * Allows direct property access like globalEnv['+']
 * @type {Object.<string, Function>}
 */
const globalEnvProxy = new Proxy(globalEnvBindings, {
  get(target, prop) {
    if (typeof prop === 'string') {
      return globalEnv.get(prop);
    }
    return target[prop];
  },
  set(target, prop, value) {
    if (typeof prop === 'string') {
      globalEnv.set(prop, value);
      target[prop] = value;
    }
    return true;
  },
  has(target, prop) {
    if (typeof prop === 'string') {
      return globalEnv.has(prop);
    }
    return prop in target;
  }
});

/**
 * List of primitive operators that receive arguments as arrays
 * @type {Array<string>}
 */
const primitiveOps = [
  '+', '-', '*', '/', '%',           // Arithmetic
  '>', '<', '>=', '<=',              // Comparison
  'not', 'and', 'or',                // Logic
  'abs', 'min', 'max',               // Math functions
  'floor', 'ceil', 'round',          // Rounding
  'null?', 'list?', 'number?',       // Type predicates
  'string?', 'boolean?', 'object?', 'function?',
  'get', 'keys', 'values',           // Object access
  'assoc', 'dissoc', 'merge', 'has-key?'  // Object manipulation
];

/**
 * Warn about deprecated features (only once per feature)
 * @param {string} feature - The deprecated feature identifier
 * @param {string} message - The warning message
 * @param {EvaluatorOptions} options - Evaluator options
 */
function warnDeprecated(feature, message, options) {
  if (options.warnDeprecated && !shownWarnings.has(feature)) {
    console.warn(`[λJSON DEPRECATED] ${message}`);
    shownWarnings.add(feature);
  }
}

/**
 * Helper to look up a variable in an environment (supports both Environment class and plain objects)
 * @param {string} name - Variable name
 * @param {Environment|Object} env - Environment to search
 * @returns {*} The value, or undefined if not found
 * @private
 */
function envLookup(name, env) {
  // Environment class
  if (env instanceof Environment) {
    const val = env.get(name);
    if (val !== undefined) return val;
    return globalEnv.get(name);
  }
  // Plain object (backwards compatible)
  if (env && env[name] !== undefined) {
    return env[name];
  }
  return globalEnv.get(name);
}

/**
 * Helper to check if a variable exists in an environment
 * @param {string} name - Variable name
 * @param {Environment|Object} env - Environment to search
 * @returns {boolean} True if the variable exists
 * @private
 */
function envHas(name, env) {
  if (env instanceof Environment) {
    return env.has(name) || globalEnv.has(name);
  }
  return (env && env[name] !== undefined) || globalEnv.has(name);
}

/**
 * Evaluates a λ.json expression in the given environment
 * 
 * @param {*} exp - The expression to evaluate
 * @param {Environment|Object} env - The environment containing variable bindings
 * @param {EvaluatorOptions} [options] - Optional evaluation settings
 * @returns {*} The result of evaluating the expression
 * @throws {Error} If the expression is invalid or evaluation fails
 */
function evaluate(exp, env, options = defaultOptions) {
  // Merge with defaults if partial options provided
  const opts = { ...defaultOptions, ...options };
  
  // Initialize execution state on first call (depth 0)
  if (executionState.depth === 0) {
    executionState.startTime = Date.now();
  }
  
  // Increment depth and check limits
  executionState.depth++;
  try {
    checkLimits(opts);
    return evaluateInternal(exp, env, opts);
  } finally {
    executionState.depth--;
  }
}

/**
 * Internal evaluation function (after limit checks)
 * @private
 */
function evaluateInternal(exp, env, opts) {
  // Self-evaluating expressions
  if (typeof exp === 'number') {
    return exp;
  }
  
  if (typeof exp === 'boolean') {
    return exp;
  }
  
  if (exp === null) {
    return null;
  }
  
  // String handling
  if (typeof exp === 'string') {
    // Quoted strings (literals) - DEPRECATED: use ["quote", "string"] instead
    if (exp.startsWith("'")) {
      warnDeprecated(
        'quote-prefix',
        "String prefix ' is deprecated. Use [\"quote\", \"string\"] instead.",
        opts
      );
      return exp.substring(1);
    }
    // Variable lookup using unified helper
    const value = envLookup(exp, env);
    if (value !== undefined) {
      return value;
    }
    // In strict mode, unbound symbols throw an error
    if (opts.strictMode) {
      throw new Error(`Unbound symbol: ${exp}`);
    }
    // Return as literal if not found (for unbound variables) - backward compatible
    return exp;
  }
  
  // Plain objects are self-evaluating (they pass through unchanged)
  // This allows JSON objects to be used as data structures
  if (typeof exp === 'object' && exp !== null && !Array.isArray(exp)) {
    return exp;
  }
  
  // Array expressions (function applications and special forms)
  if (Array.isArray(exp)) {
    if (exp.length === 0) {
      return exp; // Empty array evaluates to itself
    }

    const [operator, ...args] = exp;

    // Special forms
    if (operator === 'define') {
      if (args.length !== 2) {
        throw new Error('define requires exactly 2 arguments: variable and value');
      }
      const [variable, value] = args;
      if (typeof variable !== 'string') {
        throw new Error('define requires a string variable name');
      }
      const evaluatedValue = evaluate(value, env, opts);
      globalEnv.set(variable, evaluatedValue);
      // Also update the bindings object for backwards compatibility
      globalEnvBindings[variable] = evaluatedValue;
      return evaluatedValue;
    }

    if (operator === 'lambda' || operator === 'λ') {
      if (args.length !== 2) {
        throw new Error('lambda requires exactly 2 arguments: parameters and body');
      }
      const [parameters, body] = args;
      if (!Array.isArray(parameters)) {
        throw new Error('lambda parameters must be an array');
      }
      // Capture opts and environment in closure for consistent behavior
      const capturedOpts = opts;
      // Convert env to Environment if it's a plain object
      const capturedEnv = env instanceof Environment 
        ? env 
        : Environment.fromObject(env, globalEnv);
      
      const baseFn = (...evalArgs) => {
        // Create new environment extending the captured one
        const localEnv = capturedEnv.extend();
        for (let i = 0; i < parameters.length; i++) {
          localEnv.set(parameters[i], evalArgs[i]);
        }
        return evaluate(body, localEnv, capturedOpts);
      };
      
      // Auto-memoize if option is enabled
      if (opts.autoMemoize) {
        const cache = new Map();
        const memoizedFn = (...callArgs) => {
          const key = makeMemoKey(callArgs);
          if (cache.has(key)) {
            return cache.get(key);
          }
          const result = baseFn(...callArgs);
          cache.set(key, result);
          return result;
        };
        memoizedFn._memoCache = cache;
        memoizedFn._isMemoized = true;
        return memoizedFn;
      }
      
      return baseFn;
    }

    if (operator === 'if') {
      if (args.length !== 3) {
        throw new Error('if requires exactly 3 arguments: condition, true-branch, false-branch');
      }
      const [condition, trueBranch, falseBranch] = args;
      const conditionResult = evaluate(condition, env, opts);
      return conditionResult
        ? evaluate(trueBranch, env, opts)
        : evaluate(falseBranch, env, opts);
    }

    if (operator === 'cond') {
      if (args.length === 0) {
        throw new Error('cond requires at least one clause');
      }
      for (const clause of args) {
        if (!Array.isArray(clause) || clause.length !== 2) {
          throw new Error('cond clauses must be arrays of [condition, expression]');
        }
        const [condition, expr] = clause;
        if (condition === 'else' || evaluate(condition, env, opts)) {
          return evaluate(expr, env, opts);
        }
      }
      return undefined; // No clause matched
    }

    if (operator === 'let') {
      if (args.length !== 2) {
        throw new Error('let requires exactly 2 arguments: bindings and body');
      }
      const [bindings, body] = args;
      if (!Array.isArray(bindings)) {
        throw new Error('let bindings must be an array');
      }
      // Convert env to Environment if needed and extend it
      const baseEnv = env instanceof Environment 
        ? env 
        : Environment.fromObject(env, globalEnv);
      const localEnv = baseEnv.extend();
      
      for (const binding of bindings) {
        if (!Array.isArray(binding) || binding.length !== 2) {
          throw new Error('let binding must be [variable, value]');
        }
        const [variable, value] = binding;
        // Evaluate in original env (parallel let bindings)
        localEnv.set(variable, evaluate(value, env, opts));
      }
      return evaluate(body, localEnv, opts);
    }

    if (operator === 'let*') {
      if (args.length !== 2) {
        throw new Error('let* requires exactly 2 arguments: bindings and body');
      }
      const [bindings, body] = args;
      if (!Array.isArray(bindings)) {
        throw new Error('let* bindings must be an array');
      }
      // Convert env to Environment if needed and extend it
      const baseEnv = env instanceof Environment 
        ? env 
        : Environment.fromObject(env, globalEnv);
      const localEnv = baseEnv.extend();
      
      for (const binding of bindings) {
        if (!Array.isArray(binding) || binding.length !== 2) {
          throw new Error('let* binding must be [variable, value]');
        }
        const [variable, value] = binding;
        // Evaluate in localEnv (sequential let* bindings)
        localEnv.set(variable, evaluate(value, localEnv, opts));
      }
      return evaluate(body, localEnv, opts);
    }

    if (operator === 'quote') {
      if (args.length !== 1) {
        throw new Error('quote requires exactly one argument');
      }
      return args[0];
    }

    // Memoization special form for caching pure function results
    if (operator === 'memoize') {
      if (args.length !== 1) {
        throw new Error('memoize requires exactly one argument (a function)');
      }
      const fn = evaluate(args[0], env, opts);
      if (typeof fn !== 'function') {
        throw new Error('memoize requires a function argument');
      }
      
      // Create a cache for this memoized function
      const cache = new Map();
      
      // Return a wrapper function that checks the cache before calling
      const memoizedFn = (...callArgs) => {
        // Create a cache key from the arguments
        const key = makeMemoKey(callArgs);
        
        if (cache.has(key)) {
          return cache.get(key);
        }
        
        const result = fn(...callArgs);
        cache.set(key, result);
        return result;
      };
      
      // Attach cache for debugging/clearing
      memoizedFn._memoCache = cache;
      memoizedFn._isMemoized = true;
      
      return memoizedFn;
    }

    if (operator === 'eq?') {
      if (args.length !== 2) {
        throw new Error('eq? requires exactly 2 arguments');
      }
      const [arg1, arg2] = args;
      const value1 = evaluate(arg1, env, opts);
      const value2 = evaluate(arg2, env, opts);
      return value1 === value2;
    }

    if (operator === 'divides?') {
      if (args.length !== 2) {
        throw new Error('divides? requires exactly 2 arguments');
      }
      const x = evaluate(args[0], env, opts);
      const y = evaluate(args[1], env, opts);
      if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error('divides? requires numeric arguments');
      }
      if (x === 0) return false; // 0 doesn't divide anything
      return y % x === 0;
    }

    if (operator === 'length') {
      if (args.length !== 1) {
        throw new Error('length requires exactly one argument');
      }
      const list = evaluate(args[0], env, opts);
      if (!Array.isArray(list)) {
        throw new Error('length requires an array argument');
      }
      return list.length;
    }

    // List primitives (car, cdr, cons, nth, append)
    if (operator === 'car') {
      if (args.length !== 1) {
        throw new Error('car requires exactly one argument');
      }
      const list = evaluate(args[0], env, opts);
      if (!Array.isArray(list)) {
        throw new Error('car requires an array argument');
      }
      if (list.length === 0) {
        return null;
      }
      return list[0];
    }

    if (operator === 'cdr') {
      if (args.length !== 1) {
        throw new Error('cdr requires exactly one argument');
      }
      const list = evaluate(args[0], env, opts);
      if (!Array.isArray(list)) {
        throw new Error('cdr requires an array argument');
      }
      return list.slice(1);
    }

    if (operator === 'cons') {
      if (args.length !== 2) {
        throw new Error('cons requires exactly 2 arguments: element and list');
      }
      const elem = evaluate(args[0], env, opts);
      const list = evaluate(args[1], env, opts);
      if (!Array.isArray(list)) {
        throw new Error('cons requires an array as second argument');
      }
      return [elem, ...list];
    }

    if (operator === 'nth') {
      if (args.length !== 2) {
        throw new Error('nth requires exactly 2 arguments: list and index');
      }
      const list = evaluate(args[0], env, opts);
      const index = evaluate(args[1], env, opts);
      if (!Array.isArray(list)) {
        throw new Error('nth requires an array as first argument');
      }
      if (typeof index !== 'number') {
        throw new Error('nth requires a number as second argument');
      }
      if (index < 0 || index >= list.length) {
        return null;
      }
      return list[index];
    }

    if (operator === 'append') {
      if (args.length < 2) {
        throw new Error('append requires at least 2 arguments');
      }
      const lists = args.map(arg => {
        const evaluated = evaluate(arg, env, opts);
        if (!Array.isArray(evaluated)) {
          throw new Error('append requires all arguments to be arrays');
        }
        return evaluated;
      });
      return lists.flat();
    }

    if (operator === 'list') {
      return args.map(arg => evaluate(arg, env, opts));
    }

    // Higher-order functions
    if (operator === 'map') {
      if (args.length !== 2) {
        throw new Error('map requires exactly 2 arguments: procedure and list');
      }
      const [proc, list] = args;
      const evaluatedList = evaluate(list, env, opts);
      const evaluatedProc = evaluate(proc, env, opts);
      if (!Array.isArray(evaluatedList)) {
        throw new Error('map requires an array as second argument');
      }
      if (typeof evaluatedProc !== 'function') {
        throw new Error('map requires a function as first argument');
      }
      return evaluatedList.map((item) => evaluatedProc(item));
    }

    if (operator === 'filter') {
      if (args.length !== 2) {
        throw new Error('filter requires exactly 2 arguments: predicate and list');
      }
      const [proc, list] = args;
      const evaluatedList = evaluate(list, env, opts);
      const evaluatedProc = evaluate(proc, env, opts);
      if (!Array.isArray(evaluatedList)) {
        throw new Error('filter requires an array as second argument');
      }
      if (typeof evaluatedProc !== 'function') {
        throw new Error('filter requires a function as first argument');
      }
      return evaluatedList.filter((item) => evaluatedProc(item));
    }

    if (operator === 'reduce') {
      if (args.length !== 2) {
        throw new Error('reduce requires exactly 2 arguments: procedure and list');
      }
      const [proc, list] = args;
      const evaluatedList = evaluate(list, env, opts);
      const evaluatedProc = evaluate(proc, env, opts);
      if (!Array.isArray(evaluatedList)) {
        throw new Error('reduce requires an array as second argument');
      }
      if (typeof evaluatedProc !== 'function') {
        throw new Error('reduce requires a function as first argument');
      }
      return evaluatedList.reduce(evaluatedProc);
    }

    // Stream operations
    if (operator === 'cons-stream') {
      if (args.length !== 2) {
        throw new Error('cons-stream requires exactly 2 arguments: head and tail');
      }
      const capturedOpts = opts;
      const headValue = evaluate(args[0], env, opts);
      const tailThunk = () => evaluate(args[1], env, capturedOpts);
      return { head: headValue, tail: tailThunk };
    }

    if (operator === 'delay') {
      if (args.length !== 1) {
        throw new Error('delay requires exactly one argument');
      }
      const capturedOpts = opts;
      return function* () {
        for (const arg of args[0]) {
          yield evaluate(arg, env, capturedOpts);
        }
      };
    }

    if (operator === 'head') {
      if (args.length !== 1) {
        throw new Error('head requires exactly one argument');
      }
      const stream = evaluate(args[0], env, opts);
      if (typeof stream === 'function') {
        const generator = stream();
        const result = generator.next();
        return result.value;
      }
      if (stream && typeof stream === 'object' && 'head' in stream) {
        return stream.head;
      }
      throw new Error('head requires a stream');
    }

    if (operator === 'tail') {
      if (args.length !== 1) {
        throw new Error('tail requires exactly one argument');
      }
      const stream = evaluate(args[0], env, opts);
      if (typeof stream === 'function') {
        return function* () {
          const generator = stream();
          generator.next(); // Skip first value
          for (const value of generator) {
            yield value;
          }
        };
      }
      if (stream && typeof stream === 'object' && 'tail' in stream) {
        return stream.tail();
      }
      throw new Error('tail requires a stream');
    }

    if (operator === 'force') {
      if (args.length !== 1) {
        throw new Error('force requires exactly one argument');
      }
      const forced = evaluate(args[0], env, opts);
      if (typeof forced === 'function') {
        const generator = forced();
        return Array.from(generator);
      }
      return forced;
    }

    if (operator === 'take') {
      if (args.length !== 2) {
        throw new Error('take requires exactly 2 arguments: n and stream');
      }
      let n = evaluate(args[0], env, opts);
      let stream = evaluate(args[1], env, opts);
      
      if (typeof n !== 'number' || n < 0) {
        throw new Error('take requires a non-negative number as first argument');
      }
      
      const result = [];
      while (n > 0 && stream) {
        if (stream.head !== undefined) {
          result.push(stream.head);
          stream = stream.tail();
        } else {
          break;
        }
        n--;
      }
      return result;
    }

    if (operator === 'enum-stream') {
      if (args.length !== 1) {
        throw new Error('enum-stream requires exactly one argument');
      }
      const n = evaluate(args[0], env, opts);
      if (typeof n !== 'number') {
        throw new Error('enum-stream requires a numeric argument');
      }
      return function* () {
        for (let i = 1; i <= n; i++) {
          yield i;
        }
      };
    }

    if (operator === 'map-stream') {
      if (args.length !== 2) {
        throw new Error('map-stream requires exactly 2 arguments: function and stream');
      }
      const fn = evaluate(args[0], env, opts);
      const stream = evaluate(args[1], env, opts);
      if (typeof fn !== 'function') {
        throw new Error('map-stream requires a function as first argument');
      }
      return function* () {
        for (const item of stream()) {
          yield fn(item);
        }
      };
    }

    if (operator === 'filter-stream') {
      if (args.length !== 2) {
        throw new Error('filter-stream requires exactly 2 arguments: predicate and stream');
      }
      const predicate = evaluate(args[0], env, opts);
      const stream = evaluate(args[1], env, opts);
      if (typeof predicate !== 'function') {
        throw new Error('filter-stream requires a function as first argument');
      }
      return function* () {
        for (const item of stream()) {
          if (predicate(item)) {
            yield item;
          }
        }
      };
    }

    // Function application
    const evaluatedOperator = evaluate(operator, env, opts);

    if (typeof evaluatedOperator === 'function') {
      // Special handling for logical operators that need environment
      if (operator === 'and' || operator === 'or' || operator === 'not') {
        return evaluatedOperator(args, env);
      }
      // All function calls need fresh arrays because evaluation can be recursive
      // (the pooled array approach doesn't work when evaluate() can be called
      // recursively during argument evaluation, overwriting the pooled array)
      const evaluatedArgs = evaluateArgsFresh(args, env, opts);
      
      // Primitive operators receive args as array
      if (primitiveOps.includes(operator)) {
        return evaluatedOperator(evaluatedArgs);
      }
      // User-defined functions receive args spread
      return evaluatedOperator(...evaluatedArgs);
    }

    // If operator is not a function, return the expression unevaluated
    return exp;
  }

  throw new Error(`Invalid λ.json expression: ${JSON.stringify(exp)}`);
}

/**
 * Reset deprecation warnings (useful for testing)
 */
function resetWarnings() {
  shownWarnings.clear();
}

// ============================================
// Versioning and Document Processing
// ============================================

/**
 * Current specification version
 * @type {string}
 */
const SPEC_VERSION = '1.0.0';

/**
 * Supported schema URLs
 * @type {Array<string>}
 */
const SUPPORTED_SCHEMAS = [
  'https://lambda-json.org/schema/v1.0',
  'https://lambda-json.org/schema/v1.0.0'
];

/**
 * Validate a λJSON document's metadata
 * @param {Object} doc - The document to validate
 * @returns {{valid: boolean, errors: Array<string>, warnings: Array<string>}}
 */
function validateDocument(doc) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    // Not a document object, just an expression - that's valid
    return result;
  }

  // Check $schema if present
  if (doc.$schema) {
    if (typeof doc.$schema !== 'string') {
      result.errors.push('$schema must be a string');
      result.valid = false;
    } else if (!SUPPORTED_SCHEMAS.some(s => doc.$schema.startsWith(s.split('/v')[0]))) {
      result.warnings.push(`Unknown schema: ${doc.$schema}. This implementation supports lambda-json.org schemas.`);
    }
  }

  // Check $version if present
  if (doc.$version) {
    if (typeof doc.$version !== 'string') {
      result.errors.push('$version must be a string');
      result.valid = false;
    } else if (!/^\d+\.\d+(\.\d+)?$/.test(doc.$version)) {
      result.errors.push('$version must be in semver format (e.g., "1.0" or "1.0.0")');
      result.valid = false;
    } else {
      // Check version compatibility
      const [major] = doc.$version.split('.');
      const [supportedMajor] = SPEC_VERSION.split('.');
      if (major !== supportedMajor) {
        result.warnings.push(`Document version ${doc.$version} may not be fully compatible with interpreter version ${SPEC_VERSION}`);
      }
    }
  }

  return result;
}

/**
 * Process a λJSON document with data and code
 * 
 * This is a convenience function that handles the common pattern of:
 * - Validating document metadata
 * - Applying code to data
 * - Returning the result
 * 
 * @param {Object} doc - Document with optional $schema, $version, data, and code
 * @param {EvaluatorOptions} [options] - Evaluation options
 * @returns {Object} The document with a 'result' property added
 * @throws {LambdaJSONError} If validation fails or evaluation fails
 * 
 * @example
 * const doc = {
 *   "$version": "1.0",
 *   "data": [1, 2, 3, 4],
 *   "code": ["λ", ["nums"], ["/", ["reduce", ["λ", ["a", "b"], ["+", "a", "b"]], "nums"], ["length", "nums"]]]
 * };
 * const result = processDocument(doc);
 * // result.result === 2.5
 */
function processDocument(doc, options = defaultOptions) {
  // Validate document
  const validation = validateDocument(doc);
  
  if (!validation.valid) {
    throw new LambdaJSONError(
      ErrorType.SYNTAX_ERROR,
      `Invalid document: ${validation.errors.join(', ')}`,
      doc
    );
  }

  // Log warnings
  if (validation.warnings.length > 0 && options.warnDeprecated) {
    validation.warnings.forEach(w => console.warn(`[λJSON] ${w}`));
  }

  // If it's not a document object or has no code, just return as-is
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    return doc;
  }

  if (!doc.code) {
    return doc;
  }

  // Evaluate code with data
  const code = doc.code;
  const data = doc.data;

  let result;
  if (data !== undefined) {
    // If code is a lambda, apply it to data
    const evaluatedCode = evaluate(code, {}, options);
    if (typeof evaluatedCode === 'function') {
      result = evaluatedCode(data);
    } else {
      // Code is not a lambda, just evaluate it with data in scope
      result = evaluate(code, { data }, options);
    }
  } else {
    // No data, just evaluate the code
    result = evaluate(code, {}, options);
  }

  // Return new document with result
  return {
    ...doc,
    result
  };
}

/**
 * Get version information
 * @returns {{version: string, specVersion: string}}
 */
function getVersion() {
  return {
    version: SPEC_VERSION,
    specVersion: SPEC_VERSION
  };
}

module.exports = { 
  // Core
  globalEnv: globalEnvProxy,  // Backwards-compatible proxy
  evaluate, 
  
  // Environment class for advanced usage
  Environment,
  
  // Document processing
  processDocument,
  validateDocument,
  
  // Options and utilities
  defaultOptions,
  resetWarnings,
  resetExecutionState,
  
  // Errors
  LambdaJSONError,
  ErrorType,
  
  // Version info
  SPEC_VERSION,
  getVersion
};