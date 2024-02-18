const { globalEnv, evaluate } = require('../λjson.js');

test('evaluates a true condition in an if statement', () => {
  const result = evaluate(['if', true, 42, 0], globalEnv);
  expect(result).toBe(42);
});

test('evaluates a false condition in an if statement', () => {
  const result = evaluate(['if', false, 42, 0], globalEnv);
  expect(result).toBe(0);
});

test('evaluates a comparison in an if statement', () => {
  const result = evaluate(['if', ['>', 5, 2], 10, 20], globalEnv);
  expect(result).toBe(10);
});

test('evaluates a comparison in an if statement', () => {
  const result = evaluate(['if', ['<', 5, 2], 10, 20], globalEnv);
  expect(result).toBe(20);
});

test('evaluates a comparison in an if statement', () => {
  const result = evaluate(['if', ['eq?', 5, 5], 'foo', 'bar'], globalEnv);
  expect(result).toBe('foo');
});

test('evaluates a comparison in an if statement', () => {
  const result = evaluate(['if', ['eq?', 5, 2], 'foo', 'bar'], globalEnv);
  expect(result).toBe('bar');
});

test('evaluates a variable condition in an if statement', () => {
  globalEnv['flag'] = true;
  const result = evaluate(['if', 'flag', 'yes', 'no'], globalEnv);
  expect(result).toBe('yes');
});

test('evaluates a lambda function as a condition in an if statement', () => {
  evaluate(['define', 'isTrue', ['λ', ['x'], true]]);
  const result = evaluate(['if', ['isTrue', 1], 'yes', 'no'], globalEnv);
  expect(result).toBe('yes');
});
