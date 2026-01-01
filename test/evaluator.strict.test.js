const { evaluate, resetWarnings } = require('../λjson.js');

describe('strict mode', () => {
  beforeEach(() => {
    resetWarnings();
  });

  test('throws on unbound symbol in strict mode', () => {
    expect(() => 
      evaluate(['undefined-var'], {}, { strictMode: true })
    ).toThrow('Unbound symbol: undefined-var');
  });

  test('returns symbol as-is in non-strict mode (default)', () => {
    // Default behavior: unbound symbols return themselves
    const result = evaluate('unbound', {});
    expect(result).toBe('unbound');
  });

  test('allows defined symbols in strict mode', () => {
    // Test simple variable lookup
    const result = evaluate('x', { x: 42 }, { strictMode: true });
    expect(result).toBe(42);
  });

  test('allows defined symbols in expressions in strict mode', () => {
    // Test symbol in function application
    const result = evaluate(['+', 'x', 1], { x: 41 }, { strictMode: true });
    expect(result).toBe(42);
  });

  test('allows built-in operators in strict mode', () => {
    const result = evaluate(['+', 1, 2], {}, { strictMode: true });
    expect(result).toBe(3);
  });

  test('strict mode propagates through lambda calls', () => {
    // Define a lambda that uses an unbound symbol
    const lambda = evaluate(['λ', ['x'], ['y']], {}, { strictMode: true });
    // The lambda captures strict mode, so calling it should throw
    expect(() => lambda(5)).toThrow('Unbound symbol: y');
  });

  test('strict mode propagates through let bindings', () => {
    expect(() => 
      evaluate(
        ['let', [['x', 1]], ['unbound']],
        {},
        { strictMode: true }
      )
    ).toThrow('Unbound symbol: unbound');
  });
});

describe('deprecation warnings', () => {
  beforeEach(() => {
    resetWarnings();
  });

  test('warns on quote prefix by default', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    evaluate(["'hello"], {});
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('DEPRECATED')
    );
    
    consoleSpy.mockRestore();
  });

  test('does not warn when warnDeprecated is false', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    evaluate(["'hello"], {}, { warnDeprecated: false });
    
    expect(consoleSpy).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  test('warns only once per feature', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    evaluate(["'first"], {});
    evaluate(["'second"], {});
    evaluate(["'third"], {});
    
    // Should only warn once
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    
    consoleSpy.mockRestore();
  });

  test('quote form does not trigger warning', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const result = evaluate(['quote', 'hello'], {});
    
    expect(result).toBe('hello');
    expect(consoleSpy).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

