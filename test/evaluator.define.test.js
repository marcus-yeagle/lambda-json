const { globalEnv, evaluate } = require('../λjson.js');

test('defines and evaluates a variable in the global environment', () => {
  const result = evaluate(['define', 'x', 42], globalEnv);
  expect(result).toBe(42);
  expect(globalEnv['x']).toBe(42);
});

test('defines and evaluates a variable with an expression in the global environment', () => {
  const result = evaluate(['define', 'y', ['+', 10, 5]], globalEnv);
  expect(result).toBe(15);
  expect(globalEnv['y']).toBe(15);
});

test('redefines a variable in the global environment', () => {
  globalEnv['z'] = 5;
  const result = evaluate(['define', 'z', ['*', 2, 3]], globalEnv);
  expect(result).toBe(6);
  expect(globalEnv['z']).toBe(6);
});
