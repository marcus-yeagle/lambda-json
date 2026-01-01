# λJSON Language Specification

**Version:** 1.0.0  
**Status:** Draft  
**Date:** December 2024

## Abstract

λJSON (Lambda JSON) is a Turing-complete, homoiconic programming language that is a strict subset of JSON. This specification defines the syntax, semantics, and standard library of λJSON, enabling interoperable implementations across different platforms.

## Table of Contents

1. [Introduction](#1-introduction)
2. [Notation Conventions](#2-notation-conventions)
3. [Lexical Structure](#3-lexical-structure)
4. [Type System](#4-type-system)
5. [Evaluation Model](#5-evaluation-model)
6. [Special Forms](#6-special-forms)
7. [Standard Library](#7-standard-library)
8. [Error Handling](#8-error-handling)
9. [Security Model](#9-security-model)
10. [Conformance Requirements](#10-conformance-requirements)

---

## 1. Introduction

### 1.1 Design Goals

λJSON is designed with the following goals:

1. **JSON Compatibility**: Every λJSON program is valid JSON
2. **Homoiconicity**: Code and data share the same representation
3. **Minimalism**: Small core language with powerful abstractions
4. **Portability**: Runs anywhere JSON can be parsed
5. **Purity**: No side effects (except `define` for global bindings)
6. **Security**: Safe to evaluate untrusted code with proper sandboxing

### 1.2 Relationship to JSON

λJSON is a **strict semantic subset** of JSON:

- Every λJSON document is syntactically valid JSON
- A JSON parser can parse any λJSON document
- A λJSON interpreter assigns computational meaning to JSON structures

### 1.3 Relationship to Lisp

λJSON draws inspiration from Lisp/Scheme:

- S-expressions are represented as JSON arrays
- Symbols are represented as JSON strings
- Lambda calculus provides the computational foundation
- Lexical scoping with closures

---

## 2. Notation Conventions

### 2.1 Grammar Notation

This specification uses Extended Backus-Naur Form (EBNF):

| Notation | Meaning |
|----------|---------|
| `::=` | Definition |
| `\|` | Alternative |
| `[ ]` | Optional |
| `{ }` | Zero or more repetitions |
| `" "` | Terminal string |

### 2.2 Semantic Notation

Evaluation is written as:

```
eval(expression, environment) → value
```

Environment lookup:

```
ρ(x) = lookup symbol x in environment ρ
```

---

## 3. Lexical Structure

### 3.1 JSON Compatibility

λJSON inherits JSON's lexical structure:

- UTF-8 encoding
- Whitespace is insignificant between tokens
- No comments

### 3.2 Values

```ebnf
value       ::= number | boolean | null | string | array | object
number      ::= JSON-number
boolean     ::= "true" | "false"
null        ::= "null"
string      ::= '"' characters '"'
array       ::= "[" [ value { "," value } ] "]"
object      ::= "{" [ member { "," member } ] "}"
member      ::= string ":" value
```

### 3.3 Semantic Interpretation of Strings

Strings serve dual purposes in λJSON:

1. **Symbol**: A string not starting with `'` is a variable reference
2. **String Literal**: A string starting with `'` is a literal value

```
"x"       → Symbol, looks up 'x' in environment
"'hello"  → String literal "hello"
```

**Note**: The `'` prefix is deprecated. Use `["quote", "value"]` for string literals.

---

## 4. Type System

### 4.1 Primitive Types

| Type | JSON Representation | Example |
|------|---------------------|---------|
| Number | JSON number | `42`, `3.14`, `-17` |
| Boolean | `true`, `false` | `true` |
| Null | `null` | `null` |
| String | Quoted string or `'`-prefixed | `"'hello"` |

### 4.2 Compound Types

| Type | JSON Representation | Example |
|------|---------------------|---------|
| List | JSON array | `[1, 2, 3]` |
| Object | JSON object | `{"a": 1}` |
| Closure | (runtime only) | Created by `lambda` |
| Stream | (runtime only) | Created by `cons-stream` |

### 4.3 Type Predicates

| Predicate | Tests for |
|-----------|-----------|
| `null?` | Null value |
| `boolean?` | Boolean value |
| `number?` | Numeric value |
| `string?` | String value |
| `list?` | Array/list value |
| `object?` | Plain object (not array, not null) |
| `function?` | Closure/function |

---

## 5. Evaluation Model

### 5.1 Evaluation Rules

λJSON uses **applicative order** (eager) evaluation.

#### Self-Evaluating Expressions

```
eval(n, ρ) = n                    where n is a number
eval(b, ρ) = b                    where b is a boolean
eval(null, ρ) = null
eval(obj, ρ) = obj                where obj is a plain object
eval([], ρ) = []                  empty array
```

#### Symbol Lookup

```
eval(symbol, ρ) = ρ(symbol)       if symbol is bound
                = error           if strictMode and symbol is unbound
                = symbol          otherwise (backward compatibility)
```

#### String Literals

```
eval("'s", ρ) = s                 quoted string literal
eval(["quote", v], ρ) = v         canonical quotation
```

#### Function Application

```
eval([op, arg₁, ..., argₙ], ρ) =
  let f = eval(op, ρ)
  let v₁ = eval(arg₁, ρ)
  ...
  let vₙ = eval(argₙ, ρ)
  in apply(f, [v₁, ..., vₙ])
```

### 5.2 Environments

An **environment** is a mapping from symbols to values.

- **Global environment**: Contains built-in operators and user definitions
- **Local environment**: Created by `let`, `let*`, and lambda application
- **Lookup order**: Local → Global

### 5.3 Closures

A **closure** captures:
- Parameter names
- Body expression
- Defining environment

```
eval([λ, [p₁, ..., pₙ], body], ρ) = <closure: [p₁, ..., pₙ], body, ρ>

apply(<closure: params, body, ρ'>, [v₁, ..., vₙ]) =
  let ρ'' = extend(ρ', params, [v₁, ..., vₙ])
  in eval(body, ρ'')
```

---

## 6. Special Forms

Special forms have custom evaluation rules (arguments are not pre-evaluated).

### 6.1 `define`

Binds a value to a symbol in the global environment.

**Syntax**: `["define", symbol, expression]`

**Semantics**:
```
eval(["define", x, e], ρ) =
  let v = eval(e, ρ)
  in globalEnv[x] := v; return v
```

**Example**:
```json
["define", "pi", 3.14159]
["define", "square", ["λ", ["x"], ["*", "x", "x"]]]
```

### 6.2 `lambda` / `λ`

Creates an anonymous function (closure).

**Syntax**: `["lambda", [params...], body]` or `["λ", [params...], body]`

**Semantics**:
```
eval([λ, params, body], ρ) = <closure: params, body, ρ>
```

**Example**:
```json
["λ", ["x", "y"], ["+", "x", "y"]]
```

### 6.3 `if`

Two-branch conditional.

**Syntax**: `["if", condition, then-expr, else-expr]`

**Semantics**:
```
eval(["if", c, t, f], ρ) =
  if eval(c, ρ) is truthy
    then eval(t, ρ)
    else eval(f, ρ)
```

**Example**:
```json
["if", [">", "x", 0], ["quote", "positive"], ["quote", "non-positive"]]
```

### 6.4 `cond`

Multi-branch conditional.

**Syntax**: `["cond", [test₁, expr₁], [test₂, expr₂], ..., ["else", default]]`

**Semantics**:
```
eval(["cond", clause₁, ...], ρ) =
  for each [test, expr] in clauses:
    if test = "else" or eval(test, ρ) is truthy:
      return eval(expr, ρ)
  return undefined
```

**Example**:
```json
["cond",
  [["<", "n", 0], ["quote", "negative"]],
  [["eq?", "n", 0], ["quote", "zero"]],
  ["else", ["quote", "positive"]]
]
```

### 6.5 `let`

Parallel local bindings.

**Syntax**: `["let", [[var₁, val₁], [var₂, val₂], ...], body]`

**Semantics**: All values are evaluated in the **outer** environment, then bound simultaneously.

```
eval(["let", bindings, body], ρ) =
  let ρ' = ρ
  for each [x, e] in bindings:
    ρ'[x] := eval(e, ρ)    // Note: uses ρ, not ρ'
  return eval(body, ρ')
```

**Example**:
```json
["let", [["x", 1], ["y", 2]], ["+", "x", "y"]]
```

### 6.6 `let*`

Sequential local bindings.

**Syntax**: `["let*", [[var₁, val₁], [var₂, val₂], ...], body]`

**Semantics**: Each value is evaluated with previous bindings visible.

```
eval(["let*", bindings, body], ρ) =
  let ρ' = ρ
  for each [x, e] in bindings:
    ρ'[x] := eval(e, ρ')   // Note: uses ρ', which accumulates
  return eval(body, ρ')
```

**Example**:
```json
["let*", [["x", 1], ["y", ["+", "x", 1]]], "y"]
```
Result: `2` (because `y` can see `x`)

### 6.7 `quote`

Returns its argument unevaluated.

**Syntax**: `["quote", expression]`

**Semantics**:
```
eval(["quote", e], ρ) = e
```

**Example**:
```json
["quote", [1, 2, 3]]
```
Result: `[1, 2, 3]` (the array, not a function call)

---

## 7. Standard Library

### 7.1 Arithmetic Operators

| Operator | Arity | Description |
|----------|-------|-------------|
| `+` | n-ary | Addition (numbers) or concatenation (strings) |
| `-` | n-ary | Subtraction; unary negation if 1 arg |
| `*` | n-ary | Multiplication |
| `/` | n-ary | Division |
| `%` | 2+ | Modulo |
| `abs` | 1 | Absolute value |
| `min` | 1+ | Minimum value |
| `max` | 1+ | Maximum value |
| `floor` | 1 | Floor (round down) |
| `ceil` | 1 | Ceiling (round up) |
| `round` | 1 | Round to nearest integer |

### 7.2 Comparison Operators

| Operator | Arity | Description |
|----------|-------|-------------|
| `>` | 2+ | Greater than (chained) |
| `<` | 2+ | Less than (chained) |
| `>=` | 2+ | Greater than or equal (chained) |
| `<=` | 2+ | Less than or equal (chained) |
| `eq?` | 2 | Strict equality |

### 7.3 Logical Operators

| Operator | Arity | Description |
|----------|-------|-------------|
| `and` | n-ary | Logical AND (short-circuit) |
| `or` | n-ary | Logical OR (short-circuit) |
| `not` | 1 | Logical NOT |

### 7.4 List Operations

| Operator | Arity | Description |
|----------|-------|-------------|
| `car` | 1 | Get first element of list |
| `cdr` | 1 | Get rest of list (all but first) |
| `cons` | 2 | Prepend element to list |
| `nth` | 2 | Get element at index (0-based) |
| `append` | 2+ | Concatenate multiple lists |
| `list` | n-ary | Create list from arguments |
| `length` | 1 | Length of array |
| `map` | 2 | Apply function to each element |
| `filter` | 2 | Select elements matching predicate |
| `reduce` | 2 | Fold list to single value |

### 7.5 Object Operations

| Operator | Arity | Description |
|----------|-------|-------------|
| `get` | 2 | Get value by key |
| `keys` | 1 | Get all keys as array |
| `values` | 1 | Get all values as array |
| `assoc` | 3 | Add/update key-value pair (returns new object) |
| `dissoc` | 2 | Remove key (returns new object) |
| `merge` | n-ary | Merge objects (later overrides earlier) |
| `has-key?` | 2 | Check if key exists |

### 7.6 Stream Operations

| Operator | Arity | Description |
|----------|-------|-------------|
| `cons-stream` | 2 | Create stream with head and lazy tail |
| `head` | 1 | Get first element of stream |
| `tail` | 1 | Get rest of stream (lazy) |
| `take` | 2 | Take first n elements from stream |
| `delay` | 1 | Create delayed computation |
| `force` | 1 | Force delayed computation |
| `enum-stream` | 1 | Create stream of integers 1..n |
| `map-stream` | 2 | Map function over stream |
| `filter-stream` | 2 | Filter stream by predicate |

### 7.7 Other Operations

| Operator | Arity | Description |
|----------|-------|-------------|
| `divides?` | 2 | Check if first divides second evenly |

---

## 8. Error Handling

### 8.1 Error Types

| Type | Cause |
|------|-------|
| `TypeError` | Type mismatch in operation |
| `ArityError` | Wrong number of arguments |
| `UnboundSymbol` | Reference to undefined symbol (strict mode) |
| `SyntaxError` | Malformed expression structure |
| `RuntimeError` | General runtime error |
| `DivisionByZero` | Division by zero |
| `InvalidExpression` | Expression cannot be evaluated |

### 8.2 Error Format

Errors SHOULD be representable as JSON:

```json
{
  "error": true,
  "type": "TypeError",
  "message": "Type mismatch: + requires all numbers or all strings",
  "expression": ["+", 1, "hello"]
}
```

### 8.3 Required vs Optional Errors

**Required** (implementations MUST throw):
- Division by zero
- Wrong arity for special forms
- Invalid special form syntax

**Optional** (implementations MAY throw):
- Unbound symbols (depends on strict mode)
- Type errors for built-in operators

---

## 9. Security Model

### 9.1 Purity Guarantees

λJSON is **pure functional** with one exception:

- ✅ No file system access
- ✅ No network access
- ✅ No access to host environment
- ✅ No side effects in expressions
- ⚠️ `define` mutates global scope

### 9.2 Resource Limits

Conforming implementations SHOULD support resource limits:

| Limit | Description |
|-------|-------------|
| `maxRecursionDepth` | Maximum call stack depth |
| `maxExecutionTime` | Maximum execution time (ms) |
| `maxMemory` | Maximum memory usage |

### 9.3 Sandboxing Requirements

When evaluating untrusted code:

1. Use a fresh global environment
2. Set appropriate resource limits
3. Do not expose host environment
4. Consider running in separate process/worker

---

## 10. Conformance Requirements

### 10.1 Conformance Levels

| Level | Requirements |
|-------|--------------|
| **Core** | Special forms + arithmetic + comparison + logic |
| **Standard** | Core + list operations + type predicates |
| **Extended** | Standard + streams + objects |

### 10.2 Required Features (Core)

- Special forms: `define`, `lambda`/`λ`, `if`, `cond`, `let`, `let*`, `quote`
- Arithmetic: `+`, `-`, `*`, `/`
- Comparison: `>`, `<`, `eq?`
- Logic: `and`, `or`, `not`

### 10.3 Implementation-Defined Behavior

- Maximum number precision
- Maximum recursion depth
- Behavior on resource exhaustion
- Error message format

### 10.4 Test Suite

A conformance test suite is provided in the `conformance/` directory. Implementations SHOULD pass all tests for their claimed conformance level.

---

## Appendix A: Quick Reference

### A.1 Special Forms

```
["define", symbol, value]
["lambda", [params], body]  or  ["λ", [params], body]
["if", condition, then, else]
["cond", [test, expr], ..., ["else", default]]
["let", [[var, val], ...], body]
["let*", [[var, val], ...], body]
["quote", expression]
```

### A.2 Evaluation Order

1. Numbers, booleans, null, objects → self
2. Strings → symbol lookup or literal (if `'`-prefixed)
3. Empty arrays → self
4. Arrays → check special form, else function application

---

## Appendix B: Examples

### B.1 Factorial

```json
["define", "factorial",
  ["λ", ["n"],
    ["if", ["eq?", "n", 0],
      1,
      ["*", "n", ["factorial", ["-", "n", 1]]]]]]
```

### B.2 Fibonacci

```json
["define", "fib",
  ["λ", ["n"],
    ["cond",
      [["eq?", "n", 0], 0],
      [["eq?", "n", 1], 1],
      ["else", ["+", ["fib", ["-", "n", 1]], ["fib", ["-", "n", 2]]]]]]]
```

### B.3 Map Implementation

```json
["define", "my-map",
  ["λ", ["f", "lst"],
    ["if", ["eq?", ["length", "lst"], 0],
      [],
      ["cons",
        ["f", ["car", "lst"]],
        ["my-map", "f", ["cdr", "lst"]]]]]]
```

### B.4 Document with Data and Code

```json
{
  "data": [1, 2, 3, 4, 5],
  "code": ["λ", ["nums"],
    ["/",
      ["reduce", ["λ", ["acc", "n"], ["+", "acc", "n"]], "nums"],
      ["length", "nums"]]],
  "description": "Calculate average"
}
```

---

## Appendix C: Differences from Scheme

| Feature | λJSON | Scheme |
|---------|-------|--------|
| Syntax | JSON arrays | S-expressions |
| Comments | Not supported | `;` comments |
| Symbols | JSON strings | Bare symbols |
| Vectors | N/A | `#(...)` |
| Characters | N/A | `#\a` |
| Pairs | Objects | Cons cells |
| Macros | Not supported | `define-syntax` |
| Continuations | Not supported | `call/cc` |
| Mutation | Limited (`define`) | `set!` |

---

## Appendix D: Grammar

See [GRAMMAR.md](GRAMMAR.md) for the complete formal grammar.

---

## Appendix E: Change Log

### Version 1.0.0 (December 2024)

- Initial specification release
- Core language features
- Standard library
- Conformance requirements

