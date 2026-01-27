/**
 * λJSON-toon.js - TOON Format Integration for λJSON
 * 
 * This module provides integration between λJSON (Lambda JSON) and TOON
 * (Token-Oriented Object Notation), enabling:
 * 
 * - Parsing λJSON expressions from TOON format
 * - Encoding λJSON results to TOON format
 * - Processing λJSON documents in TOON format
 * - Token-efficient serialization of λJSON programs
 * 
 * TOON is a compact, human-readable encoding of JSON designed for LLM inputs,
 * achieving ~40% token reduction while maintaining lossless JSON conversion.
 * 
 * @see https://github.com/toon-format/toon
 * @see https://toonformat.dev
 * @version 1.0.0
 */

const { 
  evaluate, 
  processDocument, 
  validateDocument,
  globalEnv, 
  Environment,
  defaultOptions,
  LambdaJSONError,
  ErrorType,
  SPEC_VERSION 
} = require('./λJSON.js');

/**
 * TOON integration version
 * @type {string}
 */
const TOON_INTEGRATION_VERSION = '1.0.0';

// ============================================
// TOON Module Loading (ES Module via dynamic import)
// ============================================

/**
 * Cached TOON module functions
 * @type {Object|null}
 */
let toonModule = null;

/**
 * Promise for loading the TOON module
 * @type {Promise|null}
 */
let toonModulePromise = null;

/**
 * Load the TOON module (ES module via dynamic import)
 * @returns {Promise<Object>} The TOON module exports
 * @private
 */
async function loadToonModule() {
  if (toonModule) {
    return toonModule;
  }
  
  if (!toonModulePromise) {
    toonModulePromise = import('@toon-format/toon').then(mod => {
      toonModule = mod;
      return mod;
    });
  }
  
  return toonModulePromise;
}

/**
 * Initialize the TOON module synchronously for environments that have already loaded it
 * Call this at startup if you need synchronous access
 * @returns {Promise<void>}
 */
async function initToon() {
  await loadToonModule();
}

/**
 * Get the TOON module, throwing if not initialized
 * @returns {Object}
 * @private
 */
function getToon() {
  if (!toonModule) {
    throw new Error('TOON module not initialized. Call initToon() first or use async functions.');
  }
  return toonModule;
}

// ============================================
// Core TOON ↔ λJSON Conversion Functions (Async)
// ============================================

/**
 * Parse a TOON-encoded string into a JavaScript value (JSON-compatible)
 * 
 * @param {string} toonString - TOON-encoded string
 * @returns {Promise<*>} Parsed JavaScript value
 * @throws {Error} If parsing fails
 * 
 * @example
 * const expr = await parseToonAsync('data[3]: 1,2,3\ncode: ["+", 1, 2]');
 */
async function parseToonAsync(toonString) {
  if (typeof toonString !== 'string') {
    throw new LambdaJSONError(
      ErrorType.TYPE_ERROR,
      'parseToon requires a string argument',
      toonString
    );
  }
  
  const { decode } = await loadToonModule();
  
  try {
    return decode(toonString);
  } catch (error) {
    throw new LambdaJSONError(
      ErrorType.SYNTAX_ERROR,
      `Failed to parse TOON: ${error.message}`,
      toonString
    );
  }
}

/**
 * Encode a JavaScript value to TOON format
 * 
 * @param {*} value - JavaScript value to encode (must be JSON-compatible)
 * @returns {Promise<string>} TOON-encoded string
 * @throws {Error} If encoding fails
 */
async function toToonAsync(value) {
  const { encode } = await loadToonModule();
  
  try {
    return encode(value);
  } catch (error) {
    throw new LambdaJSONError(
      ErrorType.RUNTIME_ERROR,
      `Failed to encode to TOON: ${error.message}`,
      value
    );
  }
}

// ============================================
// Core TOON ↔ λJSON Conversion Functions (Sync after init)
// ============================================

/**
 * Parse a TOON-encoded string into a JavaScript value (JSON-compatible)
 * Requires initToon() to be called first
 * 
 * @param {string} toonString - TOON-encoded string
 * @returns {*} Parsed JavaScript value
 * @throws {Error} If parsing fails or module not initialized
 * 
 * @example
 * await initToon();
 * const expr = parseToon('data[3]: 1,2,3\ncode: ["+", 1, 2]');
 * // { data: [1, 2, 3], code: ["+", 1, 2] }
 */
function parseToon(toonString) {
  if (typeof toonString !== 'string') {
    throw new LambdaJSONError(
      ErrorType.TYPE_ERROR,
      'parseToon requires a string argument',
      toonString
    );
  }
  
  const { decode } = getToon();
  
  try {
    return decode(toonString);
  } catch (error) {
    throw new LambdaJSONError(
      ErrorType.SYNTAX_ERROR,
      `Failed to parse TOON: ${error.message}`,
      toonString
    );
  }
}

/**
 * Encode a JavaScript value to TOON format
 * Requires initToon() to be called first
 * 
 * @param {*} value - JavaScript value to encode (must be JSON-compatible)
 * @returns {string} TOON-encoded string
 * @throws {Error} If encoding fails or module not initialized
 * 
 * @example
 * await initToon();
 * const toon = toToon({ data: [1, 2, 3], code: ["+", 1, 2] });
 */
function toToon(value) {
  const { encode } = getToon();
  
  try {
    return encode(value);
  } catch (error) {
    throw new LambdaJSONError(
      ErrorType.RUNTIME_ERROR,
      `Failed to encode to TOON: ${error.message}`,
      value
    );
  }
}

/**
 * Parse TOON from an array of lines
 * 
 * @param {string[]} lines - Array of TOON-encoded lines
 * @returns {*} Parsed JavaScript value
 * 
 * @example
 * await initToon();
 * const expr = parseToonLines(['data[3]: 1,2,3', 'code: ["+", 1, 2]']);
 */
function parseToonLines(lines) {
  if (!Array.isArray(lines)) {
    throw new LambdaJSONError(
      ErrorType.TYPE_ERROR,
      'parseToonLines requires an array of strings',
      lines
    );
  }
  
  const { decodeFromLines } = getToon();
  
  try {
    // Use decodeFromLines if available, otherwise join and decode
    if (decodeFromLines) {
      return decodeFromLines(lines);
    }
    return parseToon(lines.join('\n'));
  } catch (error) {
    throw new LambdaJSONError(
      ErrorType.SYNTAX_ERROR,
      `Failed to parse TOON lines: ${error.message}`,
      lines
    );
  }
}

/**
 * Encode a JavaScript value to an array of TOON lines
 * 
 * @param {*} value - JavaScript value to encode
 * @returns {string[]} Array of TOON-encoded lines
 */
function toToonLines(value) {
  const { encodeLines } = getToon();
  
  try {
    // Use encodeLines if available (returns a generator, convert to array)
    if (encodeLines) {
      return [...encodeLines(value)];
    }
    return toToon(value).split('\n');
  } catch (error) {
    throw new LambdaJSONError(
      ErrorType.RUNTIME_ERROR,
      `Failed to encode to TOON lines: ${error.message}`,
      value
    );
  }
}

// ============================================
// λJSON Evaluation with TOON
// ============================================

/**
 * Evaluate a TOON-encoded λJSON expression
 * 
 * @param {string} toonExpression - TOON-encoded λJSON expression
 * @param {Environment|Object} [env={}] - Environment for evaluation
 * @param {Object} [options] - Evaluation options
 * @returns {*} Result of evaluation
 * 
 * @example
 * await initToon();
 * const result = evaluateToon('[3]:\n  - +\n  - 1\n  - 2');
 * // 3
 */
function evaluateToon(toonExpression, env = {}, options = defaultOptions) {
  const expression = parseToon(toonExpression);
  return evaluate(expression, env, options);
}

/**
 * Evaluate a TOON-encoded λJSON expression (async version)
 * 
 * @param {string} toonExpression - TOON-encoded λJSON expression
 * @param {Environment|Object} [env={}] - Environment for evaluation
 * @param {Object} [options] - Evaluation options
 * @returns {Promise<*>} Result of evaluation
 */
async function evaluateToonAsync(toonExpression, env = {}, options = defaultOptions) {
  const expression = await parseToonAsync(toonExpression);
  return evaluate(expression, env, options);
}

/**
 * Process a λJSON document from TOON format
 * 
 * Handles the common pattern of:
 * - Parsing TOON into a document object
 * - Validating document metadata
 * - Applying code to data
 * - Returning the result (optionally as TOON)
 * 
 * @param {string} toonDocument - TOON-encoded λJSON document
 * @param {Object} [options] - Processing options
 * @param {boolean} [options.outputToon=false] - If true, return result as TOON string
 * @returns {Object|string} The document with result, optionally TOON-encoded
 */
function processToonDocument(toonDocument, options = {}) {
  const { outputToon = false, ...evalOptions } = options;
  
  // Parse the TOON document
  const doc = parseToon(toonDocument);
  
  // Process using the standard λJSON document processor
  const result = processDocument(doc, evalOptions);
  
  // Return as TOON if requested
  if (outputToon) {
    return toToon(result);
  }
  
  return result;
}

/**
 * Process a λJSON document from TOON format (async version)
 * 
 * @param {string} toonDocument - TOON-encoded λJSON document
 * @param {Object} [options] - Processing options
 * @returns {Promise<Object|string>} The document with result
 */
async function processToonDocumentAsync(toonDocument, options = {}) {
  const { outputToon = false, ...evalOptions } = options;
  
  const doc = await parseToonAsync(toonDocument);
  const result = processDocument(doc, evalOptions);
  
  if (outputToon) {
    return await toToonAsync(result);
  }
  
  return result;
}

/**
 * Convert a JSON string to TOON format
 * Utility for converting existing JSON documents
 * 
 * @param {string} jsonString - JSON string to convert
 * @returns {string} TOON-encoded string
 */
function jsonToToon(jsonString) {
  if (typeof jsonString !== 'string') {
    throw new LambdaJSONError(
      ErrorType.TYPE_ERROR,
      'jsonToToon requires a string argument',
      jsonString
    );
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    return toToon(parsed);
  } catch (error) {
    throw new LambdaJSONError(
      ErrorType.SYNTAX_ERROR,
      `Failed to convert JSON to TOON: ${error.message}`,
      jsonString
    );
  }
}

/**
 * Convert a TOON string to JSON format
 * Utility for converting TOON to standard JSON
 * 
 * @param {string} toonString - TOON string to convert
 * @param {number} [indent=2] - JSON indentation (0 for compact)
 * @returns {string} JSON-encoded string
 */
function toonToJson(toonString, indent = 2) {
  const parsed = parseToon(toonString);
  return JSON.stringify(parsed, null, indent);
}

// ============================================
// λJSON Built-in Extensions for TOON
// ============================================

/**
 * Add TOON-related functions to the λJSON global environment
 * This makes TOON functions available within λJSON expressions
 */
function installToonBuiltins() {
  // to-toon: Convert a value to TOON string
  globalEnv['to-toon'] = (args) => {
    if (args.length !== 1) {
      throw new Error('to-toon requires exactly one argument');
    }
    return toToon(args[0]);
  };
  
  // from-toon: Parse a TOON string to value
  globalEnv['from-toon'] = (args) => {
    if (args.length !== 1) {
      throw new Error('from-toon requires exactly one argument');
    }
    if (typeof args[0] !== 'string') {
      throw new Error('from-toon requires a string argument');
    }
    return parseToon(args[0]);
  };
  
  // toon?: Check if a string is valid TOON
  globalEnv['toon?'] = (args) => {
    if (args.length !== 1) {
      throw new Error('toon? requires exactly one argument');
    }
    if (typeof args[0] !== 'string') {
      return false;
    }
    try {
      parseToon(args[0]);
      return true;
    } catch {
      return false;
    }
  };
}

// ============================================
// File Format Detection
// ============================================

/**
 * Detect if a string is likely TOON format (vs JSON)
 * Uses heuristics based on TOON syntax patterns
 * 
 * @param {string} content - String content to analyze
 * @returns {'toon'|'json'|'unknown'} Detected format
 */
function detectFormat(content) {
  if (typeof content !== 'string' || content.trim().length === 0) {
    return 'unknown';
  }
  
  const trimmed = content.trim();
  
  // JSON always starts with { or [ for objects/arrays
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    // Could still be TOON if it's a nested structure
    // Try parsing as JSON first
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON, might be TOON
    }
  }
  
  // TOON patterns:
  // - key[N]: values (array with length)
  // - key{fields}: header (tabular array)
  // - key: value (without braces, simple key-value)
  // - indentation-based nesting
  const toonPatterns = [
    /^\w+\[\d+\]:/m,           // array[N]: pattern
    /^\w+\{[\w,]+\}:/m,        // key{fields}: tabular header
    /^  - /m,                   // YAML-style list items
    /^\w+:\s*$/m,              // key: (followed by indented content)
  ];
  
  for (const pattern of toonPatterns) {
    if (pattern.test(trimmed)) {
      return 'toon';
    }
  }
  
  // Default: try to parse as JSON
  try {
    JSON.parse(trimmed);
    return 'json';
  } catch {
    // Assume TOON for non-JSON
    return 'toon';
  }
}

/**
 * Parse content as either JSON or TOON (auto-detect)
 * 
 * @param {string} content - Content to parse
 * @param {string} [hint] - Format hint: 'json', 'toon', or 'auto'
 * @returns {*} Parsed value
 */
function parseAuto(content, hint = 'auto') {
  if (hint === 'json') {
    return JSON.parse(content);
  }
  
  if (hint === 'toon') {
    return parseToon(content);
  }
  
  // Auto-detect
  const format = detectFormat(content);
  
  if (format === 'json') {
    return JSON.parse(content);
  }
  
  return parseToon(content);
}

// ============================================
// Token Estimation Utilities
// ============================================

/**
 * Estimate token count for a string (rough approximation)
 * Uses a simple heuristic: ~4 characters per token on average
 * 
 * @param {string} str - String to estimate
 * @returns {number} Estimated token count
 */
function estimateTokens(str) {
  if (typeof str !== 'string') {
    str = JSON.stringify(str);
  }
  // Rough estimate: 1 token ≈ 4 characters for English/code
  return Math.ceil(str.length / 4);
}

/**
 * Compare token efficiency between JSON and TOON for a value
 * 
 * @param {*} value - Value to compare
 * @returns {{json: {str: string, tokens: number}, toon: {str: string, tokens: number}, savings: number}}
 */
function compareFormats(value) {
  const jsonStr = JSON.stringify(value);
  const toonStr = toToon(value);
  
  const jsonTokens = estimateTokens(jsonStr);
  const toonTokens = estimateTokens(toonStr);
  
  const savings = jsonTokens > 0 
    ? ((jsonTokens - toonTokens) / jsonTokens * 100).toFixed(1)
    : 0;
  
  return {
    json: { str: jsonStr, tokens: jsonTokens, bytes: jsonStr.length },
    toon: { str: toonStr, tokens: toonTokens, bytes: toonStr.length },
    savings: parseFloat(savings)
  };
}

// ============================================
// Exports
// ============================================

module.exports = {
  // Version info
  TOON_INTEGRATION_VERSION,
  
  // Initialization
  initToon,
  
  // Core conversion functions (sync, requires init)
  parseToon,
  toToon,
  parseToonLines,
  toToonLines,
  
  // Core conversion functions (async, self-initializing)
  parseToonAsync,
  toToonAsync,
  
  // λJSON evaluation with TOON
  evaluateToon,
  evaluateToonAsync,
  processToonDocument,
  processToonDocumentAsync,
  
  // Utility conversions
  jsonToToon,
  toonToJson,
  
  // Format detection
  detectFormat,
  parseAuto,
  
  // Token utilities
  estimateTokens,
  compareFormats,
  
  // Environment extension
  installToonBuiltins,
  
  // Re-export core λJSON functions for convenience
  evaluate,
  processDocument,
  validateDocument,
  globalEnv,
  Environment,
  defaultOptions,
  LambdaJSONError,
  ErrorType,
  SPEC_VERSION
};
