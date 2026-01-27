const { 
  processDocument, 
  validateDocument, 
  SPEC_VERSION, 
  getVersion,
  resetWarnings 
} = require('../λJSON.js');

describe('document validation', () => {
  test('validates plain expression as valid', () => {
    const result = validateDocument(['+', 1, 2]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validates document without metadata', () => {
    const result = validateDocument({ data: [1, 2, 3], code: ['length', 'data'] });
    expect(result.valid).toBe(true);
  });

  test('validates document with valid $version', () => {
    const result = validateDocument({ $version: '1.0', data: [] });
    expect(result.valid).toBe(true);
  });

  test('validates document with valid $schema', () => {
    const result = validateDocument({ 
      $schema: 'https://lambda-json.org/schema/v1.0',
      data: [] 
    });
    expect(result.valid).toBe(true);
  });

  test('rejects invalid $version format', () => {
    const result = validateDocument({ $version: 'invalid' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('$version must be in semver format (e.g., "1.0" or "1.0.0")');
  });

  test('rejects non-string $version', () => {
    const result = validateDocument({ $version: 1.0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('$version must be a string');
  });

  test('warns on unknown schema', () => {
    const result = validateDocument({ $schema: 'https://example.com/schema' });
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('warns on incompatible major version', () => {
    const result = validateDocument({ $version: '2.0.0' });
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('may not be fully compatible'))).toBe(true);
  });
});

describe('processDocument', () => {
  beforeEach(() => {
    resetWarnings();
  });

  test('processes document with lambda code and data', () => {
    const doc = {
      data: [1, 2, 3, 4],
      code: ['λ', ['nums'], ['length', 'nums']]
    };
    const result = processDocument(doc, { warnDeprecated: false });
    expect(result.result).toBe(4);
    expect(result.data).toEqual([1, 2, 3, 4]);
  });

  test('calculates average', () => {
    const doc = {
      data: [1, 2, 3, 4, 5],
      code: ['λ', ['nums'], 
        ['/', 
          ['reduce', ['λ', ['acc', 'n'], ['+', 'acc', 'n']], 'nums'],
          ['length', 'nums']
        ]
      ]
    };
    const result = processDocument(doc, { warnDeprecated: false });
    expect(result.result).toBe(3);
  });

  test('preserves document metadata', () => {
    const doc = {
      $version: '1.0',
      description: 'Test document',
      data: 5,
      code: ['λ', ['x'], ['*', 'x', 2]]
    };
    const result = processDocument(doc, { warnDeprecated: false });
    expect(result.$version).toBe('1.0');
    expect(result.description).toBe('Test document');
    expect(result.result).toBe(10);
  });

  test('handles document without data', () => {
    const doc = {
      code: ['+', 1, 2, 3]
    };
    const result = processDocument(doc, { warnDeprecated: false });
    expect(result.result).toBe(6);
  });

  test('handles document without code', () => {
    const doc = {
      data: [1, 2, 3],
      description: 'Just data'
    };
    const result = processDocument(doc, { warnDeprecated: false });
    expect(result).toEqual(doc); // Unchanged
  });

  test('throws on invalid document metadata', () => {
    const doc = {
      $version: 'invalid',
      code: ['+', 1, 2]
    };
    expect(() => processDocument(doc)).toThrow('Invalid document');
  });

  test('passes through plain expressions', () => {
    const result = processDocument(['+', 1, 2], { warnDeprecated: false });
    expect(result).toEqual(['+', 1, 2]);
  });

  test('passes through primitives', () => {
    expect(processDocument(42)).toBe(42);
    expect(processDocument('hello')).toBe('hello');
    expect(processDocument(null)).toBe(null);
  });
});

describe('version info', () => {
  test('SPEC_VERSION is defined', () => {
    expect(SPEC_VERSION).toBeDefined();
    expect(typeof SPEC_VERSION).toBe('string');
    expect(SPEC_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('getVersion returns version info', () => {
    const info = getVersion();
    expect(info.version).toBe(SPEC_VERSION);
    expect(info.specVersion).toBe(SPEC_VERSION);
  });
});

