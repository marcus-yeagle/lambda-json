/**
 * λ.json - Browser-compatible interpreter
 * A Turing-complete, homoiconic strict subset of JSON
 */

/**
 * Global environment containing built-in operators and functions
 */
const globalEnv = {
  '+': (args) => {
    if (args.length === 0) return 0;
    if (args.every((a) => typeof a === 'number')) {
      return args.reduce((acc, val) => acc + val, 0);
    } else if (args.every((a) => typeof a === 'string')) {
      return args.reduce((acc, val) => acc + val, '');
    } else {
      throw new Error('Type mismatch: + requires all numbers or all strings');
    }
  },

  '-': (args) => {
    if (args.length === 0) return 0;
    if (!args.every((a) => typeof a === 'number')) {
      throw new Error('Type error: - requires numeric arguments');
    }
    return args.length === 1 ? -args[0] : args.reduce((acc, val) => acc - val);
  },

  '*': (args) => {
    if (args.length === 0) return 1;
    if (!args.every((a) => typeof a === 'number')) {
      throw new Error('Type error: * requires numeric arguments');
    }
    return args.reduce((acc, val) => acc * val, 1);
  },

  '/': (args) => {
    if (args.length === 0) {
      throw new Error('Division requires at least one argument');
    }
    if (!args.every((a) => typeof a === 'number')) {
      throw new Error('Type error: / requires numeric arguments');
    }
    if (args.slice(1).some(val => val === 0)) {
      throw new Error('Division by zero');
    }
    return args.reduce((acc, val) => acc / val);
  },

  '>': (args) => {
    if (args.length < 2) return true;
    return args.every((val, index) => index === 0 || args[index - 1] > val);
  },

  '<': (args) => {
    if (args.length < 2) return true;
    return args.every((val, index) => index === 0 || args[index - 1] < val);
  },

  and: (args, env) => {
    for (const arg of args) {
      if (!evaluate(arg, env)) {
        return false;
      }
    }
    return true;
  },

  or: (args, env) => {
    for (const arg of args) {
      if (evaluate(arg, env)) {
        return true;
      }
    }
    return false;
  },

  not: (args, env) => {
    if (args.length !== 1) {
      throw new Error('not requires exactly one argument');
    }
    return !evaluate(args[0], env);
  },
};

const primitiveOps = ['+', '-', '*', '/', '>', '<', 'not', 'and', 'or'];

/**
 * Evaluates a λ.json expression in the given environment
 */
function evaluate(exp, env) {
  // Self-evaluating expressions
  if (typeof exp === 'number') {
    return exp;
  }
  
  if (typeof exp === 'boolean') {
    return exp;
  }
  
  // String handling
  if (typeof exp === 'string') {
    // Quoted strings (literals)
    if (exp.startsWith("'")) {
      return exp.substring(1);
    }
    // Variable lookup
    if (env[exp] !== undefined) {
      return env[exp];
    }
    if (globalEnv[exp] !== undefined) {
      return globalEnv[exp];
    }
    // Return as literal if not found
    return exp;
  }
  
  // Array expressions
  if (Array.isArray(exp)) {
    if (exp.length === 0) {
      return exp;
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
      globalEnv[variable] = evaluate(value, env);
      return globalEnv[variable];
    }

    if (operator === 'lambda' || operator === 'λ') {
      if (args.length !== 2) {
        throw new Error('lambda requires exactly 2 arguments: parameters and body');
      }
      const [parameters, body] = args;
      if (!Array.isArray(parameters)) {
        throw new Error('lambda parameters must be an array');
      }
      return (...evalArgs) => {
        const localEnv = { ...globalEnv, ...env };
        parameters.forEach((param, index) => {
          localEnv[param] = evalArgs[index];
        });
        return evaluate(body, localEnv);
      };
    }

    if (operator === 'if') {
      if (args.length !== 3) {
        throw new Error('if requires exactly 3 arguments: condition, true-branch, false-branch');
      }
      const [condition, trueBranch, falseBranch] = args;
      const conditionResult = evaluate(condition, env);
      return conditionResult
        ? evaluate(trueBranch, env)
        : evaluate(falseBranch, env);
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
        if (condition === 'else' || evaluate(condition, env)) {
          return evaluate(expr, env);
        }
      }
      return undefined;
    }

    if (operator === 'let') {
      if (args.length !== 2) {
        throw new Error('let requires exactly 2 arguments: bindings and body');
      }
      const [bindings, body] = args;
      if (!Array.isArray(bindings)) {
        throw new Error('let bindings must be an array');
      }
      const localEnv = { ...env };
      bindings.forEach((binding) => {
        if (!Array.isArray(binding) || binding.length !== 2) {
          throw new Error('let binding must be [variable, value]');
        }
        const [variable, value] = binding;
        localEnv[variable] = evaluate(value, env);
      });
      return evaluate(body, localEnv);
    }

    if (operator === 'let*') {
      if (args.length !== 2) {
        throw new Error('let* requires exactly 2 arguments: bindings and body');
      }
      const [bindings, body] = args;
      if (!Array.isArray(bindings)) {
        throw new Error('let* bindings must be an array');
      }
      const localEnv = { ...env };
      bindings.forEach((binding) => {
        if (!Array.isArray(binding) || binding.length !== 2) {
          throw new Error('let* binding must be [variable, value]');
        }
        const [variable, value] = binding;
        localEnv[variable] = evaluate(value, localEnv);
      });
      return evaluate(body, localEnv);
    }

    if (operator === 'quote') {
      if (args.length !== 1) {
        throw new Error('quote requires exactly one argument');
      }
      return args[0];
    }

    if (operator === 'eq?') {
      if (args.length !== 2) {
        throw new Error('eq? requires exactly 2 arguments');
      }
      const [arg1, arg2] = args;
      const value1 = evaluate(arg1, env);
      const value2 = evaluate(arg2, env);
      return value1 === value2;
    }

    if (operator === 'divides?') {
      if (args.length !== 2) {
        throw new Error('divides? requires exactly 2 arguments');
      }
      const x = evaluate(args[0], env);
      const y = evaluate(args[1], env);
      if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error('divides? requires numeric arguments');
      }
      if (x === 0) return false;
      return y % x === 0;
    }

    if (operator === 'length') {
      if (args.length !== 1) {
        throw new Error('length requires exactly one argument');
      }
      const list = evaluate(args[0], env);
      if (!Array.isArray(list)) {
        throw new Error('length requires an array argument');
      }
      return list.length;
    }

    // Higher-order functions
    if (operator === 'map') {
      if (args.length !== 2) {
        throw new Error('map requires exactly 2 arguments: procedure and list');
      }
      const [proc, list] = args;
      const evaluatedList = evaluate(list, env);
      const evaluatedProc = evaluate(proc, env);
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
      const evaluatedList = evaluate(list, env);
      const evaluatedProc = evaluate(proc, env);
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
      const evaluatedList = evaluate(list, env);
      const evaluatedProc = evaluate(proc, env);
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
      const headValue = evaluate(args[0], env);
      const tailThunk = () => evaluate(args[1], env);
      return { head: headValue, tail: tailThunk };
    }

    if (operator === 'delay') {
      if (args.length !== 1) {
        throw new Error('delay requires exactly one argument');
      }
      return function* () {
        for (const arg of args[0]) {
          yield evaluate(arg, env);
        }
      };
    }

    if (operator === 'head') {
      if (args.length !== 1) {
        throw new Error('head requires exactly one argument');
      }
      const stream = evaluate(args[0], env);
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
      const stream = evaluate(args[0], env);
      if (typeof stream === 'function') {
        return function* () {
          const generator = stream();
          generator.next();
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
      const forced = evaluate(args[0], env);
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
      let n = evaluate(args[0], env);
      let stream = evaluate(args[1], env);
      
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
      const n = evaluate(args[0], env);
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
      const fn = evaluate(args[0], env);
      const stream = evaluate(args[1], env);
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
      const predicate = evaluate(args[0], env);
      const stream = evaluate(args[1], env);
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
    const evaluatedOperator = evaluate(operator, env);
    const evaluatedArgs = args.map((arg) => evaluate(arg, env));

    if (typeof evaluatedOperator === 'function') {
      // Special handling for logical operators that need environment
      if (operator === 'and' || operator === 'or' || operator === 'not') {
        return evaluatedOperator(args, env);
      }
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