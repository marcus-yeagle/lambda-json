# λ.json Fibonacci Examples

This directory contains various implementations of Fibonacci number computation in λ.json, demonstrating the capabilities of the interpreter.

## Running the Examples

```bash
node examples/test-fibonacci.js
```

## Fibonacci Implementations

### 1. Recursive Fibonacci (Simple but Inefficient)

The classic recursive implementation:

```json
[
  "define",
  "fib",
  [
    "λ",
    ["n"],
    [
      "cond",
      [["eq?", "n", 0], 0],
      [["eq?", "n", 1], 1],
      ["else", ["+", ["fib", ["-", "n", 1]], ["fib", ["-", "n", 2]]]]
    ]
  ]
]
```

**Usage:**
```json
["fib", 10]  // Returns: 55
```

**Complexity:** O(2^n) - Only suitable for small values (n < 20)

### 2. Fibonacci with Streams (Lazy Evaluation)

Generates an infinite Fibonacci sequence using lazy evaluation:

```json
[
  "define",
  "fib-stream",
  ["λ", ["a", "b"], ["cons-stream", "a", ["fib-stream", "b", ["+", "a", "b"]]]]
]
```

**Usage:**
```json
["define", "fibs", ["fib-stream", 0, 1]]
["take", 15, "fibs"]  // Returns: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]
```

**Advantages:**
- Infinite sequence (only computes what's needed)
- Efficient memory usage
- Can be combined with `map-stream` and `filter-stream`

### 3. Fibonacci with Map

Compute Fibonacci for multiple inputs at once:

```json
["map", ["λ", ["n"], ["fib", "n"]], [5, 7, 10, 12]]
// Returns: [5, 13, 55, 144]
```

### 4. Inline Lambda (No Define Needed)

Single-use lambda without defining a named function:

```json
[
  ["λ", ["n"], 
    ["cond",
      [["eq?", "n", 0], 0],
      [["eq?", "n", 1], 1],
      ["else", ["+", ["fib", ["-", "n", 1]], ["fib", ["-", "n", 2]]]]
    ]
  ],
  8
]
// Returns: 21
```

### 5. Sum of Fibonacci Numbers

Calculate the sum of the first n Fibonacci numbers:

```json
[
  "reduce",
  ["λ", ["acc", "n"], ["+", "acc", "n"]],
  ["map", ["λ", ["n"], ["fib", "n"]], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]]
]
// Returns: 143 (sum of fib(0) through fib(10))
```

### 6. Fibonacci with let* (Sequential Bindings)

Using `let*` for sequential variable bindings:

```json
[
  "let*",
  [
    ["n", 12],
    ["fib-calc", ["λ", ["x"], 
      ["cond",
        [["eq?", "x", 0], 0],
        [["eq?", "x", 1], 1],
        ["else", ["fib", "x"]]
      ]
    ]]
  ],
  ["fib-calc", "n"]
]
// Returns: 144
```

## Key λ.json Features Demonstrated

### Special Forms
- **`define`**: Define variables and functions in global scope
- **`λ` or `lambda`**: Create anonymous functions
- **`if`**: Conditional expression (2 branches)
- **`cond`**: Multi-branch conditional with `else` clause
- **`let`**: Parallel variable bindings
- **`let*`**: Sequential variable bindings

### Higher-Order Functions
- **`map`**: Apply function to each element of a list
- **`filter`**: Select elements matching a predicate
- **`reduce`**: Fold a list into a single value

### Stream Operations (Lazy Evaluation)
- **`cons-stream`**: Create a stream with head and lazy tail
- **`take`**: Extract first n elements from a stream
- **`map-stream`**: Map over a stream
- **`filter-stream`**: Filter a stream

### Operators
- **Arithmetic**: `+`, `-`, `*`, `/`
- **Comparison**: `>`, `<`, `eq?`
- **Logic**: `and`, `or`, `not`

## Performance Comparison

| Implementation | Time Complexity | Space Complexity | Best For |
|---------------|-----------------|------------------|----------|
| Recursive | O(2^n) | O(n) | Small n (< 20) |
| Stream | O(n) | O(1) per element | Large sequences |
| With Map | O(n*m) | O(m) | Multiple values |

## Tips for Writing λ.json

1. **Use `cond` for multiple conditions** instead of nested `if` statements
2. **Leverage streams** for infinite sequences or large datasets
3. **Use `let*` when bindings depend on each other**, `let` for parallel bindings
4. **Prefer higher-order functions** (`map`, `filter`, `reduce`) for list operations
5. **Remember recursion requires the function name** to be defined first with `define`

## Common Patterns

### Recursive Function Pattern
```json
["define", "func-name",
  ["λ", ["param"],
    ["cond",
      [["base-case?", "param"], "base-value"],
      ["else", ["recursive-call", ["modify", "param"]]]
    ]
  ]
]
```

### Stream Pattern
```json
["define", "stream-name",
  ["λ", ["current", "next"],
    ["cons-stream", "current", ["stream-name", "next", ["compute-next"]]]
  ]
]
```

### Higher-Order Function Pattern
```json
["map",
  ["λ", ["x"], ["transform", "x"]],
  "list"
]
```

## See Also

- `fibonacci.json` - Comprehensive collection of Fibonacci implementations
- `test-fibonacci.js` - Executable test script demonstrating all examples
- `meta-interpreter.json` - **Meta-circular interpreter**: a λJSON interpreter written in λJSON!
- `test-meta-interpreter.js` - Tests for the meta-circular interpreter
- `../README.md` - Main λ.json documentation

## Meta-Circular Interpreter

The `meta-interpreter.json` file contains a λJSON interpreter written in λJSON itself. This is a classic exercise in programming language theory demonstrating the homoiconicity of the language.

### Features Supported

The meta-interpreter can evaluate:
- Numbers, booleans, null, and objects (self-evaluating)
- Quoted expressions (`["quote", ...]`)
- Conditionals (`if`, `cond`)
- Variable bindings (`let`, `let*`)
- Lambda expressions and closures (`λ`, `lambda`)
- Boolean operators (`and`, `or`, `not`)
- Arithmetic (`+`, `-`, `*`, `/`, `%`)
- Comparisons (`>`, `<`, `>=`, `<=`, `eq?`)
- List operations (`car`, `cdr`, `cons`, `nth`, `list`)
- Type predicates (`null?`, `number?`, `string?`, `list?`, etc.)

### Example Usage

```javascript
// After loading the interpreter definitions:
["meta-eval",
  ["quote",
    ["let", [["x", 10], ["y", 20]], ["+", "x", "y"]]
  ],
  []
]
// Returns: 30
```

### Running the Tests

```bash
node examples/test-meta-interpreter.js
```