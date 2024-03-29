# λ.json

A Turing-complete, homoiconic strict subset of the JSON data interchange format.

This repository contains a JavaScript implementation of an interpreter for λ.json, a simple Lisp embedding of JS Arrays as Lists with basic arithmetic operations, comparators, lazy streams, lambda expressions, and hygienic macro support allowing users to extend JSON to include code to operate over the data itself in the same format in near realtime.

## Prerequisites

Ensure you have Node.js installed on your machine to run the interpreter or have access to another modern JS runtime.

## Usage

To use the λ.json REPL, run the script in a JavaScript environment. The interpreter will then prompt you to enter λ.json expressions for evaluation.

## Tiny Motivating Example

The default evaluation mechanism adds a result property by applying the λ.json code property to the encapuslated data property.

In this example all the code and all of the data is encapsulated into a JSON Object, which is then evaluated
and transformed into the same object with the addition of a `result` property which value is the evaluated code with respect to the data

```
{
  ...,
  result: eval([code, data])
}
```

```
{
  "data": [1, 2, 3, 4],
  "code": [
    "λ",
    ["nums"],
    [
      "/",
      [
        "reduce",
        ["λ", ["acc", "curr"], ["+", "acc", "curr"]],
        "nums",
      ],
      ["length", "nums"],
    ],
  ]
}
```

Result Output:

```
{
  "data": [1, 2, 3, 4],
  "code": [
    "λ",
    ["nums"],
    [
      "/",
      [
        "reduce",
        ["λ", ["acc", "curr"], ["+", "acc", "curr"]],
        "nums",
      ],
      ["length", "nums"],
    ],
  ],
  "result": 2.5
}
```

## Getting Started

1. Clone this repository to your local machine (npm coming soon).
2. Open a terminal or command prompt in the cloned directory.
3. Start the REPL (Read-Eval-Print-Loop)

```bash
npm run cli
λ.json -> ['+', 2, 3, 5]

10

λ.json ->
```

## λ.json Expressions

λ.json expressions are represented as Numbers, Strings, Lambdas or Lists in JavaScript. Here are some examples of valid types of λ.json expressions:

- Numbers: `2`, `3`, `5`
- Booleans `true`, `false`
- Strings: `'foo'`, `'bar'`, `'baz'`
- Lists: `[]`, `[2, 3, 'cat']`, `[[], [1], ['2']]`, `['square', 3]`
- Lambdas: `['λ', ['n'], ['*', 'n', 'n']]`, `['lambda', ['x'], ['+', 'x', '1']]`

## Available Built-in Operators

### Arithmetic

- `+`: Addition
- `-`: Subtraction
- `*`: Multiplication
- `/`: Division

### Comparators

- `>`: Greater than
- `<`: Less than

### Logic

- `eq?`: A special form for checking general equality
- `not`: A special form for negation
- `and`: A special form for logical conjunction
- `or`: A special form for logical disjunction

## Examples

1. Simple Arithmetic:

```λ-JSON
λ.json -> ['+', 2, 3]
Output: 5
```

2. Variables and Definitions:

```λ-JSON
λ.json -> ['define', 'x', 5]
Output: 5

λ.json -> ['+', 'x', 3]
Output: 8
```

3. Conditional Expressions:

```λ-JSON
λ.json -> ['if', ['>', 5, 2], 10, 20]
Output: 10

λ.json -> ['cond',
            [['>', 5, 10], 'greater'],
            [['<', 5, 10], 'less'],
            ['else', 'other']]
Output: 'less'
```

4. λ Lambdas:

```λ-JSON
λ.json -> ['define', 'square', ['λ', ['x'], ['*', 'x', 'x']]]
Output: [Function: anonymous]

λ.json -> ['square', 5]
Output: 25
```

5. Recursion:

```λ-JSON
λ.json -> [[
    'define',
    'fib',
    [
      'λ',
      ['n'],
      [
        'cond',
        [['eq?', 'n', 0], 0],
        [['eq?', 'n', 1], 1],
        [
          'else',
          [
            '+',
            ['fib', ['-', 'n', 1]], // Recursive call: Pass 'fib' symbol unevaluated
            ['fib', ['-', 'n', 2]] // Recursive call: Pass 'fib' symbol unevaluated
          ]
        ]
      ]
    ]
  ], 10]
Output: 55
```

6. Logic:

```λ-JSON
λ.json -> true
Output: true
```

```λ-JSON
λ.json -> ['not', true]
Output: false
```

```λ-JSON
λ.json -> ['not', ['not', false]]
Output: false
```

```λ-JSON
λ.json -> ['and', ['not', false], true]
Output: true
```

```λ-JSON
λ.json -> ['or', true, false, true]
Output: true
```

## Exiting the REPL

To exit the REPL, type any of the following commands:

- `quit`
- `q`
- `exit`

## Testing

`npm test`

## Important Security Note

The Command Line Interface utility use JavaScript's `eval` function for parsing λ.json expressions into JavaScript arrays for evaluation. While this implementation works for demonstration purposes, using `eval` is generally discouraged due to potential security risks. **Avoid using the CLI interpreter with untrusted input.** File input avoids the problem entirely and should be used by default. The CLI tool should be used for development and prototyping purposes only!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
