const { globalEnv, evaluate } = require('../λJSON.js');

test('letrec with simple non-recursive bindings', () => {
  const result = evaluate(
    ['letrec', [['a', 3], ['b', 4]], ['+', 'a', 'b']],
    globalEnv
  );
  expect(result).toBe(7);
});

test('letrec with self-recursive factorial function', () => {
  const result = evaluate(
    [
      'letrec',
      [
        [
          'fact',
          [
            'λ',
            ['n'],
            ['if', ['<', 'n', 2], 1, ['*', 'n', ['fact', ['-', 'n', 1]]]],
          ],
        ],
      ],
      ['fact', 5],
    ],
    globalEnv
  );
  expect(result).toBe(120);
});

test('letrec with mutually recursive even?/odd? functions', () => {
  const resultEven = evaluate(
    [
      'letrec',
      [
        [
          'even?',
          [
            'λ',
            ['n'],
            ['if', ['eq?', 'n', 0], true, ['odd?', ['-', 'n', 1]]],
          ],
        ],
        [
          'odd?',
          [
            'λ',
            ['n'],
            ['if', ['eq?', 'n', 0], false, ['even?', ['-', 'n', 1]]],
          ],
        ],
      ],
      ['even?', 4],
    ],
    globalEnv
  );
  expect(resultEven).toBe(true);

  const resultOdd = evaluate(
    [
      'letrec',
      [
        [
          'even?',
          [
            'λ',
            ['n'],
            ['if', ['eq?', 'n', 0], true, ['odd?', ['-', 'n', 1]]],
          ],
        ],
        [
          'odd?',
          [
            'λ',
            ['n'],
            ['if', ['eq?', 'n', 0], false, ['even?', ['-', 'n', 1]]],
          ],
        ],
      ],
      ['odd?', 5],
    ],
    globalEnv
  );
  expect(resultOdd).toBe(true);
});

test('letrec shadows outer scope variables', () => {
  evaluate(['define', 'x', 100], globalEnv);
  const result = evaluate(
    ['letrec', [['x', 5]], ['+', 'x', 1]],
    globalEnv
  );
  expect(result).toBe(6);
  expect(globalEnv['x']).toBe(100); // outer scope unchanged
});

test('letrec with nested letrec', () => {
  const result = evaluate(
    [
      'letrec',
      [['a', 10]],
      ['letrec', [['b', ['+', 'a', 5]]], ['+', 'a', 'b']],
    ],
    globalEnv
  );
  expect(result).toBe(25);
});
