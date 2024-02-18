const { evaluate } = require('../λjson.js');

test('evaluates a λ.json string to JS string', () => {
  expect(evaluate('', {})).toBe('');
});

test('evaluates a λ.json string to JS string', () => {
  expect(evaluate('foo', {})).toBe('foo');
});

test('evaluates a λ.json string to JS string', () => {
  expect(evaluate('bar', {})).toBe('bar');
});

test('evaluates a λ.json empty string to JS empty string', () => {
  const result = evaluate('', {});
  expect(result).toBe('');
  expect(typeof result).toBe('string');
});

test('evaluates a λ.json string to JS string', () => {
  const result = evaluate('foo', {});
  expect(result).toBe('foo');
  expect(typeof result).toBe('string');
});

test('evaluates another λ.json string to JS string', () => {
  const result = evaluate('bar', {});
  expect(result).toBe('bar');
  expect(typeof result).toBe('string');
});
