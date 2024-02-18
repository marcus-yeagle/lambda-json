const { globalEnv, evaluate } = require('../λjson.js');

test('defines and evaluates a lambda function in the global environment', () => {
  const result = evaluate(
    ['define', 'add', ['lambda', ['a', 'b'], ['+', 'a', 'b']]],
    globalEnv
  );
  expect(result).toBeInstanceOf(Function);
  expect(result(2, 3)).toBe(5);
  expect(globalEnv['add']).toBe(result);
});

test('uses a defined lambda function', () => {
  evaluate(
    ['define', 'multiply', ['λ', ['x', 'y'], ['*', 'x', 'y']]],
    globalEnv
  );
  const result = evaluate(['multiply', 4, 5], globalEnv);
  expect(result).toBe(20);
});

test('uses a lambda function with the current environment', () => {
  const result = evaluate(['λ', ['a', 'b'], ['+', 'a', 'b']], globalEnv);
  expect(result).toBeInstanceOf(Function);
  expect(result(2, 3)).toBe(5);
});
