const { globalEnv, evaluate } = require('../λjson.js');

test('evaluates a cond statement with a ">" condition', () => {
  const result = evaluate(
    [
      'cond',
      [['>', 5, 10], 'greater'],
      [['<', 5, 10], 'less'],
      ['else', 'equal'],
    ],
    globalEnv
  );
  expect(result).toBe('less');
});

test('evaluates a cond statement with a "<" condition', () => {
  const result = evaluate(
    [
      'cond',
      [['>', 15, 10], 'greater'],
      [['<', 5, 10], 'less'],
      ['else', 'equal'],
    ],
    globalEnv
  );
  expect(result).toBe('greater');
});

test('evaluates a cond statement with an "else" condition', () => {
  const result = evaluate(
    [
      'cond',
      [['>', 5, 10], 'greater'],
      [['<', 255, 30], 'less'],
      ['else', 'other'],
    ],
    globalEnv
  );
  expect(result).toBe('other');
});

test('evaluates a cond statement with multiple conditions and "else"', () => {
  const result = evaluate(
    [
      'cond',
      [['>', 5, 10], 'greater'],
      [['<', 15, 10], 'less'],
      [['<', 15, 20], 'alsoLess'],
      ['else', 'equal'],
    ],
    globalEnv
  );
  expect(result).toBe('alsoLess');
});

test('evaluates a cond statement with boolean conditions', () => {
  const result = evaluate(
    ['cond', [true, 'trueBranch'], ['else', 'other']],
    globalEnv
  );
  expect(result).toBe('trueBranch');
});

test('evaluates a cond statement with boolean conditions', () => {
  const result = evaluate(
    ['cond', [false, 'trueBranch'], ['else', 'other']],
    globalEnv
  );
  expect(result).toBe('other');
});

test('evaluates a cond statement with mixed conditions and "else"', () => {
  const result = evaluate(
    [
      'cond',
      [['>', 10, 15], 'greater'],
      [['<', 15, 10], 'less'],
      [['<', 115, 20], 'alsoLess'],
      [['>', 25, 3], 'alsoGreater'],
      ['else', 'other'],
    ],
    globalEnv
  );
  expect(result).toBe('alsoGreater');
});
