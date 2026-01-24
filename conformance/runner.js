#!/usr/bin/env node

/**
 * λJSON Conformance Test Runner
 * 
 * Runs conformance tests from JSON test files against a λJSON implementation.
 * 
 * Usage:
 *   node conformance/runner.js                    # Run all tests
 *   node conformance/runner.js core              # Run only core tests
 *   node conformance/runner.js stdlib/arithmetic # Run specific suite
 */

const fs = require('fs');
const path = require('path');
const { evaluate, globalEnv, resetWarnings, resetExecutionState } = require('../λJSON.js');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

/**
 * Deep equality check for comparing expected and actual values
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (!deepEqual(keysA, keysB)) return false;
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
}

/**
 * Run a single test case
 */
function runTest(test, options = {}) {
  const { verbose } = options;
  
  try {
    resetWarnings();
    resetExecutionState();
    
    const result = evaluate(test.expression, {}, { warnDeprecated: false });
    const passed = deepEqual(result, test.expected);
    
    return {
      name: test.name,
      passed,
      expected: test.expected,
      actual: result,
      error: null
    };
  } catch (error) {
    // Check if this was an expected error
    if (test.error) {
      const errorMatches = error.message.includes(test.error) || 
                          (error.type && error.type === test.error);
      return {
        name: test.name,
        passed: errorMatches,
        expected: `Error: ${test.error}`,
        actual: `Error: ${error.message}`,
        error: errorMatches ? null : error
      };
    }
    
    return {
      name: test.name,
      passed: false,
      expected: test.expected,
      actual: null,
      error
    };
  }
}

/**
 * Run a test suite from a JSON file
 */
function runSuite(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const suite = JSON.parse(content);
  
  console.log(`\n${colors.cyan}${colors.bold}Suite: ${suite.name}${colors.reset}`);
  console.log(`${colors.dim}${suite.description}${colors.reset}\n`);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };
  
  for (const test of suite.tests) {
    const result = runTest(test);
    results.total++;
    results.tests.push(result);
    
    if (result.passed) {
      results.passed++;
      console.log(`  ${colors.green}✓${colors.reset} ${test.name}`);
    } else {
      results.failed++;
      console.log(`  ${colors.red}✗${colors.reset} ${test.name}`);
      console.log(`    ${colors.dim}Expected: ${JSON.stringify(result.expected)}${colors.reset}`);
      console.log(`    ${colors.dim}Actual:   ${JSON.stringify(result.actual)}${colors.reset}`);
      if (result.error) {
        console.log(`    ${colors.red}Error: ${result.error.message}${colors.reset}`);
      }
    }
  }
  
  return results;
}

/**
 * Find all test suite files in a directory
 */
function findSuites(dir) {
  const suites = [];
  
  if (!fs.existsSync(dir)) {
    return suites;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      suites.push(...findSuites(fullPath));
    } else if (entry.name.endsWith('.json')) {
      suites.push(fullPath);
    }
  }
  
  return suites;
}

/**
 * Main runner
 */
function main() {
  const args = process.argv.slice(2);
  const conformanceDir = __dirname;
  
  let suitePaths;
  
  if (args.length > 0) {
    // Run specific suite(s)
    suitePaths = args.map(arg => {
      const fullPath = path.join(conformanceDir, arg);
      if (fs.existsSync(fullPath + '.json')) {
        return [fullPath + '.json'];
      } else if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        return findSuites(fullPath);
      } else {
        console.error(`Suite not found: ${arg}`);
        return [];
      }
    }).flat();
  } else {
    // Run all suites
    suitePaths = findSuites(conformanceDir);
  }
  
  if (suitePaths.length === 0) {
    console.log('No test suites found.');
    process.exit(1);
  }
  
  console.log(`${colors.bold}λJSON Conformance Test Suite${colors.reset}`);
  console.log('='.repeat(40));
  
  const totals = {
    total: 0,
    passed: 0,
    failed: 0,
    suites: 0
  };
  
  for (const suitePath of suitePaths) {
    try {
      const results = runSuite(suitePath);
      totals.total += results.total;
      totals.passed += results.passed;
      totals.failed += results.failed;
      totals.suites++;
    } catch (error) {
      console.error(`${colors.red}Error running suite ${suitePath}: ${error.message}${colors.reset}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(40));
  console.log(`${colors.bold}Summary${colors.reset}`);
  console.log(`  Suites: ${totals.suites}`);
  console.log(`  Tests:  ${totals.total}`);
  console.log(`  ${colors.green}Passed: ${totals.passed}${colors.reset}`);
  
  if (totals.failed > 0) {
    console.log(`  ${colors.red}Failed: ${totals.failed}${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}All tests passed!${colors.reset}`);
    process.exit(0);
  }
}

main();

