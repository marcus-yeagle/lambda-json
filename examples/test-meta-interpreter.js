/**
 * Test suite for the meta-circular λJSON interpreter
 * 
 * This file tests that the meta-interpreter (a λJSON interpreter written in λJSON)
 * correctly evaluates various λJSON expressions.
 */

const { evaluate, globalEnv, resetExecutionState } = require('../λJSON.js');

// Helper to run meta-eval with clean state
function runMetaEval(quotedExpr, env = []) {
  resetExecutionState();
  return evaluate(['meta-eval', ['quote', quotedExpr], env], globalEnv);
}

// Load all the interpreter definitions
function loadMetaInterpreter() {
  resetExecutionState();
  
  const definitions = [
    // lookup
    ['define', 'lookup',
      ['λ', ['sym', 'env'],
        ['cond',
          [['eq?', ['length', 'env'], 0], null],
          [['eq?', 'sym', ['get', ['car', 'env'], ['quote', 'name']]],
           ['get', ['car', 'env'], ['quote', 'value']]],
          ['else', ['lookup', 'sym', ['cdr', 'env']]]]]],

    // extend-env - must use assoc to build object with evaluated values
    ['define', 'extend-env',
      ['λ', ['name', 'val', 'env'],
        ['cons',
          ['assoc', ['assoc', {}, ['quote', 'name'], 'name'], ['quote', 'value'], 'val'],
          'env']]],

    // extend-env-list
    ['define', 'extend-env-list',
      ['λ', ['names', 'vals', 'env'],
        ['cond',
          [['eq?', ['length', 'names'], 0], 'env'],
          ['else', 
            ['extend-env-list',
              ['cdr', 'names'],
              ['cdr', 'vals'],
              ['extend-env', ['car', 'names'], ['car', 'vals'], 'env']]]]]],

    // make-closure - must use assoc to build object with evaluated values
    ['define', 'make-closure',
      ['λ', ['params', 'body', 'env'],
        ['assoc',
          ['assoc',
            ['assoc',
              ['assoc', {}, ['quote', 'type'], ['quote', 'closure']],
              ['quote', 'params'], 'params'],
            ['quote', 'body'], 'body'],
          ['quote', 'env'], 'env']]],

    // closure?
    ['define', 'closure?',
      ['λ', ['x'],
        ['and', ['object?', 'x'],
                ['eq?', ['get', 'x', ['quote', 'type']], ['quote', 'closure']]]]],

    // apply-closure
    ['define', 'apply-closure',
      ['λ', ['closure', 'args'],
        ['meta-eval',
          ['get', 'closure', ['quote', 'body']],
          ['extend-env-list',
            ['get', 'closure', ['quote', 'params']],
            'args',
            ['get', 'closure', ['quote', 'env']]]]]],

    // eval-if
    ['define', 'eval-if',
      ['λ', ['cond-expr', 'then-expr', 'else-expr', 'env'],
        ['if', ['meta-eval', 'cond-expr', 'env'],
          ['meta-eval', 'then-expr', 'env'],
          ['meta-eval', 'else-expr', 'env']]]],

    // eval-cond
    ['define', 'eval-cond',
      ['λ', ['clauses', 'env'],
        ['cond',
          [['eq?', ['length', 'clauses'], 0], null],
          [['eq?', ['car', ['car', 'clauses']], ['quote', 'else']],
            ['meta-eval', ['nth', ['car', 'clauses'], 1], 'env']],
          [['meta-eval', ['car', ['car', 'clauses']], 'env'],
            ['meta-eval', ['nth', ['car', 'clauses'], 1], 'env']],
          ['else', ['eval-cond', ['cdr', 'clauses'], 'env']]]]],

    // eval-let
    ['define', 'eval-let',
      ['λ', ['bindings', 'body', 'outer-env'],
        ['let*', [
          ['names', ['map', ['λ', ['b'], ['car', 'b']], 'bindings']],
          ['vals', ['map', ['λ', ['b'], ['meta-eval', ['nth', 'b', 1], 'outer-env']], 'bindings']]
        ],
        ['meta-eval', 'body', ['extend-env-list', 'names', 'vals', 'outer-env']]]]],

    // eval-let*
    ['define', 'eval-let*',
      ['λ', ['bindings', 'body', 'env'],
        ['cond',
          [['eq?', ['length', 'bindings'], 0], ['meta-eval', 'body', 'env']],
          ['else',
            ['let*', [
              ['binding', ['car', 'bindings']],
              ['name', ['car', 'binding']],
              ['val', ['meta-eval', ['nth', 'binding', 1], 'env']]
            ],
            ['eval-let*', ['cdr', 'bindings'], 'body', ['extend-env', 'name', 'val', 'env']]]]]]],

    // apply-primitive
    ['define', 'apply-primitive',
      ['λ', ['op', 'args'],
        ['cond',
          [['eq?', 'op', ['quote', '+']], 
            ['reduce', ['λ', ['a', 'b'], ['+', 'a', 'b']], 'args']],
          [['eq?', 'op', ['quote', '-']],
            ['cond',
              [['eq?', ['length', 'args'], 1], ['-', 0, ['car', 'args']]],
              ['else', ['reduce', ['λ', ['a', 'b'], ['-', 'a', 'b']], 'args']]]],
          [['eq?', 'op', ['quote', '*']],
            ['reduce', ['λ', ['a', 'b'], ['*', 'a', 'b']], 'args']],
          [['eq?', 'op', ['quote', '/']],
            ['reduce', ['λ', ['a', 'b'], ['/', 'a', 'b']], 'args']],
          [['eq?', 'op', ['quote', '%']],
            ['reduce', ['λ', ['a', 'b'], ['%', 'a', 'b']], 'args']],
          [['eq?', 'op', ['quote', '>']],
            ['>', ['car', 'args'], ['nth', 'args', 1]]],
          [['eq?', 'op', ['quote', '<']],
            ['<', ['car', 'args'], ['nth', 'args', 1]]],
          [['eq?', 'op', ['quote', '>=']],
            ['>=', ['car', 'args'], ['nth', 'args', 1]]],
          [['eq?', 'op', ['quote', '<=']],
            ['<=', ['car', 'args'], ['nth', 'args', 1]]],
          [['eq?', 'op', ['quote', 'eq?']],
            ['eq?', ['car', 'args'], ['nth', 'args', 1]]],
          [['eq?', 'op', ['quote', 'length']],
            ['length', ['car', 'args']]],
          [['eq?', 'op', ['quote', 'car']],
            ['car', ['car', 'args']]],
          [['eq?', 'op', ['quote', 'cdr']],
            ['cdr', ['car', 'args']]],
          [['eq?', 'op', ['quote', 'cons']],
            ['cons', ['car', 'args'], ['nth', 'args', 1]]],
          [['eq?', 'op', ['quote', 'nth']],
            ['nth', ['car', 'args'], ['nth', 'args', 1]]],
          [['eq?', 'op', ['quote', 'list']],
            'args'],
          [['eq?', 'op', ['quote', 'null?']],
            ['null?', ['car', 'args']]],
          [['eq?', 'op', ['quote', 'number?']],
            ['number?', ['car', 'args']]],
          [['eq?', 'op', ['quote', 'boolean?']],
            ['boolean?', ['car', 'args']]],
          [['eq?', 'op', ['quote', 'string?']],
            ['string?', ['car', 'args']]],
          [['eq?', 'op', ['quote', 'list?']],
            ['list?', ['car', 'args']]],
          [['eq?', 'op', ['quote', 'object?']],
            ['object?', ['car', 'args']]],
          ['else', null]]]],

    // primitive?
    ['define', 'primitive?',
      ['λ', ['op'],
        ['or',
          ['eq?', 'op', ['quote', '+']],
          ['eq?', 'op', ['quote', '-']],
          ['eq?', 'op', ['quote', '*']],
          ['eq?', 'op', ['quote', '/']],
          ['eq?', 'op', ['quote', '%']],
          ['eq?', 'op', ['quote', '>']],
          ['eq?', 'op', ['quote', '<']],
          ['eq?', 'op', ['quote', '>=']],
          ['eq?', 'op', ['quote', '<=']],
          ['eq?', 'op', ['quote', 'eq?']],
          ['eq?', 'op', ['quote', 'length']],
          ['eq?', 'op', ['quote', 'car']],
          ['eq?', 'op', ['quote', 'cdr']],
          ['eq?', 'op', ['quote', 'cons']],
          ['eq?', 'op', ['quote', 'nth']],
          ['eq?', 'op', ['quote', 'list']],
          ['eq?', 'op', ['quote', 'null?']],
          ['eq?', 'op', ['quote', 'number?']],
          ['eq?', 'op', ['quote', 'boolean?']],
          ['eq?', 'op', ['quote', 'string?']],
          ['eq?', 'op', ['quote', 'list?']],
          ['eq?', 'op', ['quote', 'object?']]]]],

    // meta-eval (the main evaluator)
    ['define', 'meta-eval',
      ['λ', ['exp', 'env'],
        ['cond',
          [['number?', 'exp'], 'exp'],
          [['boolean?', 'exp'], 'exp'],
          [['null?', 'exp'], null],
          [['and', ['object?', 'exp'], ['not', ['list?', 'exp']]], 'exp'],
          [['string?', 'exp'], ['lookup', 'exp', 'env']],
          [['and', ['list?', 'exp'], ['eq?', ['length', 'exp'], 0]], []],
          [['list?', 'exp'],
            ['let*', [
              ['op', ['car', 'exp']],
              ['args', ['cdr', 'exp']]
            ],
            ['cond',
              [['eq?', 'op', ['quote', 'quote']], ['car', 'args']],
              [['eq?', 'op', ['quote', 'if']],
                ['eval-if', ['nth', 'args', 0], ['nth', 'args', 1], ['nth', 'args', 2], 'env']],
              [['eq?', 'op', ['quote', 'cond']], ['eval-cond', 'args', 'env']],
              [['eq?', 'op', ['quote', 'let']],
                ['eval-let', ['nth', 'args', 0], ['nth', 'args', 1], 'env']],
              [['eq?', 'op', ['quote', 'let*']],
                ['eval-let*', ['nth', 'args', 0], ['nth', 'args', 1], 'env']],
              [['or', ['eq?', 'op', ['quote', 'lambda']], ['eq?', 'op', ['quote', 'λ']]],
                ['make-closure', ['nth', 'args', 0], ['nth', 'args', 1], 'env']],
              [['eq?', 'op', ['quote', 'and']],
                ['cond',
                  [['eq?', ['length', 'args'], 0], true],
                  [['not', ['meta-eval', ['car', 'args'], 'env']], false],
                  ['else', ['meta-eval', ['cons', ['quote', 'and'], ['cdr', 'args']], 'env']]]],
              [['eq?', 'op', ['quote', 'or']],
                ['cond',
                  [['eq?', ['length', 'args'], 0], false],
                  [['meta-eval', ['car', 'args'], 'env'], true],
                  ['else', ['meta-eval', ['cons', ['quote', 'or'], ['cdr', 'args']], 'env']]]],
              [['eq?', 'op', ['quote', 'not']],
                ['not', ['meta-eval', ['car', 'args'], 'env']]],
              [['primitive?', 'op'],
                ['apply-primitive', 'op',
                  ['map', ['λ', ['a'], ['meta-eval', 'a', 'env']], 'args']]],
              ['else',
                ['let*', [
                  ['fn', ['meta-eval', 'op', 'env']],
                  ['evaluated-args', ['map', ['λ', ['a'], ['meta-eval', 'a', 'env']], 'args']]
                ],
                ['if', ['closure?', 'fn'],
                  ['apply-closure', 'fn', 'evaluated-args'],
                  null]]]
            ]]],
          ['else', null]
        ]]]
  ];

  // Evaluate each definition
  for (const def of definitions) {
    evaluate(def, globalEnv);
  }
}

// Test suite
const tests = [
  {
    name: 'Self-evaluating: number',
    expr: 42,
    expected: 42
  },
  {
    name: 'Self-evaluating: boolean true',
    expr: true,
    expected: true
  },
  {
    name: 'Self-evaluating: boolean false',
    expr: false,
    expected: false
  },
  {
    name: 'Self-evaluating: null',
    expr: null,
    expected: null
  },
  {
    name: 'Self-evaluating: empty list',
    expr: [],
    expected: []
  },
  {
    name: 'Arithmetic: addition',
    expr: ['+', 1, 2, 3],
    expected: 6
  },
  {
    name: 'Arithmetic: subtraction',
    expr: ['-', 10, 3],
    expected: 7
  },
  {
    name: 'Arithmetic: multiplication',
    expr: ['*', 4, 5],
    expected: 20
  },
  {
    name: 'Arithmetic: division',
    expr: ['/', 20, 4],
    expected: 5
  },
  {
    name: 'Arithmetic: nested',
    expr: ['*', ['+', 2, 3], ['-', 10, 4]],
    expected: 30
  },
  {
    name: 'Comparison: less than (true)',
    expr: ['<', 3, 5],
    expected: true
  },
  {
    name: 'Comparison: less than (false)',
    expr: ['<', 5, 3],
    expected: false
  },
  {
    name: 'Comparison: greater than',
    expr: ['>', 10, 5],
    expected: true
  },
  {
    name: 'Comparison: equality',
    expr: ['eq?', 5, 5],
    expected: true
  },
  {
    name: 'Quote: simple value',
    expr: ['quote', 'hello'],
    expected: 'hello'
  },
  {
    name: 'Quote: preserves list structure',
    expr: ['quote', [1, 2, ['+', 3, 4]]],
    expected: [1, 2, ['+', 3, 4]]
  },
  {
    name: 'If: true branch',
    expr: ['if', ['>', 10, 5], ['quote', 'yes'], ['quote', 'no']],
    expected: 'yes'
  },
  {
    name: 'If: false branch',
    expr: ['if', ['<', 10, 5], ['quote', 'yes'], ['quote', 'no']],
    expected: 'no'
  },
  {
    name: 'Let: simple binding',
    expr: ['let', [['x', 10]], 'x'],
    expected: 10
  },
  {
    name: 'Let: multiple bindings',
    expr: ['let', [['x', 10], ['y', 20]], ['+', 'x', 'y']],
    expected: 30
  },
  {
    name: 'Let*: sequential bindings',
    expr: ['let*', [['x', 5], ['y', ['+', 'x', 3]]], ['*', 'x', 'y']],
    expected: 40
  },
  {
    name: 'Cond: first branch matches',
    expr: ['cond', [['<', 3, 5], ['quote', 'first']], [['<', 3, 2], ['quote', 'second']], ['else', ['quote', 'default']]],
    expected: 'first'
  },
  {
    name: 'Cond: else branch',
    expr: ['cond', [['>', 3, 5], ['quote', 'first']], ['else', ['quote', 'default']]],
    expected: 'default'
  },
  {
    name: 'Lambda: simple application',
    expr: [['λ', ['x', 'y'], ['+', 'x', 'y']], 3, 4],
    expected: 7
  },
  {
    name: 'Lambda: closure captures environment',
    expr: ['let', [['make-adder', ['λ', ['n'], ['λ', ['x'], ['+', 'x', 'n']]]]], [['make-adder', 5], 10]],
    expected: 15
  },
  {
    name: 'And: all true',
    expr: ['and', true, true, true],
    expected: true
  },
  {
    name: 'And: short circuit on false',
    expr: ['and', true, false, true],
    expected: false
  },
  {
    name: 'Or: finds first true',
    expr: ['or', false, false, true],
    expected: true
  },
  {
    name: 'Or: all false',
    expr: ['or', false, false],
    expected: false
  },
  {
    name: 'Not: negates true',
    expr: ['not', true],
    expected: false
  },
  {
    name: 'Not: negates false',
    expr: ['not', false],
    expected: true
  },
  {
    name: 'List operations: car',
    expr: ['car', ['quote', [1, 2, 3]]],
    expected: 1
  },
  {
    name: 'List operations: cdr',
    expr: ['cdr', ['quote', [1, 2, 3]]],
    expected: [2, 3]
  },
  {
    name: 'List operations: cons',
    expr: ['cons', 0, ['quote', [1, 2, 3]]],
    expected: [0, 1, 2, 3]
  },
  {
    name: 'List operations: nth',
    expr: ['nth', ['quote', [10, 20, 30]], 1],
    expected: 20
  },
  {
    name: 'Factorial',
    expr: ['let', [[
      'fact',
      ['λ', ['self', 'n'],
        ['if', ['eq?', 'n', 0],
          1,
          ['*', 'n', ['self', 'self', ['-', 'n', 1]]]]]]], 
      ['fact', 'fact', 5]],
    expected: 120
  },
  {
    name: 'Fibonacci',
    expr: ['let', [[
      'fib',
      ['λ', ['self', 'n'],
        ['cond',
          [['eq?', 'n', 0], 0],
          [['eq?', 'n', 1], 1],
          ['else', ['+',
            ['self', 'self', ['-', 'n', 1]],
            ['self', 'self', ['-', 'n', 2]]]]]]]],
      ['fib', 'fib', 10]],
    expected: 55
  }
];

// Run tests
console.log('Loading meta-interpreter definitions...\n');
loadMetaInterpreter();
console.log('Meta-interpreter loaded successfully!\n');

console.log('Running meta-interpreter tests...\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    const result = runMetaEval(test.expr);
    const success = JSON.stringify(result) === JSON.stringify(test.expected);
    
    if (success) {
      console.log(`✓ ${test.name}`);
      passed++;
    } else {
      console.log(`✗ ${test.name}`);
      console.log(`  Expected: ${JSON.stringify(test.expected)}`);
      console.log(`  Got:      ${JSON.stringify(result)}`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ ${test.name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

console.log('='.repeat(60));
console.log(`\nResults: ${passed} passed, ${failed} failed out of ${tests.length} tests`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! The meta-interpreter works correctly.');
} else {
  console.log('\n⚠️ Some tests failed. Please check the output above.');
  process.exit(1);
}

