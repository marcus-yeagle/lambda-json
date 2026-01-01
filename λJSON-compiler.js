/**
 * λJSON Bytecode Compiler
 * 
 * Compiles λJSON AST (JSON arrays) into bytecode for the VM.
 * The compiled bytecode can be executed much faster than tree-walking.
 * 
 * @module λJSON-compiler
 */

const {
  OP_PUSH_CONST,
  OP_PUSH_NULL,
  OP_PUSH_TRUE,
  OP_PUSH_FALSE,
  OP_POP,
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
  disassemble
} = require('./λJSON-opcodes.js');

/**
 * Compiled function template (stored in constant pool)
 * Contains bytecode, parameter names, and metadata
 */
class FunctionTemplate {
  constructor(params, code, constants, name = null) {
    this.params = params;        // Array of parameter names
    this.code = code;            // Bytecode array
    this.constants = constants;  // Constant pool for this function
    this.name = name;            // Optional name for debugging
    this.arity = params.length;
  }
}

/**
 * Bytecode Compiler for λJSON
 * 
 * Compiles λJSON expressions into bytecode arrays and constant pools.
 */
class Compiler {
  constructor() {
    this.code = [];              // Bytecode output
    this.constants = [];         // Constant pool
    this.constantMap = new Map(); // For deduplication
    this.locals = [];            // Stack of local variable scopes
  }

  /**
   * Reset compiler state for a new compilation
   */
  reset() {
    this.code = [];
    this.constants = [];
    this.constantMap.clear();
    this.locals = [];
  }

  /**
   * Add a constant to the pool (with deduplication)
   * @param {*} value - The constant value
   * @returns {number} Index in constant pool
   */
  addConstant(value) {
    // For primitives, deduplicate
    const key = typeof value === 'object' ? null : String(value) + '::' + typeof value;
    
    if (key !== null && this.constantMap.has(key)) {
      return this.constantMap.get(key);
    }
    
    const index = this.constants.length;
    this.constants.push(value);
    
    if (key !== null) {
      this.constantMap.set(key, index);
    }
    
    return index;
  }

  /**
   * Emit an opcode (and optional argument)
   * @param {number} opcode - The opcode
   * @param {number} [arg] - Optional argument
   * @returns {number} Position of emitted instruction
   */
  emit(opcode, arg = null) {
    const pos = this.code.length;
    this.code.push(opcode);
    if (arg !== null) {
      this.code.push(arg);
    }
    return pos;
  }

  /**
   * Emit a jump instruction with placeholder
   * @param {number} opcode - Jump opcode
   * @returns {number} Position to patch later
   */
  emitJump(opcode) {
    const pos = this.emit(opcode, 0);
    return pos + 1; // Return position of the address to patch
  }

  /**
   * Patch a jump instruction with actual address
   * @param {number} pos - Position of the address to patch
   * @param {number} [addr] - Target address (default: current position)
   */
  patchJump(pos, addr = null) {
    this.code[pos] = addr !== null ? addr : this.code.length;
  }

  /**
   * Enter a new local scope
   * @param {Array<string>} vars - Variables in this scope
   */
  pushScope(vars = []) {
    this.locals.push(new Set(vars));
  }

  /**
   * Exit current local scope
   */
  popScope() {
    this.locals.pop();
  }

  /**
   * Check if a variable is local
   * @param {string} name - Variable name
   * @returns {boolean}
   */
  isLocal(name) {
    for (let i = this.locals.length - 1; i >= 0; i--) {
      if (this.locals[i].has(name)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Add a local variable to current scope
   * @param {string} name - Variable name
   */
  addLocal(name) {
    if (this.locals.length > 0) {
      this.locals[this.locals.length - 1].add(name);
    }
  }

  /**
   * Compile an expression
   * @param {*} exp - λJSON expression
   * @param {boolean} tailPosition - Whether this is in tail position
   */
  compile(exp, tailPosition = false) {
    // Null
    if (exp === null) {
      this.emit(OP_PUSH_NULL);
      return;
    }

    // Booleans
    if (exp === true) {
      this.emit(OP_PUSH_TRUE);
      return;
    }
    if (exp === false) {
      this.emit(OP_PUSH_FALSE);
      return;
    }

    // Numbers
    if (typeof exp === 'number') {
      const idx = this.addConstant(exp);
      this.emit(OP_PUSH_CONST, idx);
      return;
    }

    // Strings (variable reference or symbol)
    if (typeof exp === 'string') {
      // Check for deprecated quote prefix
      if (exp.startsWith("'")) {
        const idx = this.addConstant(exp.substring(1));
        this.emit(OP_PUSH_CONST, idx);
        return;
      }
      
      // Variable lookup
      const nameIdx = this.addConstant(exp);
      if (this.isLocal(exp)) {
        this.emit(OP_LOAD_VAR, nameIdx);
      } else {
        this.emit(OP_LOAD_GLOBAL, nameIdx);
      }
      return;
    }

    // Plain objects pass through as constants
    if (typeof exp === 'object' && !Array.isArray(exp)) {
      const idx = this.addConstant(exp);
      this.emit(OP_PUSH_CONST, idx);
      return;
    }

    // Arrays (function calls and special forms)
    if (Array.isArray(exp)) {
      if (exp.length === 0) {
        const idx = this.addConstant([]);
        this.emit(OP_PUSH_CONST, idx);
        return;
      }

      const [op, ...args] = exp;

      // Special forms
      if (op === 'quote') {
        const idx = this.addConstant(args[0]);
        this.emit(OP_PUSH_CONST, idx);
        return;
      }

      if (op === 'define') {
        const [name, value] = args;
        this.compile(value, false);
        const nameIdx = this.addConstant(name);
        this.emit(OP_STORE_GLOBAL, nameIdx);
        // Define returns the value, so duplicate it before storing
        return;
      }

      if (op === 'lambda' || op === 'λ') {
        this.compileLambda(args, tailPosition);
        return;
      }

      if (op === 'if') {
        this.compileIf(args, tailPosition);
        return;
      }

      if (op === 'cond') {
        this.compileCond(args, tailPosition);
        return;
      }

      if (op === 'let') {
        this.compileLet(args, tailPosition);
        return;
      }

      if (op === 'let*') {
        this.compileLetStar(args, tailPosition);
        return;
      }

      // Inlined arithmetic operations
      if (op === '+') {
        for (const arg of args) {
          this.compile(arg, false);
        }
        this.emit(OP_ADD, args.length);
        return;
      }

      if (op === '-') {
        for (const arg of args) {
          this.compile(arg, false);
        }
        this.emit(OP_SUB, args.length);
        return;
      }

      if (op === '*') {
        for (const arg of args) {
          this.compile(arg, false);
        }
        this.emit(OP_MUL, args.length);
        return;
      }

      if (op === '/') {
        for (const arg of args) {
          this.compile(arg, false);
        }
        this.emit(OP_DIV, args.length);
        return;
      }

      if (op === '%') {
        this.compile(args[0], false);
        this.compile(args[1], false);
        this.emit(OP_MOD);
        return;
      }

      // Comparison operations
      if (op === 'eq?') {
        this.compile(args[0], false);
        this.compile(args[1], false);
        this.emit(OP_EQ);
        return;
      }

      if (op === '<') {
        for (const arg of args) {
          this.compile(arg, false);
        }
        this.emit(OP_LT, args.length);
        return;
      }

      if (op === '>') {
        for (const arg of args) {
          this.compile(arg, false);
        }
        this.emit(OP_GT, args.length);
        return;
      }

      if (op === '<=') {
        for (const arg of args) {
          this.compile(arg, false);
        }
        this.emit(OP_LTE, args.length);
        return;
      }

      if (op === '>=') {
        for (const arg of args) {
          this.compile(arg, false);
        }
        this.emit(OP_GTE, args.length);
        return;
      }

      // Logical operations
      if (op === 'not') {
        this.compile(args[0], false);
        this.emit(OP_NOT);
        return;
      }

      // List operations
      if (op === 'list') {
        for (const arg of args) {
          this.compile(arg, false);
        }
        this.emit(OP_MAKE_LIST, args.length);
        return;
      }

      if (op === 'car') {
        this.compile(args[0], false);
        this.emit(OP_CAR);
        return;
      }

      if (op === 'cdr') {
        this.compile(args[0], false);
        this.emit(OP_CDR);
        return;
      }

      if (op === 'cons') {
        this.compile(args[0], false);
        this.compile(args[1], false);
        this.emit(OP_CONS);
        return;
      }

      if (op === 'length') {
        this.compile(args[0], false);
        this.emit(OP_LENGTH);
        return;
      }

      if (op === 'nth') {
        this.compile(args[0], false);
        this.compile(args[1], false);
        this.emit(OP_NTH);
        return;
      }

      // Object operations
      if (op === 'get') {
        this.compile(args[0], false);
        this.compile(args[1], false);
        this.emit(OP_GET);
        return;
      }

      if (op === 'keys') {
        this.compile(args[0], false);
        this.emit(OP_KEYS);
        return;
      }

      if (op === 'values') {
        this.compile(args[0], false);
        this.emit(OP_VALUES);
        return;
      }

      // Generic function call
      this.compile(op, false); // Compile the function
      for (const arg of args) {
        this.compile(arg, false); // Compile arguments
      }
      
      // Use tail call if in tail position
      if (tailPosition) {
        this.emit(OP_TAIL_CALL, args.length);
      } else {
        this.emit(OP_CALL, args.length);
      }
      return;
    }

    // Unknown expression type
    throw new Error(`Cannot compile expression: ${JSON.stringify(exp)}`);
  }

  /**
   * Compile a lambda expression
   * @param {Array} args - [params, body]
   * @param {boolean} tailPosition - Whether lambda is in tail position
   */
  compileLambda(args, tailPosition) {
    const [params, body] = args;
    
    // Create a new compiler for the function body
    const funcCompiler = new Compiler();
    funcCompiler.pushScope(params);
    funcCompiler.compile(body, true); // Body is always in tail position
    funcCompiler.emit(OP_RETURN);
    
    // Create function template
    const template = new FunctionTemplate(
      params,
      funcCompiler.code,
      funcCompiler.constants
    );
    
    // Add template to constant pool and emit closure creation
    const templateIdx = this.addConstant(template);
    this.emit(OP_MAKE_CLOSURE, templateIdx);
  }

  /**
   * Compile an if expression
   * @param {Array} args - [condition, then, else]
   * @param {boolean} tailPosition
   */
  compileIf(args, tailPosition) {
    const [condition, thenBranch, elseBranch] = args;
    
    // Compile condition
    this.compile(condition, false);
    
    // Jump to else if false
    const jumpToElse = this.emitJump(OP_JUMP_IF_FALSE);
    
    // Compile then branch
    this.compile(thenBranch, tailPosition);
    
    // Jump over else branch
    const jumpToEnd = this.emitJump(OP_JUMP);
    
    // Patch jump to else
    this.patchJump(jumpToElse);
    
    // Compile else branch
    this.compile(elseBranch, tailPosition);
    
    // Patch jump to end
    this.patchJump(jumpToEnd);
  }

  /**
   * Compile a cond expression
   * @param {Array} clauses - Array of [condition, expr] pairs
   * @param {boolean} tailPosition
   */
  compileCond(clauses, tailPosition) {
    const jumpToEnds = [];
    
    for (let i = 0; i < clauses.length; i++) {
      const [condition, expr] = clauses[i];
      const isLast = i === clauses.length - 1;
      
      // Handle 'else' clause
      if (condition === 'else') {
        this.compile(expr, tailPosition);
        break;
      }
      
      // Compile condition
      this.compile(condition, false);
      
      // Jump to next clause if false
      const jumpToNext = this.emitJump(OP_JUMP_IF_FALSE);
      
      // Compile expression
      this.compile(expr, tailPosition);
      
      // Jump to end (unless last clause)
      if (!isLast) {
        jumpToEnds.push(this.emitJump(OP_JUMP));
      }
      
      // Patch jump to next
      this.patchJump(jumpToNext);
    }
    
    // Patch all jumps to end
    for (const jumpPos of jumpToEnds) {
      this.patchJump(jumpPos);
    }
  }

  /**
   * Compile a let expression
   * @param {Array} args - [bindings, body]
   * @param {boolean} tailPosition
   */
  compileLet(args, tailPosition) {
    const [bindings, body] = args;
    
    // Enter new scope
    this.pushScope();
    
    // Compile each binding
    for (const [name, value] of bindings) {
      this.compile(value, false);
      const nameIdx = this.addConstant(name);
      this.emit(OP_STORE_VAR, nameIdx);
      this.addLocal(name);
    }
    
    // Compile body
    this.compile(body, tailPosition);
    
    // Exit scope
    this.popScope();
  }

  /**
   * Compile a let* expression
   * @param {Array} args - [bindings, body]
   * @param {boolean} tailPosition
   */
  compileLetStar(args, tailPosition) {
    const [bindings, body] = args;
    
    // Enter new scope
    this.pushScope();
    
    // Compile each binding (each can see previous ones)
    for (const [name, value] of bindings) {
      this.compile(value, false);
      const nameIdx = this.addConstant(name);
      this.emit(OP_STORE_VAR, nameIdx);
      this.addLocal(name);
    }
    
    // Compile body
    this.compile(body, tailPosition);
    
    // Exit scope
    this.popScope();
  }

  /**
   * Compile a complete λJSON expression and return compiled code
   * @param {*} exp - Expression to compile
   * @returns {{code: Array<number>, constants: Array}} Compiled bytecode
   */
  compileProgram(exp) {
    this.reset();
    this.compile(exp, false);
    this.emit(OP_HALT);
    
    return {
      code: this.code,
      constants: this.constants
    };
  }

  /**
   * Disassemble compiled code for debugging
   * @param {Object} compiled - Output from compileProgram
   * @returns {string} Human-readable disassembly
   */
  static disassemble(compiled) {
    return disassemble(compiled.code, compiled.constants);
  }
}

module.exports = {
  Compiler,
  FunctionTemplate
};

