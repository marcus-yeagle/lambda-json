# λJSON Formal Grammar

This document defines the formal grammar for λJSON (Lambda JSON), a Turing-complete, homoiconic strict subset of JSON.

## Overview

λJSON is syntactically valid JSON. Every λJSON document is a valid JSON document, but not every JSON document is a valid λJSON program. The grammar below describes the subset of JSON that constitutes valid λJSON expressions.

## EBNF Grammar

```ebnf
(* Top-level document *)
document        ::= expression

(* Expressions - the core of λJSON *)
expression      ::= atom | list | object

(* Atomic values *)
atom            ::= number | boolean | string | null

(* JSON number (IEEE 754 double-precision) *)
number          ::= integer fraction? exponent?
integer         ::= "-"? ("0" | digit1-9 digit*)
fraction        ::= "." digit+
exponent        ::= ("e" | "E") ("+" | "-")? digit+
digit           ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
digit1-9        ::= "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

(* Boolean literals *)
boolean         ::= "true" | "false"

(* Null literal *)
null            ::= "null"

(* JSON strings serve dual purpose: literals and symbols *)
string          ::= '"' characters '"'
characters      ::= character*
character       ::= unescaped | escaped
escaped         ::= "\" ('"' | "\" | "/" | "b" | "f" | "n" | "r" | "t" | "u" hex hex hex hex)
hex             ::= digit | "a" | "b" | "c" | "d" | "e" | "f" | "A" | "B" | "C" | "D" | "E" | "F"

(* Lists - used for function application and special forms *)
list            ::= "[" "]" | "[" expression ("," expression)* "]"

(* Objects - JSON objects for structured data *)
object          ::= "{" "}" | "{" member ("," member)* "}"
member          ::= string ":" expression
```

## Semantic Categories

While syntactically all strings are identical, λJSON interprets strings in different semantic roles:

### Symbols (Variable References)

A string that does not start with `'` is interpreted as a **symbol** (variable reference):

```json
"x"           → Symbol: looks up 'x' in the environment
"my-function" → Symbol: looks up 'my-function' in the environment
"+"           → Symbol: looks up the addition operator
```

**Symbol naming conventions:**
```ebnf
symbol          ::= identifier
identifier      ::= id-start id-continue*
id-start        ::= letter | "_"
id-continue     ::= letter | digit | "-" | "?" | "!" | "*" | "_"
letter          ::= "a"-"z" | "A"-"Z" | "λ"
```

### String Literals (Quoted Strings)

A string starting with `'` (single quote) is interpreted as a **string literal**:

```json
"'hello"      → String literal: "hello"
"'foo bar"    → String literal: "foo bar"
"'123"        → String literal: "123" (not a number)
```

### Special Form Keywords

These strings have special meaning when appearing as the first element of a list:

```ebnf
special-form    ::= "define" | "lambda" | "λ" | "if" | "cond" 
                  | "let" | "let*" | "quote" | "else"
```

## Expression Forms

### Self-Evaluating Expressions

```ebnf
self-eval       ::= number | boolean | null | quoted-string
quoted-string   ::= string starting with "'"
```

### Variable Reference

```ebnf
variable-ref    ::= symbol (string not starting with "'")
```

### Special Forms

```ebnf
(* Variable definition *)
define-form     ::= "[" "\"define\"" "," symbol "," expression "]"

(* Lambda expression *)
lambda-form     ::= "[" ("\"lambda\"" | "\"λ\"") "," param-list "," expression "]"
param-list      ::= "[" "]" | "[" symbol ("," symbol)* "]"

(* Conditional - two branches *)
if-form         ::= "[" "\"if\"" "," expression "," expression "," expression "]"

(* Conditional - multiple branches *)
cond-form       ::= "[" "\"cond\"" ("," cond-clause)+ "]"
cond-clause     ::= "[" (expression | "\"else\"") "," expression "]"

(* Local bindings - parallel *)
let-form        ::= "[" "\"let\"" "," bindings "," expression "]"
bindings        ::= "[" "]" | "[" binding ("," binding)* "]"
binding         ::= "[" symbol "," expression "]"

(* Local bindings - sequential *)
let*-form       ::= "[" "\"let*\"" "," bindings "," expression "]"

(* Quotation - returns unevaluated *)
quote-form      ::= "[" "\"quote\"" "," expression "]"
```

### Function Application

```ebnf
application     ::= "[" expression ("," expression)* "]"
```

When a list's first element is not a special form keyword, it is treated as a function application.

## Built-in Operators

### Arithmetic Operators

```ebnf
arith-op        ::= "+" | "-" | "*" | "/" | "%" | "abs" | "floor" | "ceil" | "min" | "max"
```

### Comparison Operators

```ebnf
compare-op      ::= ">" | "<" | ">=" | "<=" | "eq?"
```

### Logical Operators

```ebnf
logic-op        ::= "and" | "or" | "not"
```

### Type Predicates

```ebnf
type-pred       ::= "null?" | "list?" | "number?" | "string?" | "boolean?" | "object?" | "function?"
```

### Collection Operations

```ebnf
collection-op   ::= "map" | "filter" | "reduce" | "length" | "nth" | "cons" | "car" | "cdr" | "append"
```

### Object Operations

```ebnf
object-op       ::= "get" | "keys" | "values" | "assoc" | "dissoc" | "merge"
```

### Stream Operations

```ebnf
stream-op       ::= "cons-stream" | "head" | "tail" | "take" | "delay" | "force"
                  | "enum-stream" | "map-stream" | "filter-stream"
```

## Complete Example

Here is a complete λJSON document demonstrating various features:

```json
{
  "description": "Calculate average of numbers",
  "data": [1, 2, 3, 4, 5],
  "code": [
    "λ",
    ["nums"],
    [
      "/",
      ["reduce", ["λ", ["acc", "n"], ["+", "acc", "n"]], "nums"],
      ["length", "nums"]
    ]
  ]
}
```

Parsed structure:
- `description`: String literal (object value, not evaluated)
- `data`: List of numbers
- `code`: Lambda expression taking `nums`, computing sum/length

## JSON Compatibility

λJSON maintains strict JSON compatibility:

1. **Syntax**: All λJSON is valid JSON parseable by any JSON parser
2. **Encoding**: UTF-8 encoding required
3. **Numbers**: IEEE 754 double-precision (same limitations as JSON)
4. **Whitespace**: Insignificant between tokens (same as JSON)
5. **Comments**: Not supported (same as JSON)

## Grammar Notation

This document uses Extended Backus-Naur Form (EBNF) with the following conventions:

| Notation | Meaning |
|----------|---------|
| `::=` | Definition |
| `\|` | Alternative |
| `( )` | Grouping |
| `*` | Zero or more |
| `+` | One or more |
| `?` | Optional (zero or one) |
| `" "` | Terminal string |
| `'a'-'z'` | Character range |
| `(* *)` | Comment |

## Version

This grammar corresponds to λJSON specification version 1.0.
