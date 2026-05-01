const { evaluate, globalEnv } = require('./λJSON.js');
const fs = require('fs');
const path = require('path');

// Check for TOON support
let toonModule = null;
try {
  toonModule = require('./λJSON-toon.js');
} catch (e) {
  // TOON module not available - will use JSON only
}

// Parse command line arguments
const args = process.argv.slice(2);
const hasRepl = args.includes('-repl');
const hasFile = args.includes('-f') || args.includes('-file');
const hasToonOutput = args.includes('--toon') || args.includes('-t');
const hasJsonOutput = args.includes('--json') || args.includes('-j');
const hasCompare = args.includes('--compare') || args.includes('-c');
const hasHelp = args.includes('-h') || args.includes('--help');

// Help message
if (hasHelp) {
  console.log(`
λJSON CLI - Lambda JSON Interpreter with TOON Support

Usage:
  node cli.js -repl                  Start interactive REPL
  node cli.js -f <file>              Process a file (JSON or TOON)
  node cli.js -f <file> --toon       Output result in TOON format
  node cli.js -f <file> --json       Output result in JSON format (default)
  node cli.js -f <file> --compare    Compare JSON vs TOON token efficiency

Options:
  -repl              Start the interactive Read-Eval-Print Loop
  -f, -file          Process file(s) - supports .json and .toon files
  -t, --toon         Output results in TOON format
  -j, --json         Output results in JSON format (default)
  -c, --compare      Show token comparison between JSON and TOON
  -h, --help         Show this help message

Supported File Formats:
  .json              Standard JSON format
  .toon              TOON (Token-Oriented Object Notation)
  
File Structure:
  Files should contain a document with 'data' and 'code' properties:
  {
    "data": [1, 2, 3, 4],
    "code": ["λ", ["nums"], ["+", ["car", "nums"], 1]]
  }

TOON Format:
  TOON is a token-efficient encoding of JSON (~40% fewer tokens).
  Learn more: https://toonformat.dev

Examples:
  node cli.js -repl
  node cli.js -f example.json
  node cli.js -f example.toon --toon
  node cli.js -f example.json --compare

REPL Commands:
  quit, q, exit      Exit the REPL
`);
  process.exit(0);
}

/**
 * Main async function to handle TOON initialization
 */
async function main() {
  // Initialize TOON module if available
  if (toonModule) {
    try {
      await toonModule.initToon();
    } catch (e) {
      console.warn('Warning: TOON initialization failed:', e.message);
      toonModule = null;
    }
  }

  if (hasRepl) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    // Install TOON builtins if available
    if (toonModule) {
      toonModule.installToonBuiltins();
      console.log('λJSON REPL (with TOON support)');
      console.log('Type "quit", "q", or "exit" to exit');
      console.log('TOON functions available: to-toon, from-toon, toon?\n');
    } else {
      console.log('λJSON REPL');
      console.log('Type "quit", "q", or "exit" to exit\n');
    }
    
    // Reader
    readline.setPrompt('λ.json -> ');
    readline.prompt();
    readline
      .on('line', function (λexpression) {
        if (['quit', 'q', 'exit'].includes(λexpression.trim())) {
          readline.close();
          return;
        }
        
        // Handle empty input
        if (!λexpression.trim()) {
          readline.prompt();
          return;
        }
        
        // Evaluator & Printer
        console.log();
        try {
          const result = evaluate(eval(λexpression), globalEnv);
          
          // Format output based on flags
          if (hasToonOutput && toonModule) {
            console.log(toonModule.toToon(result));
          } else {
            console.log(typeof result === 'object' ? JSON.stringify(result, null, 2) : result);
          }
        } catch (e) {
          console.error('Error:', e.message);
        }
        console.log();
        readline.prompt();
        // Loop
      })
      .on('close', function () {
        console.log('\nGoodbye!');
        process.exit(0);
      });
  } else if (hasFile) {
    // Process each file argument
    const files = args.filter(arg => 
      arg.endsWith('.json') || arg.endsWith('.toon')
    );
    
    if (files.length === 0) {
      console.error('Error: No .json or .toon files specified');
      console.error('Usage: node cli.js -f <file.json|file.toon>');
      process.exit(1);
    }
    
    for (const filePath of files) {
      try {
        const text = fs.readFileSync(filePath, 'utf8');
        const ext = path.extname(filePath).toLowerCase();
        const baseName = path.basename(filePath, ext);
        const dirName = path.dirname(filePath);
        
        let doc;
        let inputFormat;
        
        // Parse based on file extension or auto-detect
        if (ext === '.toon') {
          if (!toonModule) {
            console.error(`Error: TOON support not available. Install @toon-format/toon package.`);
            process.exit(1);
          }
          doc = toonModule.parseToon(text);
          inputFormat = 'toon';
        } else if (ext === '.json') {
          doc = JSON.parse(text);
          inputFormat = 'json';
        } else if (toonModule) {
          // Auto-detect format
          inputFormat = toonModule.detectFormat(text);
          doc = toonModule.parseAuto(text);
        } else {
          doc = JSON.parse(text);
          inputFormat = 'json';
        }
        
        // Evaluate the code with data
        let result;
        if (doc.code && doc.data !== undefined) {
          const evalCode = evaluate(doc.code, globalEnv);
          if (typeof evalCode === 'function') {
            result = evalCode(doc.data);
          } else {
            result = evaluate([doc.code, doc.data], globalEnv);
          }
        } else if (doc.code) {
          result = evaluate(doc.code, globalEnv);
        } else {
          result = evaluate(doc, globalEnv);
        }
        
        // Create result document
        const resultDoc = {
          ...doc,
          result
        };
        
        // Show token comparison if requested
        if (hasCompare && toonModule) {
          const comparison = toonModule.compareFormats(resultDoc);
          console.log(`\n=== Token Comparison for ${filePath} ===`);
          console.log(`JSON: ${comparison.json.tokens} tokens (${comparison.json.bytes} bytes)`);
          console.log(`TOON: ${comparison.toon.tokens} tokens (${comparison.toon.bytes} bytes)`);
          console.log(`Savings: ${comparison.savings}%\n`);
        }
        
        // Determine output format
        let outputFormat;
        if (hasToonOutput) {
          outputFormat = 'toon';
        } else if (hasJsonOutput) {
          outputFormat = 'json';
        } else {
          // Default: same as input format
          outputFormat = inputFormat;
        }
        
        // Write result file
        let outputExt, outputContent;
        if (outputFormat === 'toon' && toonModule) {
          outputExt = '.toon';
          outputContent = toonModule.toToon(resultDoc);
        } else {
          outputExt = '.json';
          outputContent = JSON.stringify(resultDoc, null, 2);
        }
        
        const outputPath = path.join(dirName, `result-${baseName}${outputExt}`);
        fs.writeFileSync(outputPath, outputContent);
        
        console.log(`Processed: ${filePath} -> ${outputPath}`);
        
        // Also print result to console
        console.log(`Result: ${typeof result === 'object' ? JSON.stringify(result) : result}`);
        
      } catch (e) {
        console.error(`Error processing ${filePath}:`, e.message);
      }
    }
    
    process.exit(0);
  } else {
    // No arguments - show brief help
    console.log('λJSON CLI - Use -h or --help for usage information');
    console.log('Quick start: node cli.js -repl');
    process.exit(0);
  }
}

// Run main function
main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
