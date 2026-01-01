/**
 * λJSON Bytecode Instruction Set
 * 
 * This module defines the opcodes for the λJSON bytecode virtual machine.
 * Each instruction is represented as an opcode constant.
 * 
 * Instruction Format:
 * - Most instructions are 2 bytes: [opcode, argument]
 * - Some instructions use extended arguments (4 bytes for larger values)
 * 
 * @module λJSON-opcodes
 */

// ============================================
// Opcode Constants
// ============================================

/**
 * Stack Operations
 */
const OP_PUSH_CONST = 0x01;    // Push constant from pool onto stack
const OP_PUSH_NULL = 0x02;     // Push null onto stack
const OP_PUSH_TRUE = 0x03;     // Push true onto stack
const OP_PUSH_FALSE = 0x04;    // Push false onto stack
const OP_POP = 0x05;           // Discard top of stack
const OP_DUP = 0x06;           // Duplicate top of stack

/**
 * Variable Operations
 */
const OP_LOAD_VAR = 0x10;      // Load variable by name index (from constant pool)
const OP_STORE_VAR = 0x11;     // Store to variable by name index
const OP_LOAD_GLOBAL = 0x12;   // Load from global environment
const OP_STORE_GLOBAL = 0x13;  // Store to global environment (define)

/**
 * Function Operations
 */
const OP_CALL = 0x20;          // Call function with N args
const OP_TAIL_CALL = 0x21;     // Tail call optimization
const OP_RETURN = 0x22;        // Return top of stack
const OP_MAKE_CLOSURE = 0x23;  // Create closure from template

/**
 * Control Flow
 */
const OP_JUMP = 0x30;          // Unconditional jump to address
const OP_JUMP_IF_FALSE = 0x31; // Jump if top of stack is falsy
const OP_JUMP_IF_TRUE = 0x32;  // Jump if top of stack is truthy

/**
 * Arithmetic Operations (inlined for performance)
 */
const OP_ADD = 0x40;           // Add top two stack values
const OP_SUB = 0x41;           // Subtract
const OP_MUL = 0x42;           // Multiply
const OP_DIV = 0x43;           // Divide
const OP_MOD = 0x44;           // Modulo
const OP_NEG = 0x45;           // Negate (unary minus)

/**
 * Comparison Operations
 */
const OP_EQ = 0x50;            // Equality check (eq?)
const OP_LT = 0x51;            // Less than
const OP_GT = 0x52;            // Greater than
const OP_LTE = 0x53;           // Less than or equal
const OP_GTE = 0x54;           // Greater than or equal

/**
 * Logical Operations
 */
const OP_NOT = 0x60;           // Logical NOT
const OP_AND = 0x61;           // Logical AND (short-circuit)
const OP_OR = 0x62;            // Logical OR (short-circuit)

/**
 * List/Array Operations
 */
const OP_MAKE_LIST = 0x70;     // Create list from N stack items
const OP_CAR = 0x71;           // First element of list
const OP_CDR = 0x72;           // Rest of list
const OP_CONS = 0x73;          // Prepend element to list
const OP_LENGTH = 0x74;        // List length
const OP_NTH = 0x75;           // Get nth element

/**
 * Object Operations
 */
const OP_MAKE_OBJECT = 0x80;   // Create object from N key-value pairs
const OP_GET = 0x81;           // Get object property
const OP_KEYS = 0x82;          // Get object keys
const OP_VALUES = 0x83;        // Get object values

/**
 * Special Operations
 */
const OP_HALT = 0xFF;          // Stop execution

// ============================================
// Opcode Metadata
// ============================================

/**
 * Opcode information for debugging and disassembly
 */
const OPCODE_INFO = {
  [OP_PUSH_CONST]: { name: 'PUSH_CONST', hasArg: true, argType: 'const' },
  [OP_PUSH_NULL]: { name: 'PUSH_NULL', hasArg: false },
  [OP_PUSH_TRUE]: { name: 'PUSH_TRUE', hasArg: false },
  [OP_PUSH_FALSE]: { name: 'PUSH_FALSE', hasArg: false },
  [OP_POP]: { name: 'POP', hasArg: false },
  [OP_DUP]: { name: 'DUP', hasArg: false },
  
  [OP_LOAD_VAR]: { name: 'LOAD_VAR', hasArg: true, argType: 'const' },
  [OP_STORE_VAR]: { name: 'STORE_VAR', hasArg: true, argType: 'const' },
  [OP_LOAD_GLOBAL]: { name: 'LOAD_GLOBAL', hasArg: true, argType: 'const' },
  [OP_STORE_GLOBAL]: { name: 'STORE_GLOBAL', hasArg: true, argType: 'const' },
  
  [OP_CALL]: { name: 'CALL', hasArg: true, argType: 'arity' },
  [OP_TAIL_CALL]: { name: 'TAIL_CALL', hasArg: true, argType: 'arity' },
  [OP_RETURN]: { name: 'RETURN', hasArg: false },
  [OP_MAKE_CLOSURE]: { name: 'MAKE_CLOSURE', hasArg: true, argType: 'const' },
  
  [OP_JUMP]: { name: 'JUMP', hasArg: true, argType: 'addr' },
  [OP_JUMP_IF_FALSE]: { name: 'JUMP_IF_FALSE', hasArg: true, argType: 'addr' },
  [OP_JUMP_IF_TRUE]: { name: 'JUMP_IF_TRUE', hasArg: true, argType: 'addr' },
  
  [OP_ADD]: { name: 'ADD', hasArg: true, argType: 'arity' },
  [OP_SUB]: { name: 'SUB', hasArg: true, argType: 'arity' },
  [OP_MUL]: { name: 'MUL', hasArg: true, argType: 'arity' },
  [OP_DIV]: { name: 'DIV', hasArg: true, argType: 'arity' },
  [OP_MOD]: { name: 'MOD', hasArg: false },
  [OP_NEG]: { name: 'NEG', hasArg: false },
  
  [OP_EQ]: { name: 'EQ', hasArg: false },
  [OP_LT]: { name: 'LT', hasArg: true, argType: 'arity' },
  [OP_GT]: { name: 'GT', hasArg: true, argType: 'arity' },
  [OP_LTE]: { name: 'LTE', hasArg: true, argType: 'arity' },
  [OP_GTE]: { name: 'GTE', hasArg: true, argType: 'arity' },
  
  [OP_NOT]: { name: 'NOT', hasArg: false },
  [OP_AND]: { name: 'AND', hasArg: false },
  [OP_OR]: { name: 'OR', hasArg: false },
  
  [OP_MAKE_LIST]: { name: 'MAKE_LIST', hasArg: true, argType: 'count' },
  [OP_CAR]: { name: 'CAR', hasArg: false },
  [OP_CDR]: { name: 'CDR', hasArg: false },
  [OP_CONS]: { name: 'CONS', hasArg: false },
  [OP_LENGTH]: { name: 'LENGTH', hasArg: false },
  [OP_NTH]: { name: 'NTH', hasArg: false },
  
  [OP_MAKE_OBJECT]: { name: 'MAKE_OBJECT', hasArg: true, argType: 'count' },
  [OP_GET]: { name: 'GET', hasArg: false },
  [OP_KEYS]: { name: 'KEYS', hasArg: false },
  [OP_VALUES]: { name: 'VALUES', hasArg: false },
  
  [OP_HALT]: { name: 'HALT', hasArg: false }
};

/**
 * Get opcode name for debugging
 * @param {number} opcode - The opcode
 * @returns {string} Human-readable name
 */
function getOpcodeName(opcode) {
  const info = OPCODE_INFO[opcode];
  return info ? info.name : `UNKNOWN(0x${opcode.toString(16)})`;
}

/**
 * Disassemble a bytecode array for debugging
 * @param {Array<number>} code - Bytecode array
 * @param {Array} constants - Constant pool
 * @returns {string} Disassembly string
 */
function disassemble(code, constants = []) {
  const lines = [];
  let ip = 0;
  
  while (ip < code.length) {
    const opcode = code[ip];
    const info = OPCODE_INFO[opcode];
    
    if (!info) {
      lines.push(`${ip.toString().padStart(4, '0')}: UNKNOWN(0x${opcode.toString(16)})`);
      ip++;
      continue;
    }
    
    let line = `${ip.toString().padStart(4, '0')}: ${info.name}`;
    ip++;
    
    if (info.hasArg && ip < code.length) {
      const arg = code[ip++];
      
      if (info.argType === 'const' && constants[arg] !== undefined) {
        const constVal = constants[arg];
        const display = typeof constVal === 'string' ? `"${constVal}"` : JSON.stringify(constVal);
        line += ` ${arg} (${display})`;
      } else if (info.argType === 'addr') {
        line += ` @${arg}`;
      } else {
        line += ` ${arg}`;
      }
    }
    
    lines.push(line);
  }
  
  return lines.join('\n');
}

module.exports = {
  // Stack operations
  OP_PUSH_CONST,
  OP_PUSH_NULL,
  OP_PUSH_TRUE,
  OP_PUSH_FALSE,
  OP_POP,
  OP_DUP,
  
  // Variable operations
  OP_LOAD_VAR,
  OP_STORE_VAR,
  OP_LOAD_GLOBAL,
  OP_STORE_GLOBAL,
  
  // Function operations
  OP_CALL,
  OP_TAIL_CALL,
  OP_RETURN,
  OP_MAKE_CLOSURE,
  
  // Control flow
  OP_JUMP,
  OP_JUMP_IF_FALSE,
  OP_JUMP_IF_TRUE,
  
  // Arithmetic
  OP_ADD,
  OP_SUB,
  OP_MUL,
  OP_DIV,
  OP_MOD,
  OP_NEG,
  
  // Comparison
  OP_EQ,
  OP_LT,
  OP_GT,
  OP_LTE,
  OP_GTE,
  
  // Logical
  OP_NOT,
  OP_AND,
  OP_OR,
  
  // List operations
  OP_MAKE_LIST,
  OP_CAR,
  OP_CDR,
  OP_CONS,
  OP_LENGTH,
  OP_NTH,
  
  // Object operations
  OP_MAKE_OBJECT,
  OP_GET,
  OP_KEYS,
  OP_VALUES,
  
  // Special
  OP_HALT,
  
  // Utilities
  OPCODE_INFO,
  getOpcodeName,
  disassemble
};

