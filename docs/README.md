# λJSON Documentation

Welcome to the λJSON documentation. This folder contains detailed technical documentation for the λJSON interpreter.

## Documents

| Document | Description |
|----------|-------------|
| [PERFORMANCE-OPTIMIZATIONS.md](PERFORMANCE-OPTIMIZATIONS.md) | Detailed explanation of all performance optimizations, trade-offs, and design decisions |
| [API-REFERENCE.md](API-REFERENCE.md) | Complete API reference for all modules |

## Quick Links

### Main Specification
- [../SPEC.md](../SPEC.md) - Full language specification
- [../GRAMMAR.md](../GRAMMAR.md) - Formal grammar definition

### Getting Started
- [../README.md](../README.md) - Project overview and quick start
- [../examples/](../examples/) - Example programs

### Performance
- [../benchmark.js](../benchmark.js) - Run benchmarks with `node benchmark.js`

## Module Overview

```
λJSON.js              Core tree-walking interpreter
                      ├── Environment class
                      ├── Memoization support
                      └── Full language implementation

λJSON-fast.js         Unified fast API
                      ├── Automatic bytecode compilation
                      ├── Compilation caching
                      └── Fallback to tree-walker

λJSON-compiler.js     Bytecode compiler
                      ├── AST → Bytecode
                      ├── Constant pool
                      └── Tail position detection

λJSON-vm.js           Bytecode virtual machine
                      ├── Stack-based execution
                      ├── Tail call optimization
                      └── Built-in primitives

λJSON-opcodes.js      Instruction set definition
                      ├── 40+ opcodes
                      └── Disassembler
```

## Performance Summary

| Optimization | Speedup | When to Use |
|--------------|---------|-------------|
| Memoization (`memoize`) | 10-10,000x | Recursive pure functions |
| Auto-memoize option | 10-10,000x | All functions are pure |
| Bytecode VM | 2-5x | Any computation |
| Tail Call Optimization | ∞ | Deep recursion |

## Example: Choosing the Right Approach

```javascript
// Simple evaluation - use core module
const { evaluate } = require('./λJSON.js');
evaluate(['+', 1, 2, 3], {});

// Recursive function - use memoization
evaluate(['define', 'fib', 
  ['memoize', ['λ', ['n'], ...]]], {});

// Maximum performance - use fast module
const fast = require('./λJSON-fast.js');
fast.evaluate(complexExpression, {});

// Deep recursion (10,000+ calls) - use VM with TCO
const { Compiler } = require('./λJSON-compiler.js');
const { VM } = require('./λJSON-vm.js');
const vm = new VM({ maxCallDepth: 100000 });
vm.run(compiler.compileProgram(tailRecursiveExpression));
```

