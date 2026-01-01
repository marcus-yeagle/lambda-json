/**
 * λJSON Virtual Machine
 * 
 * A stack-based bytecode interpreter for compiled λJSON programs.
 * Executes bytecode produced by the λJSON compiler.
 * 
 * @module λJSON-vm
 */

const {
  OP_PUSH_CONST,
  OP_PUSH_NULL,
  OP_PUSH_TRUE,
  OP_PUSH_FALSE,
  OP_POP,
  OP_DUP,
  OP_LOAD_VAR,
  OP_STORE_VAR,
  OP_LOAD_GLOBAL,
  OP_STORE_GLOBAL,
  OP_CALL,
  OP_TAIL_CALL,
  OP_RETURN,
  OP_MAKE_CLOSURE,
  OP_JUMP,
  OP_JUMP_IF_FALSE,
  OP_JUMP_IF_TRUE,
  OP_ADD,
  OP_SUB,
  OP_MUL,
  OP_DIV,
  OP_MOD,
  OP_EQ,
  OP_LT,
  OP_GT,
  OP_LTE,
  OP_GTE,
  OP_NOT,
  OP_MAKE_LIST,
  OP_CAR,
  OP_CDR,
  OP_CONS,
  OP_LENGTH,
  OP_NTH,
  OP_GET,
  OP_KEYS,
  OP_VALUES,
  OP_HALT,
  getOpcodeName
} = require('./λJSON-opcodes.js');

const { FunctionTemplate } = require('./λJSON-compiler.js');

/**
 * Closure object - a function with its captured environment
 */
class Closure {
  constructor(template, env) {
    this.template = template;  // FunctionTemplate
    this.env = env;            // Captured environment
  }
}

/**
 * Call frame for the VM stack
 */
class CallFrame {
  constructor(closure, ip, bp) {
    this.closure = closure;    // The closure being executed
    this.ip = ip;              // Instruction pointer (return address)
    this.bp = bp;              // Base pointer (stack position before call)
  }
}

/**
 * VM execution options
 */
const defaultVMOptions = {
  maxStackSize: 10000,
  maxCallDepth: 1000,
  maxExecutionTime: 5000,  // ms
  traceExecution: false
};

/**
 * λJSON Virtual Machine
 */
class VM {
  /**
   * Create a new VM instance
   * @param {Object} options - VM configuration options
   */
  constructor(options = {}) {
    this.options = { ...defaultVMOptions, ...options };
    this.reset();
  }

  /**
   * Reset VM state
   */
  reset() {
    this.stack = [];           // Value stack
    this.frames = [];          // Call frame stack
    this.globals = new Map();  // Global bindings
    this.locals = new Map();   // Current local bindings
    this.ip = 0;               // Instruction pointer
    this.code = [];            // Current bytecode
    this.constants = [];       // Current constant pool
    this.halted = false;
    this.startTime = 0;
    
    // Initialize global environment with built-in functions
    this.initializeGlobals();
  }

  /**
   * Initialize built-in global functions
   */
  initializeGlobals() {
    // Type predicates
    this.globals.set('null?', (args) => args[0] === null);
    this.globals.set('list?', (args) => Array.isArray(args[0]));
    this.globals.set('number?', (args) => typeof args[0] === 'number');
    this.globals.set('string?', (args) => typeof args[0] === 'string');
    this.globals.set('boolean?', (args) => typeof args[0] === 'boolean');
    this.globals.set('object?', (args) => args[0] !== null && typeof args[0] === 'object' && !Array.isArray(args[0]));
    this.globals.set('function?', (args) => typeof args[0] === 'function' || args[0] instanceof Closure);
    
    // Math functions
    this.globals.set('abs', (args) => Math.abs(args[0]));
    this.globals.set('min', (args) => Math.min(...args));
    this.globals.set('max', (args) => Math.max(...args));
    this.globals.set('floor', (args) => Math.floor(args[0]));
    this.globals.set('ceil', (args) => Math.ceil(args[0]));
    this.globals.set('round', (args) => Math.round(args[0]));
    
    // Object functions
    this.globals.set('assoc', (args) => ({ ...args[0], [args[1]]: args[2] }));
    this.globals.set('dissoc', (args) => {
      const result = { ...args[0] };
      delete result[args[1]];
      return result;
    });
    this.globals.set('merge', (args) => Object.assign({}, ...args));
    this.globals.set('has-key?', (args) => Object.prototype.hasOwnProperty.call(args[0], args[1]));
    
    // List functions
    this.globals.set('append', (args) => args.flat());
    
    // Higher-order functions (need special handling in VM)
    this.globals.set('map', null);  // Handled specially
    this.globals.set('filter', null);
    this.globals.set('reduce', null);
  }

  /**
   * Push a value onto the stack
   * @param {*} value
   */
  push(value) {
    if (this.stack.length >= this.options.maxStackSize) {
      throw new Error('Stack overflow');
    }
    this.stack.push(value);
  }

  /**
   * Pop a value from the stack
   * @returns {*}
   */
  pop() {
    if (this.stack.length === 0) {
      throw new Error('Stack underflow');
    }
    return this.stack.pop();
  }

  /**
   * Peek at top of stack without popping
   * @returns {*}
   */
  peek() {
    return this.stack[this.stack.length - 1];
  }

  /**
   * Check execution limits
   */
  checkLimits() {
    if (this.frames.length > this.options.maxCallDepth) {
      throw new Error(`Maximum call depth exceeded (${this.options.maxCallDepth})`);
    }
    
    if (this.options.maxExecutionTime > 0) {
      const elapsed = Date.now() - this.startTime;
      if (elapsed > this.options.maxExecutionTime) {
        throw new Error(`Maximum execution time exceeded (${this.options.maxExecutionTime}ms)`);
      }
    }
  }

  /**
   * Execute compiled bytecode
   * @param {{code: Array<number>, constants: Array}} compiled - Compiled program
   * @returns {*} Result of execution
   */
  run(compiled) {
    this.code = compiled.code;
    this.constants = compiled.constants;
    this.ip = 0;
    this.halted = false;
    this.startTime = Date.now();
    
    while (!this.halted && this.ip < this.code.length) {
      this.checkLimits();
      this.step();
    }
    
    return this.stack.length > 0 ? this.pop() : null;
  }

  /**
   * Execute a single instruction
   */
  step() {
    const opcode = this.code[this.ip++];
    
    if (this.options.traceExecution) {
      console.log(`${(this.ip - 1).toString().padStart(4)}: ${getOpcodeName(opcode)} stack=[${this.stack.slice(-5).map(v => JSON.stringify(v)).join(', ')}]`);
    }

    switch (opcode) {
      case OP_PUSH_CONST: {
        const idx = this.code[this.ip++];
        this.push(this.constants[idx]);
        break;
      }

      case OP_PUSH_NULL:
        this.push(null);
        break;

      case OP_PUSH_TRUE:
        this.push(true);
        break;

      case OP_PUSH_FALSE:
        this.push(false);
        break;

      case OP_POP:
        this.pop();
        break;

      case OP_DUP:
        this.push(this.peek());
        break;

      case OP_LOAD_VAR: {
        const nameIdx = this.code[this.ip++];
        const name = this.constants[nameIdx];
        
        if (this.locals.has(name)) {
          this.push(this.locals.get(name));
        } else if (this.globals.has(name)) {
          this.push(this.globals.get(name));
        } else {
          throw new Error(`Unbound variable: ${name}`);
        }
        break;
      }

      case OP_STORE_VAR: {
        const nameIdx = this.code[this.ip++];
        const name = this.constants[nameIdx];
        const value = this.peek(); // Leave value on stack
        this.locals.set(name, value);
        break;
      }

      case OP_LOAD_GLOBAL: {
        const nameIdx = this.code[this.ip++];
        const name = this.constants[nameIdx];
        
        if (this.globals.has(name)) {
          this.push(this.globals.get(name));
        } else {
          // Return as symbol if not found (backwards compatible)
          this.push(name);
        }
        break;
      }

      case OP_STORE_GLOBAL: {
        const nameIdx = this.code[this.ip++];
        const name = this.constants[nameIdx];
        const value = this.peek();
        this.globals.set(name, value);
        break;
      }

      case OP_CALL: {
        const arity = this.code[this.ip++];
        this.doCall(arity, false);
        break;
      }

      case OP_TAIL_CALL: {
        const arity = this.code[this.ip++];
        this.doCall(arity, true);
        break;
      }

      case OP_RETURN: {
        const result = this.pop();
        
        if (this.frames.length === 0) {
          this.push(result);
          this.halted = true;
        } else {
          const frame = this.frames.pop();
          
          // Restore state
          this.code = frame.closure.template.code;
          this.constants = frame.closure.template.constants;
          this.ip = frame.ip;
          this.stack.length = frame.bp;
          this.locals = frame.closure.env;
          
          this.push(result);
        }
        break;
      }

      case OP_MAKE_CLOSURE: {
        const templateIdx = this.code[this.ip++];
        const template = this.constants[templateIdx];
        const closure = new Closure(template, new Map(this.locals));
        this.push(closure);
        break;
      }

      case OP_JUMP: {
        const addr = this.code[this.ip++];
        this.ip = addr;
        break;
      }

      case OP_JUMP_IF_FALSE: {
        const addr = this.code[this.ip++];
        const cond = this.pop();
        if (!cond) {
          this.ip = addr;
        }
        break;
      }

      case OP_JUMP_IF_TRUE: {
        const addr = this.code[this.ip++];
        const cond = this.pop();
        if (cond) {
          this.ip = addr;
        }
        break;
      }

      case OP_ADD: {
        const count = this.code[this.ip++];
        const args = [];
        for (let i = 0; i < count; i++) {
          args.unshift(this.pop());
        }
        if (count === 0) {
          this.push(0);
        } else if (typeof args[0] === 'string') {
          this.push(args.join(''));
        } else {
          this.push(args.reduce((a, b) => a + b, 0));
        }
        break;
      }

      case OP_SUB: {
        const count = this.code[this.ip++];
        const args = [];
        for (let i = 0; i < count; i++) {
          args.unshift(this.pop());
        }
        if (count === 0) {
          this.push(0);
        } else if (count === 1) {
          this.push(-args[0]);
        } else {
          this.push(args.reduce((a, b) => a - b));
        }
        break;
      }

      case OP_MUL: {
        const count = this.code[this.ip++];
        const args = [];
        for (let i = 0; i < count; i++) {
          args.unshift(this.pop());
        }
        this.push(args.reduce((a, b) => a * b, 1));
        break;
      }

      case OP_DIV: {
        const count = this.code[this.ip++];
        const args = [];
        for (let i = 0; i < count; i++) {
          args.unshift(this.pop());
        }
        if (args.slice(1).some(x => x === 0)) {
          throw new Error('Division by zero');
        }
        this.push(args.reduce((a, b) => a / b));
        break;
      }

      case OP_MOD: {
        const b = this.pop();
        const a = this.pop();
        this.push(a % b);
        break;
      }

      case OP_EQ: {
        const b = this.pop();
        const a = this.pop();
        this.push(a === b);
        break;
      }

      case OP_LT: {
        const count = this.code[this.ip++];
        const args = [];
        for (let i = 0; i < count; i++) {
          args.unshift(this.pop());
        }
        let result = true;
        for (let i = 0; i < args.length - 1; i++) {
          if (!(args[i] < args[i + 1])) {
            result = false;
            break;
          }
        }
        this.push(result);
        break;
      }

      case OP_GT: {
        const count = this.code[this.ip++];
        const args = [];
        for (let i = 0; i < count; i++) {
          args.unshift(this.pop());
        }
        let result = true;
        for (let i = 0; i < args.length - 1; i++) {
          if (!(args[i] > args[i + 1])) {
            result = false;
            break;
          }
        }
        this.push(result);
        break;
      }

      case OP_LTE: {
        const count = this.code[this.ip++];
        const args = [];
        for (let i = 0; i < count; i++) {
          args.unshift(this.pop());
        }
        let result = true;
        for (let i = 0; i < args.length - 1; i++) {
          if (!(args[i] <= args[i + 1])) {
            result = false;
            break;
          }
        }
        this.push(result);
        break;
      }

      case OP_GTE: {
        const count = this.code[this.ip++];
        const args = [];
        for (let i = 0; i < count; i++) {
          args.unshift(this.pop());
        }
        let result = true;
        for (let i = 0; i < args.length - 1; i++) {
          if (!(args[i] >= args[i + 1])) {
            result = false;
            break;
          }
        }
        this.push(result);
        break;
      }

      case OP_NOT: {
        const val = this.pop();
        this.push(!val);
        break;
      }

      case OP_MAKE_LIST: {
        const count = this.code[this.ip++];
        const items = [];
        for (let i = 0; i < count; i++) {
          items.unshift(this.pop());
        }
        this.push(items);
        break;
      }

      case OP_CAR: {
        const list = this.pop();
        this.push(list.length > 0 ? list[0] : null);
        break;
      }

      case OP_CDR: {
        const list = this.pop();
        this.push(list.slice(1));
        break;
      }

      case OP_CONS: {
        const list = this.pop();
        const elem = this.pop();
        this.push([elem, ...list]);
        break;
      }

      case OP_LENGTH: {
        const list = this.pop();
        this.push(list.length);
        break;
      }

      case OP_NTH: {
        const index = this.pop();
        const list = this.pop();
        this.push(index >= 0 && index < list.length ? list[index] : null);
        break;
      }

      case OP_GET: {
        const key = this.pop();
        const obj = this.pop();
        this.push(obj[key] !== undefined ? obj[key] : null);
        break;
      }

      case OP_KEYS: {
        const obj = this.pop();
        this.push(Object.keys(obj));
        break;
      }

      case OP_VALUES: {
        const obj = this.pop();
        this.push(Object.values(obj));
        break;
      }

      case OP_HALT:
        this.halted = true;
        break;

      default:
        throw new Error(`Unknown opcode: 0x${opcode.toString(16)}`);
    }
  }

  /**
   * Handle function call
   * @param {number} arity - Number of arguments
   * @param {boolean} tailCall - Whether this is a tail call
   */
  doCall(arity, tailCall) {
    // Pop arguments
    const args = [];
    for (let i = 0; i < arity; i++) {
      args.unshift(this.pop());
    }
    
    // Pop function
    const fn = this.pop();
    
    if (fn instanceof Closure) {
      // λJSON closure
      const template = fn.template;
      
      if (args.length !== template.arity) {
        throw new Error(`Expected ${template.arity} arguments, got ${args.length}`);
      }
      
      if (!tailCall) {
        // Save current frame
        this.frames.push(new CallFrame(
          { template: { code: this.code, constants: this.constants }, env: this.locals },
          this.ip,
          this.stack.length
        ));
      }
      
      // Set up new frame
      this.code = template.code;
      this.constants = template.constants;
      this.ip = 0;
      this.locals = new Map(fn.env);
      
      // Bind parameters
      for (let i = 0; i < template.params.length; i++) {
        this.locals.set(template.params[i], args[i]);
      }
    } else if (typeof fn === 'function') {
      // Native function
      const result = fn(args);
      this.push(result);
    } else if (this.globals.has(fn)) {
      // Global function by name
      const globalFn = this.globals.get(fn);
      if (typeof globalFn === 'function') {
        const result = globalFn(args);
        this.push(result);
      } else if (globalFn instanceof Closure) {
        // Recursively call closure
        this.push(fn);
        for (const arg of args) {
          this.push(arg);
        }
        this.doCall(arity, tailCall);
      } else {
        throw new Error(`Cannot call: ${fn}`);
      }
    } else {
      throw new Error(`Cannot call: ${JSON.stringify(fn)}`);
    }
  }
}

module.exports = {
  VM,
  Closure,
  CallFrame,
  defaultVMOptions
};

