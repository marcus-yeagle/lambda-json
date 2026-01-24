/**
 * λJSON Fast Interpreter
 * 
 * Unified API that provides both tree-walking and bytecode evaluation.
 * Use this module when you need maximum performance.
 * 
 * Features:
 * - Automatic compilation and caching of λJSON programs
 * - Bytecode VM execution for speed
 * - Tail call optimization to prevent stack overflow
 * - Fallback to tree-walker for unsupported operations
 * 
 * @module λJSON-fast
 */

const { Compiler, FunctionTemplate } = require('./λJSON-compiler.js');
const { VM, Closure } = require('./λJSON-vm.js');
const { disassemble } = require('./λJSON-opcodes.js');
const treeWalker = require('./λJSON.js');

/**
 * Cache for compiled programs
 * @type {Map<string, {code: Array, constants: Array}>}
 */
const compilationCache = new Map();

/**
 * Maximum cache size before eviction
 */
const MAX_CACHE_SIZE = 1000;

/**
 * Options for the fast evaluator
 */
const defaultFastOptions = {
  useCompiler: true,        // Use bytecode compiler when possible
  cacheCompiled: true,      // Cache compiled bytecode
  fallbackToTreeWalker: true, // Fall back to tree-walker on compile errors
  maxRecursionDepth: 10000, // Higher limit with TCO
  maxExecutionTime: 5000,   // ms
  traceExecution: false,    // Debug: trace bytecode execution
  traceCompilation: false   // Debug: show compiled bytecode
};

/**
 * Shared compiler instance
 */
const sharedCompiler = new Compiler();

/**
 * Create a cache key for an expression
 * @param {*} exp - Expression
 * @returns {string} Cache key
 */
function makeCacheKey(exp) {
  return JSON.stringify(exp);
}

/**
 * Evict old entries from cache if over limit
 */
function evictCacheIfNeeded() {
  if (compilationCache.size > MAX_CACHE_SIZE) {
    // Remove first 20% of entries (FIFO eviction)
    const toRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
    const keys = compilationCache.keys();
    for (let i = 0; i < toRemove; i++) {
      const key = keys.next().value;
      if (key) compilationCache.delete(key);
    }
  }
}

/**
 * Compile an expression (with caching)
 * @param {*} exp - λJSON expression
 * @param {Object} options - Options
 * @returns {{code: Array, constants: Array}|null} Compiled bytecode or null on failure
 */
function compileExpression(exp, options = {}) {
  const opts = { ...defaultFastOptions, ...options };
  const cacheKey = makeCacheKey(exp);
  
  // Check cache
  if (opts.cacheCompiled && compilationCache.has(cacheKey)) {
    return compilationCache.get(cacheKey);
  }
  
  try {
    const compiled = sharedCompiler.compileProgram(exp);
    
    if (opts.traceCompilation) {
      console.log('=== Compiled Bytecode ===');
      console.log(disassemble(compiled.code, compiled.constants));
      console.log('=========================');
    }
    
    // Cache result
    if (opts.cacheCompiled) {
      evictCacheIfNeeded();
      compilationCache.set(cacheKey, compiled);
    }
    
    return compiled;
  } catch (err) {
    if (opts.traceCompilation) {
      console.warn('Compilation failed:', err.message);
    }
    return null;
  }
}

/**
 * Evaluate a λJSON expression using the bytecode VM
 * @param {*} exp - Expression to evaluate
 * @param {Object} env - Environment (for compatibility, merged into VM globals)
 * @param {Object} options - Evaluation options
 * @returns {*} Result of evaluation
 */
function evaluateFast(exp, env = {}, options = {}) {
  const opts = { ...defaultFastOptions, ...options };
  
  // Try bytecode compilation
  if (opts.useCompiler) {
    const compiled = compileExpression(exp, opts);
    
    if (compiled) {
      const vm = new VM({
        maxCallDepth: opts.maxRecursionDepth,
        maxExecutionTime: opts.maxExecutionTime,
        traceExecution: opts.traceExecution
      });
      
      // Merge env into VM globals
      if (env && typeof env === 'object') {
        for (const [key, value] of Object.entries(env)) {
          vm.globals.set(key, value);
        }
      }
      
      try {
        return vm.run(compiled);
      } catch (err) {
        if (opts.fallbackToTreeWalker) {
          // Fall back to tree-walker on VM errors
          return treeWalker.evaluate(exp, env, {
            maxRecursionDepth: opts.maxRecursionDepth,
            maxExecutionTime: opts.maxExecutionTime
          });
        }
        throw err;
      }
    }
  }
  
  // Fall back to tree-walker
  if (opts.fallbackToTreeWalker) {
    return treeWalker.evaluate(exp, env, {
      maxRecursionDepth: opts.maxRecursionDepth,
      maxExecutionTime: opts.maxExecutionTime
    });
  }
  
  throw new Error('Compilation failed and fallback disabled');
}

/**
 * Create a reusable compiled function
 * @param {*} lambdaExp - Lambda expression to compile
 * @param {Object} options - Options
 * @returns {Function} Compiled function
 */
function compileLambda(lambdaExp, options = {}) {
  const opts = { ...defaultFastOptions, ...options };
  
  // Validate it's a lambda
  if (!Array.isArray(lambdaExp) || 
      (lambdaExp[0] !== 'lambda' && lambdaExp[0] !== 'λ')) {
    throw new Error('Expected a lambda expression');
  }
  
  const [, params, body] = lambdaExp;
  
  // Create wrapper that evaluates body with params bound
  return (...args) => {
    const callExp = [lambdaExp, ...args];
    return evaluateFast(callExp, {}, opts);
  };
}

/**
 * Clear the compilation cache
 */
function clearCache() {
  compilationCache.clear();
}

/**
 * Get cache statistics
 * @returns {{size: number, maxSize: number}}
 */
function getCacheStats() {
  return {
    size: compilationCache.size,
    maxSize: MAX_CACHE_SIZE
  };
}

/**
 * Benchmark an expression
 * @param {*} exp - Expression to benchmark
 * @param {number} iterations - Number of iterations
 * @param {Object} options - Options
 * @returns {{fastTime: number, treeTime: number, speedup: number}}
 */
function benchmark(exp, iterations = 100, options = {}) {
  const env = {};
  
  // Warm up
  evaluateFast(exp, env, { ...options, useCompiler: true });
  treeWalker.evaluate(exp, env);
  
  // Benchmark fast path
  const fastStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    evaluateFast(exp, env, { ...options, useCompiler: true });
  }
  const fastTime = Date.now() - fastStart;
  
  // Benchmark tree-walker
  const treeStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    treeWalker.evaluate(exp, env);
  }
  const treeTime = Date.now() - treeStart;
  
  return {
    fastTime,
    treeTime,
    speedup: treeTime / Math.max(fastTime, 1)
  };
}

module.exports = {
  // Main API
  evaluate: evaluateFast,
  evaluateFast,
  compileLambda,
  compileExpression,
  
  // Cache management
  clearCache,
  getCacheStats,
  
  // Options
  defaultFastOptions,
  
  // Utilities
  benchmark,
  disassemble,
  
  // Re-export components for advanced usage
  Compiler,
  VM,
  FunctionTemplate,
  Closure,
  
  // Re-export tree-walker for comparison
  treeWalker
};

