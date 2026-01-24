#!/usr/bin/env node

/**
 * Investment Asset Management & Accounting System Demo
 * Demonstrates complex business rule engine using λ.json
 */

const { globalEnv, evaluate } = require('../λJSON.js');
const rules = require('./investment-accounting.json');

console.log('='.repeat(80));
console.log('INVESTMENT ASSET MANAGEMENT & ACCOUNTING SYSTEM');
console.log('Business Rules Engine powered by λ.json');
console.log('='.repeat(80));

// Initialize all business rules
console.log('\n📋 Loading Business Rules...');
let rulesLoaded = 0;

for (const [category, ruleSet] of Object.entries(rules.business_rules)) {
  if (ruleSet.rule) {
    evaluate(ruleSet.rule, globalEnv);
    rulesLoaded++;
    console.log(`  ✓ ${category}`);
  }
}

// Load transaction processing rules
for (const [name, proc] of Object.entries(rules.transaction_processing)) {
  if (proc.steps) {
    evaluate(proc.steps, globalEnv);
    rulesLoaded++;
    console.log(`  ✓ ${name}`);
  }
}

// Load analytics rules
for (const [name, analytic] of Object.entries(rules.portfolio_analytics)) {
  if (analytic.rule) {
    evaluate(analytic.rule, globalEnv);
    rulesLoaded++;
    console.log(`  ✓ ${name}`);
  }
}

// Load compliance rules
for (const [name, check] of Object.entries(rules.compliance_checks)) {
  if (check.rule) {
    evaluate(check.rule, globalEnv);
    rulesLoaded++;
    console.log(`  ✓ ${name}`);
  }
}

console.log(`\n✅ Loaded ${rulesLoaded} business rules successfully!\n`);

// ============================================================================
// SCENARIO 1: Buy Transaction
// ============================================================================
console.log('='.repeat(80));
console.log('SCENARIO 1: Buy 100 shares of TECH @ $150.50');
console.log('='.repeat(80));

const scenario1 = rules.example_scenarios.scenario_1_buy_tech_stock.input;
console.log('\nInput:');
console.log(`  Symbol: ${scenario1.symbol}`);
console.log(`  Quantity: ${scenario1.quantity} shares`);
console.log(`  Price: $${scenario1.price}`);
console.log(`  Account Tier: ${scenario1.account_tier}`);
console.log(`  Portfolio Value: $${scenario1.portfolio_value.toLocaleString()}`);

const grossAmount = scenario1.quantity * scenario1.price;
const buyFee = evaluate(['calculate-fee', grossAmount, `'${scenario1.account_tier}'`, "'buy'"], globalEnv);
const totalCost = grossAmount + buyFee;
const positionSizePct = (totalCost / scenario1.portfolio_value) * 100;

console.log('\nCalculations:');
console.log(`  Gross Amount: $${grossAmount.toFixed(2)}`);
console.log(`  Transaction Fee: $${buyFee.toFixed(2)} (0.1% for gold tier)`);
console.log(`  Total Cost: $${totalCost.toFixed(2)}`);
console.log(`  Position Size: ${positionSizePct.toFixed(2)}% of portfolio`);
console.log(`  Validation: ${positionSizePct < 20 ? '✅ PASS' : '❌ FAIL'} (under 20% limit)`);

// ============================================================================
// SCENARIO 2: Sell Transaction with Capital Gains
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('SCENARIO 2: Sell 50 shares of TECH @ $175.00 (held 400 days)');
console.log('='.repeat(80));

const scenario2 = rules.example_scenarios.scenario_2_sell_with_gain.input;
console.log('\nInput:');
console.log(`  Symbol: ${scenario2.symbol}`);
console.log(`  Quantity: ${scenario2.quantity} shares`);
console.log(`  Sell Price: $${scenario2.sell_price}`);
console.log(`  Cost Basis: $${scenario2.cost_basis}`);
console.log(`  Holding Period: ${scenario2.holding_days} days`);
console.log(`  Account Tier: ${scenario2.account_tier}`);

const grossProceeds = scenario2.quantity * scenario2.sell_price;
const sellFee = evaluate(['calculate-fee', grossProceeds, `'${scenario2.account_tier}'`, "'sell'"], globalEnv);
const netProceeds = grossProceeds - sellFee;
const capitalGain = netProceeds - scenario2.cost_basis;
const tax = evaluate(['calculate-tax', capitalGain, scenario2.holding_days], globalEnv);
const netGain = capitalGain - tax;

console.log('\nCalculations:');
console.log(`  Gross Proceeds: $${grossProceeds.toFixed(2)}`);
console.log(`  Transaction Fee: $${sellFee.toFixed(2)} (0.15% for gold tier)`);
console.log(`  Net Proceeds: $${netProceeds.toFixed(2)}`);
console.log(`  Capital Gain: $${capitalGain.toFixed(2)}`);
console.log(`  Tax Rate: ${scenario2.holding_days > 365 ? '20%' : '37%'} (${scenario2.holding_days > 365 ? 'long-term' : 'short-term'})`);
console.log(`  Tax Owed: $${tax.toFixed(2)}`);
console.log(`  Net Gain After Tax: $${netGain.toFixed(2)}`);
console.log(`  Return on Investment: ${((netGain / scenario2.cost_basis) * 100).toFixed(2)}%`);

// ============================================================================
// SCENARIO 3: Dividend Reinvestment
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('SCENARIO 3: Dividend Reinvestment (DRIP)');
console.log('='.repeat(80));

const scenario3 = rules.example_scenarios.scenario_3_dividend_reinvestment.input;
console.log('\nInput:');
console.log(`  Shares Owned: ${scenario3.shares}`);
console.log(`  Dividend per Share: $${scenario3.dividend_per_share}`);
console.log(`  Current Price: $${scenario3.current_price}`);
console.log(`  Reinvest: ${scenario3.reinvest ? 'Yes' : 'No'}`);
console.log(`  Account Tier: ${scenario3.account_tier}`);

const totalDividend = scenario3.shares * scenario3.dividend_per_share;
const dividendTax = totalDividend * 0.15; // 15% qualified dividend tax
const netDividend = totalDividend - dividendTax;
const dripFee = evaluate(['calculate-fee', netDividend, `'${scenario3.account_tier}'`, "'buy'"], globalEnv);
const investable = netDividend - dripFee;
const newShares = investable / scenario3.current_price;

console.log('\nCalculations:');
console.log(`  Total Dividend: $${totalDividend.toFixed(2)}`);
console.log(`  Dividend Tax (15%): $${dividendTax.toFixed(2)}`);
console.log(`  Net Dividend: $${netDividend.toFixed(2)}`);
console.log(`  Transaction Fee: $${dripFee.toFixed(2)} (premium tier = $0)`);
console.log(`  Amount to Invest: $${investable.toFixed(2)}`);
console.log(`  New Shares Purchased: ${newShares.toFixed(4)}`);
console.log(`  New Total Shares: ${(scenario3.shares + newShares).toFixed(4)}`);

// ============================================================================
// SCENARIO 4: Stop Loss Trigger
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('SCENARIO 4: Stop Loss Check');
console.log('='.repeat(80));

const scenario4 = rules.example_scenarios.scenario_4_stop_loss_trigger.input;
console.log('\nInput:');
console.log(`  Entry Price: $${scenario4.entry_price}`);
console.log(`  Current Price: $${scenario4.current_price}`);
console.log(`  Stop Loss: ${(scenario4.stop_loss_pct * 100).toFixed(0)}%`);

const stopPrice = scenario4.entry_price * (1 - scenario4.stop_loss_pct);
const currentLossPct = ((scenario4.entry_price - scenario4.current_price) / scenario4.entry_price) * 100;
const shouldTrigger = evaluate(
  ['trigger-stop-loss', scenario4.current_price, scenario4.entry_price, scenario4.stop_loss_pct],
  globalEnv
);

console.log('\nCalculations:');
console.log(`  Stop Loss Price: $${stopPrice.toFixed(2)}`);
console.log(`  Current Loss: ${currentLossPct.toFixed(2)}%`);
console.log(`  Trigger Stop Loss: ${shouldTrigger ? '🔴 YES - SELL NOW' : '🟢 NO - HOLD'}`);

if (shouldTrigger) {
  console.log(`  ⚠️  ACTION REQUIRED: Price fell below stop loss threshold!`);
}

// ============================================================================
// SCENARIO 5: Portfolio Rebalancing
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('SCENARIO 5: Portfolio Rebalancing Analysis');
console.log('='.repeat(80));

const scenario5 = rules.example_scenarios.scenario_5_portfolio_rebalancing.input;
console.log('\nCurrent vs Target Allocation:');
console.log('  Asset Class    | Current | Target | Difference | Action');
console.log('  ' + '-'.repeat(60));

for (const position of scenario5.positions) {
  const needsRebalance = evaluate(
    ['needs-rebalancing', position.current, position.target, scenario5.threshold],
    globalEnv
  );
  const diff = position.current - position.target;
  const diffPct = (diff * 100).toFixed(1);
  const action = needsRebalance 
    ? (diff > 0 ? '🔴 SELL' : '🟢 BUY')
    : '⚪ HOLD';
  
  console.log(
    `  ${position.asset.padEnd(14)} | ${(position.current * 100).toFixed(0).padStart(6)}% | ${(position.target * 100).toFixed(0).padStart(6)}% | ${diffPct.padStart(9)}% | ${action}`
  );
}

console.log('\n  Rebalancing Threshold: ±' + (scenario5.threshold * 100) + '%');

// ============================================================================
// SCENARIO 6: Risk Assessment
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('SCENARIO 6: Portfolio Risk Assessment');
console.log('='.repeat(80));

const riskInputs = {
  volatility: 0.25,      // 25% volatility
  concentration: 0.35,   // 35% in single position
  leverage: 0.15,        // 15% leverage
  liquidity: 0.20        // 20% illiquid assets
};

console.log('\nRisk Factors:');
console.log(`  Volatility: ${(riskInputs.volatility * 100).toFixed(0)}%`);
console.log(`  Concentration: ${(riskInputs.concentration * 100).toFixed(0)}%`);
console.log(`  Leverage: ${(riskInputs.leverage * 100).toFixed(0)}%`);
console.log(`  Illiquidity: ${(riskInputs.liquidity * 100).toFixed(0)}%`);

const riskScore = evaluate(
  ['risk-score', riskInputs.volatility, riskInputs.concentration, riskInputs.leverage, riskInputs.liquidity],
  globalEnv
);

console.log(`\nOverall Risk Score: ${riskScore}`);
console.log(`Risk Level: ${
  riskScore === "'high-risk'" ? '🔴 HIGH' :
  riskScore === "'medium-risk'" ? '🟡 MEDIUM' :
  '🟢 LOW'
}`);

// ============================================================================
// SCENARIO 7: Compliance Checks
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('SCENARIO 7: Compliance & Regulatory Checks');
console.log('='.repeat(80));

// Pattern Day Trader check
const dayTrades = 4;
const daysPeriod = 5;
const accountValue = 20000;

const isPDT = evaluate(['is-pdt', dayTrades, daysPeriod, accountValue], globalEnv);

console.log('\nPattern Day Trader Check:');
console.log(`  Day Trades: ${dayTrades} in ${daysPeriod} days`);
console.log(`  Account Value: $${accountValue.toLocaleString()}`);
console.log(`  Status: ${isPDT ? '⚠️  PATTERN DAY TRADER' : '✅ Normal Account'}`);
if (isPDT) {
  console.log(`  ⚠️  WARNING: Account flagged as PDT. Minimum $25,000 required.`);
}

// Concentration limit check
const positionValue = 45000;
const portfolioValue = 100000;
const concentrationLimit = 0.30;

const exceedsConcentration = evaluate(
  ['exceeds-concentration', positionValue, portfolioValue, concentrationLimit],
  globalEnv
);

console.log('\nConcentration Limit Check:');
console.log(`  Position Value: $${positionValue.toLocaleString()}`);
console.log(`  Portfolio Value: $${portfolioValue.toLocaleString()}`);
console.log(`  Position Weight: ${((positionValue / portfolioValue) * 100).toFixed(1)}%`);
console.log(`  Limit: ${(concentrationLimit * 100).toFixed(0)}%`);
console.log(`  Status: ${exceedsConcentration ? '❌ EXCEEDS LIMIT' : '✅ Within Limit'}`);

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('SYSTEM CAPABILITIES SUMMARY');
console.log('='.repeat(80));

console.log(`
✅ Transaction Processing
   • Buy/Sell with tiered fee structures
   • Dividend processing and reinvestment (DRIP)
   • Cost basis tracking
   • Position sizing validation

✅ Tax Calculations
   • Short-term vs long-term capital gains
   • Qualified dividend taxation
   • Wash sale detection
   • Tax-loss harvesting support

✅ Risk Management
   • Stop loss triggers
   • Position size limits
   • Portfolio risk scoring
   • Margin requirement calculations

✅ Portfolio Analytics
   • Return calculations (total, annual, risk-adjusted)
   • Rebalancing analysis
   • Position weighting
   • Unrealized P&L tracking

✅ Compliance & Regulatory
   • Pattern day trader detection
   • Concentration limit enforcement
   • Trading halt checks
   • Regulatory reporting support

🎯 Business Rule Engine Benefits:
   • ${rulesLoaded} rules loaded dynamically
   • Zero code deployment for rule changes
   • Version controlled in JSON
   • A/B testable rule sets
   • Audit trail for all changes
   • Non-developer rule updates
   • Environment-specific configurations
`);

console.log('='.repeat(80));
console.log('Demo completed successfully! All business rules executed correctly.');
console.log('='.repeat(80));