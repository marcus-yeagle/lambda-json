// Example usage:
const defineX = ['define', 'x', 1]; // Defines a variable x with value 10
// evaluate(defineX, globalEnv);

// Lambda Example:
const square = ['λ', ['x'], ['*', 'x', 'x']]; // Lambda function to square a number
const squareOfFive = [square, 5]; // Apply the lambda function to the argument 5
// console.log(evaluate(squareOfFive, globalEnv));

// 'let' Example:
const simpleLet = [
  'let',
  [
    ['a', 3],
    ['b', 4],
  ],
  ['+', 'a', 'b'],
]; // Evaluates to 7 (3 + 4)

const letExample = [
  [
    'λ',
    ['x'],
    [
      'let',
      [
        ['x', 3],
        ['y', 'x'],
      ],
      ['+', 'x', 'y'],
    ],
  ],
  4,
]; // 7
const letStarExample = [
  [
    'λ',
    ['x'],
    [
      'let*',
      [
        ['x', 3],
        ['y', 'x'],
      ],
      ['+', 'x', 'y'],
    ],
  ],
  4,
]; // 6
// console.log(evaluate(letExample, globalEnv)); // Output: 7
// console.log(evaluate(letStarExample, globalEnv)); // Output: 6

// 'quote' Example:
const exp5 = ['+', 1, 2, ['quote', 'x']]; // Evaluates to 4 (1 + 2 + 'x')

// Lambda function to recursively calculate the nth Fibonacci number
const fib = [
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
          ['fib', ['-', 'n', 2]], // Recursive call: Pass 'fib' symbol unevaluated
        ],
      ],
    ],
  ],
];

// Lambda function to calculate the nth Fibonacci number
const fibIter = [
  'define',
  'fibIter',
  [
    'λ',
    ['n', 'a', 'b'],
    [
      'if',
      ['eq?', 'n', 0],
      'a',
      ['fibIter', ['-', 'n', 1], 'b', ['+', 'a', 'b']],
    ],
  ],
];

// evaluate(fib, globalEnv);
// console.log(evaluate([fib, 10], globalEnv));

// Divides
// F, T, T, F, T
// console.log(evaluate(['divides?', 0, 0], globalEnv));
// console.log(evaluate(['divides?', 1, 0], globalEnv));
// console.log(evaluate(['divides?', 2, 4], globalEnv));
// console.log(evaluate(['divides?', 2, 5], globalEnv));
// console.log(evaluate(['not', ['divides?', 2, 5]], globalEnv));

// Streams
//
const integers = [
  'define',
  'integers',
  ['cons-stream', 0, ['enum-stream', Number.MAX_VALUE + 1]],
];
evaluate(integers, globalEnv);
console.log(evaluate(['take', 33, 'integers'], globalEnv));
console.log(evaluate(['head', 'integers']));
// !!DANGER DO NOT RUN!! console.log(evaluate(['force', ['tail', 'integers']]));
console.log(evaluate(['head', ['tail', 'integers']]));
console.log(
  evaluate(
    [
      'take',
      55,
      [
        'filter-stream',
        ['λ', ['n'], ['divides?', 10, 'n']],
        ['map-stream', ['λ', ['n'], ['*', 'n', 'n', 'n']], 'integers'],
      ],
    ],
    globalEnv
  )
);

console.log(
  evaluate(
    [
      'reduce',
      ['λ', ['acc', 'curr', 'i', 'arr'], ['+', 'acc', 'curr']],
      [
        'filter',
        ['λ', ['n'], ['divides?', 5, 'n']],
        [
          'map',
          ['λ', ['n'], ['-', 'n', 1]],
          [
            'take',
            55,
            [
              'filter-stream',
              ['λ', ['n'], ['divides?', 31, 'n']],
              ['map-stream', ['λ', ['n'], ['*', 'n', 'n', 'n']], 'integers'],
            ],
          ],
        ],
      ],
    ],
    globalEnv
  )
);
