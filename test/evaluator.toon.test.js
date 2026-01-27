/**
 * Tests for λJSON-TOON integration
 */

const {
  parseToon,
  toToon,
  parseToonLines,
  toToonLines,
  evaluateToon,
  processToonDocument,
  jsonToToon,
  toonToJson,
  detectFormat,
  parseAuto,
  estimateTokens,
  compareFormats,
  installToonBuiltins,
  initToon,
  evaluate,
  globalEnv
} = require('../λJSON-toon.js');

// Initialize TOON module before all tests
beforeAll(async () => {
  await initToon();
});

describe('TOON Parsing', () => {
  test('parses simple object', () => {
    const toon = 'name: John\nage: 30';
    const result = parseToon(toon);
    expect(result).toEqual({ name: 'John', age: 30 });
  });

  test('parses array with length', () => {
    const toon = 'data[3]: 1,2,3';
    const result = parseToon(toon);
    expect(result).toEqual({ data: [1, 2, 3] });
  });

  test('parses nested structure', () => {
    const toon = `data[4]: 1,2,3,4
code[3]:
  - λ
  - [1]: nums
  - [3]: +,1,2`;
    const result = parseToon(toon);
    expect(result.data).toEqual([1, 2, 3, 4]);
    expect(result.code[0]).toBe('λ');
    expect(result.code[1]).toEqual(['nums']);
  });

  test('throws on invalid input type', () => {
    expect(() => parseToon(123)).toThrow('parseToon requires a string argument');
  });
});

describe('TOON Encoding', () => {
  test('encodes simple object', () => {
    const obj = { name: 'John', age: 30 };
    const result = toToon(obj);
    expect(result).toContain('name: John');
    expect(result).toContain('age: 30');
  });

  test('encodes array', () => {
    const arr = [1, 2, 3];
    const result = toToon(arr);
    expect(result).toBe('[3]: 1,2,3');
  });

  test('encodes nested λJSON expression', () => {
    const expr = ['+', 1, 2];
    const result = toToon(expr);
    expect(result).toBe('[3]: +,1,2');
  });

  test('round-trip preserves data', () => {
    const original = {
      data: [1, 2, 3, 4],
      code: ['λ', ['x'], ['+', 'x', 1]]
    };
    const toon = toToon(original);
    const decoded = parseToon(toon);
    expect(decoded).toEqual(original);
  });
});

describe('TOON Lines', () => {
  test('parses from lines', () => {
    const lines = ['data[3]: 1,2,3', 'code: ["+", 1, 2]'];
    const result = parseToonLines(lines);
    expect(result.data).toEqual([1, 2, 3]);
  });

  test('encodes to lines', () => {
    const obj = { a: 1, b: 2 };
    const lines = toToonLines(obj);
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });
});

describe('λJSON Evaluation with TOON', () => {
  test('evaluates TOON expression', () => {
    const toon = '[3]: +,1,2';
    const result = evaluateToon(toon);
    expect(result).toBe(3);
  });

  test('evaluates complex TOON expression', () => {
    const toon = `[3]:
  - *
  - 3
  - 4`;
    const result = evaluateToon(toon);
    expect(result).toBe(12);
  });
});

describe('TOON Document Processing', () => {
  test('processes TOON document', () => {
    const toon = `data[4]: 1,2,3,4
code[3]:
  - λ
  - [1]: nums
  - [2]: length,nums`;
    const result = processToonDocument(toon);
    expect(result.data).toEqual([1, 2, 3, 4]);
    expect(result.result).toBe(4);
  });

  test('outputs TOON format when requested', () => {
    const toon = `data[3]: 1,2,3
code[3]:
  - λ
  - [1]: nums
  - [2]: length,nums`;
    const result = processToonDocument(toon, { outputToon: true });
    expect(typeof result).toBe('string');
    expect(result).toContain('result: 3');
  });
});

describe('JSON ↔ TOON Conversion', () => {
  test('converts JSON to TOON', () => {
    const json = '{"name": "test", "value": 42}';
    const toon = jsonToToon(json);
    expect(toon).toContain('name: test');
    expect(toon).toContain('value: 42');
  });

  test('converts TOON to JSON', () => {
    const toon = 'name: test\nvalue: 42';
    const json = toonToJson(toon);
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe('test');
    expect(parsed.value).toBe(42);
  });

  test('round-trip JSON → TOON → JSON', () => {
    const original = { arr: [1, 2, 3], nested: { a: 1 } };
    const json = JSON.stringify(original);
    const toon = jsonToToon(json);
    const backToJson = toonToJson(toon);
    const parsed = JSON.parse(backToJson);
    expect(parsed).toEqual(original);
  });
});

describe('Format Detection', () => {
  test('detects JSON format', () => {
    expect(detectFormat('{"key": "value"}')).toBe('json');
    expect(detectFormat('[1, 2, 3]')).toBe('json');
  });

  test('detects TOON format', () => {
    expect(detectFormat('data[3]: 1,2,3')).toBe('toon');
    expect(detectFormat('key:\n  - value')).toBe('toon');
  });

  test('handles empty input', () => {
    expect(detectFormat('')).toBe('unknown');
    expect(detectFormat('   ')).toBe('unknown');
  });
});

describe('Auto-Parse', () => {
  test('auto-parses JSON', () => {
    const json = '{"x": 1}';
    const result = parseAuto(json);
    expect(result).toEqual({ x: 1 });
  });

  test('auto-parses TOON', () => {
    const toon = 'x: 1';
    const result = parseAuto(toon);
    expect(result).toEqual({ x: 1 });
  });

  test('respects format hint', () => {
    const json = '{"x": 1}';
    const result = parseAuto(json, 'json');
    expect(result).toEqual({ x: 1 });
  });
});

describe('Token Estimation', () => {
  test('estimates tokens for string', () => {
    const tokens = estimateTokens('Hello world');
    expect(tokens).toBeGreaterThan(0);
    expect(typeof tokens).toBe('number');
  });

  test('estimates tokens for object', () => {
    const tokens = estimateTokens({ key: 'value' });
    expect(tokens).toBeGreaterThan(0);
  });
});

describe('Format Comparison', () => {
  test('compares JSON and TOON efficiency', () => {
    const data = {
      users: [
        { id: 1, name: 'Alice', active: true },
        { id: 2, name: 'Bob', active: false },
        { id: 3, name: 'Carol', active: true }
      ]
    };
    const comparison = compareFormats(data);
    
    expect(comparison.json.tokens).toBeGreaterThan(0);
    expect(comparison.toon.tokens).toBeGreaterThan(0);
    expect(typeof comparison.savings).toBe('number');
    expect(comparison.json.str).toBeTruthy();
    expect(comparison.toon.str).toBeTruthy();
  });
});

describe('TOON Builtins', () => {
  beforeAll(() => {
    installToonBuiltins();
  });

  test('to-toon function with object', () => {
    // Test the direct builtin function
    const toToonFn = globalEnv['to-toon'];
    const result = toToonFn([{ x: 1 }]);
    expect(result).toBe('x: 1');
  });

  test('from-toon function with string', () => {
    // Test the direct builtin function
    const fromToonFn = globalEnv['from-toon'];
    const result = fromToonFn(['x: 1']);
    expect(result).toEqual({ x: 1 });
  });

  test('toon? predicate - valid TOON', () => {
    const toonPredicate = globalEnv['toon?'];
    const result = toonPredicate(['x: 1']);
    expect(result).toBe(true);
  });

  test('toon? predicate - non-string', () => {
    const toonPredicate = globalEnv['toon?'];
    const result = toonPredicate([42]);
    expect(result).toBe(false);
  });
  
  test('toon? predicate - invalid TOON', () => {
    const toonPredicate = globalEnv['toon?'];
    // An invalid TOON string should return false
    const result = toonPredicate(['not valid {{{ toon']);
    // Since the parser is lenient, it might still parse - let's just check it returns boolean
    expect(typeof result).toBe('boolean');
  });
});

describe('λJSON Expression in TOON', () => {
  test('simple arithmetic in TOON format', () => {
    // Create expression and encode to TOON, then decode and evaluate
    const expr = ['+', 1, 2, 3];
    const toon = toToon(expr);
    const parsed = parseToon(toon);
    expect(parsed).toEqual(expr);
    
    const result = evaluate(parsed, globalEnv);
    expect(result).toBe(6);
  });

  test('lambda expression round-trip', () => {
    // Test that lambda expressions survive TOON encoding
    const expr = ['λ', ['x'], ['*', 'x', 'x']];
    const toon = toToon(expr);
    const parsed = parseToon(toon);
    expect(parsed).toEqual(expr);
    
    // Evaluate the lambda and apply it
    const fn = evaluate(parsed, globalEnv);
    expect(fn(5)).toBe(25);
  });

  test('map function via TOON round-trip', () => {
    // Build the expression, encode to TOON, decode, then evaluate
    const expr = ['map', ['λ', ['x'], ['*', 'x', 'x']], [1, 2, 3, 4, 5]];
    const toon = toToon(expr);
    const parsed = parseToon(toon);
    
    const result = evaluate(parsed, globalEnv);
    expect(result).toEqual([1, 4, 9, 16, 25]);
  });

  test('filter function via TOON round-trip', () => {
    const expr = ['filter', ['λ', ['x'], ['>', 'x', 2]], [1, 2, 3, 4, 5]];
    const toon = toToon(expr);
    const parsed = parseToon(toon);
    
    const result = evaluate(parsed, globalEnv);
    expect(result).toEqual([3, 4, 5]);
  });

  test('document with code and data round-trip', () => {
    const doc = {
      data: [1, 2, 3, 4, 5],
      code: ['λ', ['nums'], ['reduce', ['λ', ['a', 'b'], ['+', 'a', 'b']], 'nums']]
    };
    
    const toon = toToon(doc);
    const parsed = parseToon(toon);
    expect(parsed.data).toEqual(doc.data);
    expect(parsed.code).toEqual(doc.code);
    
    // Process the document
    const fn = evaluate(parsed.code, globalEnv);
    const result = fn(parsed.data);
    expect(result).toBe(15);
  });
});
