# λJSON API Reference

**Version:** 1.1.0

## Table of Contents

1. [Core Module (λJSON.js)](#core-module)
2. [Fast Module (λJSON-fast.js)](#fast-module)
3. [Compiler (λJSON-compiler.js)](#compiler)
4. [Virtual Machine (λJSON-vm.js)](#virtual-machine)
5. [Opcodes (λJSON-opcodes.js)](#opcodes)

---

## Core Module

**File:** `λJSON.js`

The main interpreter module with tree-walking evaluation.

### Exports

```javascript
const {
  globalEnv,          // Global environment (Proxy)
  evaluate,           // Main evaluation function
  Environment,        // Environment class
  processDocument,    // Document processing
  validateDocument,   // Document validation
  defaultOptions,     // Default evaluator options
  resetWarnings,      // Reset deprecation warnings
  resetExecutionState,// Reset execution state
  LambdaJSONError,    // Error class
  ErrorType,          // Error type enum
  SPEC_VERSION,       // Specification version
  getVersion          // Version info function
} = require('./λJSON.js');
```

### `evaluate(exp, env, options)`

Evaluates a λJSON expression.

**Parameters:**
- `exp` (any) - The λJSON expression to evaluate
- `env` (Object|Environment) - Variable bindings
- `options` (EvaluatorOptions) - Optional settings

**Returns:** The result of evaluation

**Example:**
```javascript
evaluate(['+', 1, 2, 3], {});  // Returns 6
evaluate(['*', 'x', 'x'], { x: 5 });  // Returns 25
```

### `EvaluatorOptions`

```typescript
interface EvaluatorOptions {
  strictMode?: boolean;       // Throw on unbound symbols (default: false)
  warnDeprecated?: boolean;   // Warn about deprecated features (default: true)
  maxRecursionDepth?: number; // Max call stack depth (default: 1000)
  maxExecutionTime?: number;  // Max execution time in ms (default: 5000)
  autoMemoize?: boolean;      // Auto-memoize all lambdas (default: false)
}
```

### `Environment` Class

Efficient variable storage with parent chain lookup.

```javascript
const env = new Environment();
env.set('x', 42);
env.get('x');  // 42

const child = env.extend();
child.set('y', 100);
child.get('x');  // 42 (from parent)
child.get('y');  // 100

// Create from plain object
const env2 = Environment.fromObject({ a: 1, b: 2 });
```

**Methods:**
- `get(name)` - Look up a variable
- `has(name)` - Check if variable exists
- `set(name, value)` - Set a variable
- `extend()` - Create child environment
- `toObject(includeParent)` - Convert to plain object

### Special Forms

#### `memoize`

Wraps a function with memoization caching.

```json
["memoize", ["λ", ["n"], ["*", "n", "n"]]]
```

The returned function caches results based on argument values.

---

## Fast Module

**File:** `λJSON-fast.js`

Unified API with automatic bytecode compilation.

### Exports

```javascript
const {
  evaluate,           // Smart evaluate (uses VM when beneficial)
  evaluateFast,       // Alias for evaluate
  compileLambda,      // Compile a lambda for reuse
  compileExpression,  // Compile to bytecode
  clearCache,         // Clear compilation cache
  getCacheStats,      // Get cache statistics
  defaultFastOptions, // Default options
  benchmark,          // Performance measurement
  disassemble,        // Bytecode disassembly
  Compiler,           // Re-exported compiler
  VM,                 // Re-exported VM
  treeWalker          // Original interpreter
} = require('./λJSON-fast.js');
```

### `evaluate(exp, env, options)`

Evaluates using the most efficient strategy.

**Parameters:**
- `exp` (any) - Expression to evaluate
- `env` (Object) - Environment bindings
- `options` (FastOptions) - Evaluation options

**Returns:** Result of evaluation

**Example:**
```javascript
const fast = require('./λJSON-fast.js');
fast.evaluate(['+', 1, 2, 3], {});  // Uses bytecode VM
```

### `FastOptions`

```typescript
interface FastOptions {
  useCompiler?: boolean;         // Use bytecode when possible (default: true)
  cacheCompiled?: boolean;       // Cache compiled bytecode (default: true)
  fallbackToTreeWalker?: boolean;// Fall back on errors (default: true)
  maxRecursionDepth?: number;    // Default: 10000
  maxExecutionTime?: number;     // Default: 5000
  traceExecution?: boolean;      // Debug: trace VM execution
  traceCompilation?: boolean;    // Debug: show bytecode
}
```

### `benchmark(exp, iterations, options)`

Measures performance of both evaluation strategies.

**Returns:**
```typescript
{
  fastTime: number;   // Bytecode VM time (ms)
  treeTime: number;   // Tree-walker time (ms)
  speedup: number;    // fastTime / treeTime
}
```

**Example:**
```javascript
const result = benchmark(['fib', 20], 10);
console.log(`VM is ${result.speedup}x faster`);
```

---

## Compiler

**File:** `λJSON-compiler.js`

Compiles λJSON AST to bytecode.

### Exports

```javascript
const { Compiler, FunctionTemplate } = require('./λJSON-compiler.js');
```

### `Compiler` Class

```javascript
const compiler = new Compiler();

// Compile a complete program
const { code, constants } = compiler.compileProgram(['+', 1, 2, 3]);

// Disassemble for debugging
console.log(Compiler.disassemble({ code, constants }));
```

**Methods:**
- `compileProgram(exp)` - Compile expression to bytecode
- `reset()` - Clear compiler state
- `static disassemble(compiled)` - Human-readable bytecode

### `FunctionTemplate`

Represents a compiled function (stored in constant pool).

```javascript
{
  params: string[];    // Parameter names
  code: number[];      // Bytecode
  constants: any[];    // Constant pool
  name: string|null;   // Optional name
  arity: number;       // Number of parameters
}
```

---

## Virtual Machine

**File:** `λJSON-vm.js`

Executes compiled bytecode.

### Exports

```javascript
const { VM, Closure, CallFrame, defaultVMOptions } = require('./λJSON-vm.js');
```

### `VM` Class

```javascript
const vm = new VM({
  maxStackSize: 10000,
  maxCallDepth: 1000,
  maxExecutionTime: 5000,
  traceExecution: false
});

// Run compiled code
const result = vm.run(compiled);

// Reset state
vm.reset();

// Access globals
vm.globals.set('x', 42);
```

**Constructor Options:**
```typescript
interface VMOptions {
  maxStackSize?: number;      // Default: 10000
  maxCallDepth?: number;      // Default: 1000
  maxExecutionTime?: number;  // Default: 5000 (ms)
  traceExecution?: boolean;   // Default: false
}
```

**Methods:**
- `run(compiled)` - Execute bytecode
- `reset()` - Reset VM state
- `step()` - Execute single instruction

**Properties:**
- `globals` - Map of global bindings
- `stack` - Value stack (for debugging)

### `Closure`

Runtime closure object.

```javascript
{
  template: FunctionTemplate;  // Compiled function
  env: Map;                    // Captured environment
}
```

---

## Opcodes

**File:** `λJSON-opcodes.js`

Bytecode instruction definitions.

### Exports

```javascript
const {
  // Stack operations
  OP_PUSH_CONST,    // Push constant
  OP_PUSH_NULL,     // Push null
  OP_PUSH_TRUE,     // Push true
  OP_PUSH_FALSE,    // Push false
  OP_POP,           // Discard top
  OP_DUP,           // Duplicate top
  
  // Variables
  OP_LOAD_VAR,      // Load local variable
  OP_STORE_VAR,     // Store local variable
  OP_LOAD_GLOBAL,   // Load global
  OP_STORE_GLOBAL,  // Store global (define)
  
  // Functions
  OP_CALL,          // Call function
  OP_TAIL_CALL,     // Tail call (TCO)
  OP_RETURN,        // Return from function
  OP_MAKE_CLOSURE,  // Create closure
  
  // Control flow
  OP_JUMP,          // Unconditional jump
  OP_JUMP_IF_FALSE, // Conditional jump
  OP_JUMP_IF_TRUE,  // Conditional jump
  
  // Arithmetic
  OP_ADD, OP_SUB, OP_MUL, OP_DIV, OP_MOD, OP_NEG,
  
  // Comparison
  OP_EQ, OP_LT, OP_GT, OP_LTE, OP_GTE,
  
  // Logical
  OP_NOT, OP_AND, OP_OR,
  
  // List operations
  OP_MAKE_LIST, OP_CAR, OP_CDR, OP_CONS, OP_LENGTH, OP_NTH,
  
  // Object operations
  OP_MAKE_OBJECT, OP_GET, OP_KEYS, OP_VALUES,
  
  // Special
  OP_HALT,          // Stop execution
  
  // Utilities
  OPCODE_INFO,      // Opcode metadata
  getOpcodeName,    // Get opcode name
  disassemble       // Disassemble bytecode
} = require('./λJSON-opcodes.js');
```

### `disassemble(code, constants)`

Converts bytecode to human-readable format.

**Example:**
```javascript
const bytecode = compiler.compileProgram(['+', 1, 2]);
console.log(disassemble(bytecode.code, bytecode.constants));
// Output:
// 0000: PUSH_CONST 0 (1)
// 0002: PUSH_CONST 1 (2)
// 0004: ADD 2
// 0006: HALT
```

---

## Quick Reference

### Choosing the Right API

| Use Case | Module | Function |
|----------|--------|----------|
| Simple evaluation | λJSON.js | `evaluate()` |
| Need memoization | λJSON.js | `evaluate()` with `memoize` |
| Auto-memoize all | λJSON.js | `evaluate()` with `{ autoMemoize: true }` |
| Maximum performance | λJSON-fast.js | `evaluate()` |
| Deep recursion (TCO) | λJSON-vm.js | Compile + VM |
| Compile once, run many | λJSON-compiler.js + λJSON-vm.js | Manual compilation |

### Common Patterns

**Memoized recursive function:**
```javascript
evaluate(['define', 'fib',
  ['memoize',
    ['λ', ['n'],
      ['if', ['<', 'n', 2], 'n',
        ['+', ['fib', ['-', 'n', 1]], ['fib', ['-', 'n', 2]]]]]]], {});
```

**Tail-recursive function (for VM):**
```javascript
// Sum 1 to n using tail recursion
['define', 'sum',
  ['λ', ['n', 'acc'],
    ['if', ['eq?', 'n', 0], 'acc',
      ['sum', ['-', 'n', 1], ['+', 'acc', 'n']]]]]

// Call with accumulator
['sum', 10000, 0]
```

**Compile and reuse:**
```javascript
const compiler = new Compiler();
const vm = new VM({ maxCallDepth: 50000 });

// Compile once
vm.run(compiler.compileProgram(['define', 'square', ['λ', ['x'], ['*', 'x', 'x']]]));
const compiled = compiler.compileProgram(['square', 'n']);

// Run with different inputs
for (let n = 0; n < 100; n++) {
  vm.globals.set('n', n);
  console.log(vm.run(compiled));
}
```

