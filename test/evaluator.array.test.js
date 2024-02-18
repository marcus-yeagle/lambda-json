const { evaluate } = require('../λjson.js');

test('evaluates a λ.json array of numbers to a JS array of numbers', () => {
  const result = evaluate([1, 2, 3], {});
  expect(result).toEqual([1, 2, 3]);
  expect(Array.isArray(result)).toBe(true);
});

test('evaluates a λ.json array of strings to a JS array of strings', () => {
  const result = evaluate(['apple', 'banana', 'cherry'], {});
  expect(result).toEqual(['apple', 'banana', 'cherry']);
  expect(Array.isArray(result)).toBe(true);
});

test('evaluates a λ.json array of mixed types to a JS array of mixed types', () => {
  const result = evaluate([1, 'two', true], {});
  expect(result).toEqual([1, 'two', true]);
  expect(Array.isArray(result)).toBe(true);
});
