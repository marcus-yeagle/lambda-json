const { globalEnv, evaluate } = require('../λjson.js');

test('evaluates logical "and" operator with true arguments', () => {
  const result = evaluate(['and', true, true, true], globalEnv);
  expect(result).toBe(true);
});

test('evaluates logical "and" operator with false arguments', () => {
  const result = evaluate(['and', true, false, true], globalEnv);
  expect(result).toBe(false);
});

test('evaluates logical "not" operator with true argument', () => {
  const result = evaluate(['not', true], globalEnv);
  expect(result).toBe(false);
});

test('evaluates logical "not" operator with false argument', () => {
  const result = evaluate(['not', false], globalEnv);
  expect(result).toBe(true);
});

test('evaluates logical "or" operator with true arguments', () => {
  const result = evaluate(['or', true, false, true], globalEnv);
  expect(result).toBe(true);
});

test('evaluates logical "or" operator with false arguments', () => {
  const result = evaluate(['or', false, false, false], globalEnv);
  expect(result).toBe(false);
});
