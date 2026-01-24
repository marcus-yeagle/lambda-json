#!/usr/bin/env node

/**
 * Test script for Fibonacci implementations in λ.json
 * Demonstrates various ways to compute Fibonacci numbers
 */

const { globalEnv, evaluate } = require('../λJSON.js');

console.log('='.repeat(60));
console.log('λ.json Fibonacci Examples');
console.log('='.repeat(60));

// Example 1: Simple Recursive Fibonacci
console.log('\n1. Recursive Fibonacci (fib(10)):');
const fibRecursive = [
  'define',
  'fib',
  [
    'λ',
    ['n'],
    [
      'cond',
      [['eq?', 'n', 0], 0],
      [['eq?', 'n', 1], 1],
      ['else', ['+', ['fib', ['-', 'n', 1]], ['fib', ['-', 'n', 2]]]],
    ],
  ],
];
evaluate(fibRecursive, globalEnv);
console.log('   Result:', evaluate(['fib', 10], globalEnv));

// Example 2: Iterative Fibonacci (more efficient)
console.log('\n2. Iterative Fibonacci (fib(20)):');
const fibIterative = [
  'define',
  'fib-iter',
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
          'let',
          [
            [
              'iter',
              [
                'λ',
                ['count', 'a', 'b'],
                [
                  'if',
                  ['eq?', 'count', 0],
                  'a',
                  ['iter', ['-', 'count', 1], 'b', ['+', 'a', 'b']],
                ],
              ],
            ],
          ],
          ['iter', 'n', 0, 1],
        ],
      ],
    ],
  ],
];
evaluate(fibIterative, globalEnv);
console.log('   Result:', evaluate(['fib-iter', 20], globalEnv));

// Example 3: Fibonacci with Map (compute multiple at once)
console.log('\n3. Fibonacci with Map (fib of [5, 7, 10, 12]):');
const fibMap = [
  'map',
  ['λ', ['n'], ['fib-iter', 'n']],
  [5, 7, 10, 12],
];
console.log('   Result:', evaluate(fibMap, globalEnv));

// Example 4: Fibonacci Stream (lazy evaluation)
console.log('\n4. Fibonacci Stream (first 15 numbers):');
const fibStream = [
  'define',
  'fib-stream',
  ['λ', ['a', 'b'], ['cons-stream', 'a', ['fib-stream', 'b', ['+', 'a', 'b']]]],
];
evaluate(fibStream, globalEnv);
evaluate(['define', 'fibs', ['fib-stream', 0, 1]], globalEnv);
console.log('   Result:', evaluate(['take', 15, 'fibs'], globalEnv));

// Example 5: Sum of first n Fibonacci numbers
console.log('\n5. Sum of first 10 Fibonacci numbers:');
const fibNumbers = evaluate(
  ['map', ['λ', ['n'], ['fib', 'n']], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
  globalEnv
);
const sumFib = [
  'reduce',
  ['λ', ['acc', 'n'], ['+', 'acc', 'n']],
  fibNumbers,
];
console.log('   Result:', evaluate(sumFib, globalEnv));
console.log('   (0+1+1+2+3+5+8+13+21+34+55 = 143)');

// Example 6: Filter even Fibonacci numbers
console.log('\n6. Even Fibonacci numbers from first 15:');
const evenFibs = [
  'filter',
  ['λ', ['n'], ['eq?', 0, ['%', 'n', 2]]],
  ['take', 15, 'fibs'],
];
// Note: This requires modulo operator which we can add
console.log('   (Would need modulo operator % in interpreter)');

// Example 7: Inline lambda (no define needed)
console.log('\n7. Inline Lambda Fibonacci (fib(8)):');
const inlineFib = [
  [
    'λ',
    ['n'],
    [
      'cond',
      [['eq?', 'n', 0], 0],
      [['eq?', 'n', 1], 1],
      ['else', ['+', ['fib', ['-', 'n', 1]], ['fib', ['-', 'n', 2]]]],
    ],
  ],
  8,
];
console.log('   Result:', evaluate(inlineFib, globalEnv));

// Example 8: Fibonacci with let* (sequential bindings)
console.log('\n8. Fibonacci using let* (fib(12)):');
const fibLetStar = [
  'let*',
  [
    ['n', 12],
    [
      'fib-calc',
      [
        'λ',
        ['x'],
        [
          'cond',
          [['eq?', 'x', 0], 0],
          [['eq?', 'x', 1], 1],
          ['else', ['fib', 'x']],
        ],
      ],
    ],
  ],
  ['fib-calc', 'n'],
];
console.log('   Result:', evaluate(fibLetStar, globalEnv));

// Performance comparison
console.log('\n' + '='.repeat(60));
console.log('Performance Notes:');
console.log('='.repeat(60));
console.log('• Recursive: O(2^n) - exponential, only for small n');
console.log('• Iterative: O(n) - linear, efficient for large n');
console.log('• Stream: Lazy evaluation, computes only what\'s needed');
console.log('='.repeat(60));