const { evaluate } = require('../λjson.js');
test('evaluates a λ.json number to JS number', () => {
  expect(evaluate(42, {})).toBe(42);
});

test('evaluates a negative λ.json number to a negative JS number', () => {
  expect(evaluate(-3, {})).toBe(-3);
});

test('evaluates 0 to 0', () => {
  expect(evaluate(0, {})).toBe(0);
});

test('evaluates Infinity to Infinity', () => {
  expect(evaluate(Infinity, {})).toBe(Infinity);
});

test('evaluates NaN to NaN', () => {
  expect(evaluate(NaN, {})).toBe(NaN);
});

test('evaluates a λ.json number to JS number', () => {
  const result = evaluate(42, {});
  expect(result).toBe(42);
  expect(typeof result).toBe('number');
});

test('evaluates a negative λ.json number to a negative JS number', () => {
  const result = evaluate(-3, {});
  expect(result).toBe(-3);
  expect(typeof result).toBe('number');
});

test('evaluates 0 to 0', () => {
  const result = evaluate(0, {});
  expect(result).toBe(0);
  expect(typeof result).toBe('number');
});

test('evaluates Infinity to Infinity', () => {
  const result = evaluate(Infinity, {});
  expect(result).toBe(Infinity);
  expect(typeof result).toBe('number');
});

test('evaluates NaN to NaN', () => {
  const result = evaluate(NaN, {});
  expect(result).toBe(NaN);
  expect(typeof result).toBe('number');
});
