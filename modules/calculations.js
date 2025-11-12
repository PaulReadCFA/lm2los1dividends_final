/**
 * Dividend Discount Model Calculations Module
 * Pure functions for equity valuation mathematics
 */

const HORIZON_YEARS = 10; // Display 10 years of dividends

/**
 * Calculate constant dividend model (no growth)
 * Formula: P = D₀ / r
 * @param {Object} params - Input parameters
 * @returns {Object} Price and cash flows
 */
function calculateConstantModel({ D0, required }) {
  // Validate
  if (required <= 0) {
    return { price: NaN, cashFlows: [] };
  }
  
  const price = D0 / required;
  const cashFlows = [];
  
  // Year 0: Initial investment (negative)
  cashFlows.push({
    year: 0,
    yearLabel: '0',
    dividend: -price
  });
  
  // Years 1-10: Constant dividends
  for (let year = 1; year <= HORIZON_YEARS; year++) {
    cashFlows.push({
      year,
      yearLabel: year.toString(),
      dividend: D0
    });
  }
  
  return { price, cashFlows };
}

/**
 * Calculate constant growth model (Gordon Growth Model)
 * Formula: P = D₁ / (r - g) = D₀(1 + g) / (r - g)
 * @param {Object} params - Input parameters
 * @returns {Object} Price and cash flows
 */
function calculateGrowthModel({ D0, required, gConst }) {
  // Validate: growth rate must be less than required return
  if (gConst >= required || required <= 0) {
    return { price: NaN, cashFlows: [] };
  }
  
  const D1 = D0 * (1 + gConst);
  const price = D1 / (required - gConst);
  const cashFlows = [];
  
  // Year 0: Initial investment (negative)
  cashFlows.push({
    year: 0,
    yearLabel: '0',
    dividend: -price
  });
  
  // Years 1-10: Growing dividends
  for (let year = 1; year <= HORIZON_YEARS; year++) {
    const dividend = D0 * Math.pow(1 + gConst, year);
    cashFlows.push({
      year,
      yearLabel: year.toString(),
      dividend
    });
  }
  
  return { price, cashFlows };
}

/**
 * Calculate changing growth model (Two-Stage Model)
 * High growth for n years, then sustainable growth forever
 * @param {Object} params - Input parameters
 * @returns {Object} Price and cash flows
 */
function calculateChangingModel({ D0, required, gShort, gLong, shortYears }) {
  // Validate: long-term growth must be less than required return
  if (gLong >= required || required <= 0 || gShort < 0 || gLong < 0) {
    return { price: NaN, cashFlows: [] };
  }
  
  // Step 1: Calculate PV of high growth dividends
  let pvHighGrowth = 0;
  for (let t = 1; t <= shortYears; t++) {
    const dividend = D0 * Math.pow(1 + gShort, t);
    pvHighGrowth += dividend / Math.pow(1 + required, t);
  }
  
  // Step 2: Calculate terminal value using Gordon Growth Model
  const terminalDividend = D0 * Math.pow(1 + gShort, shortYears) * (1 + gLong);
  const terminalValue = terminalDividend / (required - gLong);
  
  // Step 3: Discount terminal value to present
  const pvTerminalValue = terminalValue / Math.pow(1 + required, shortYears);
  
  // Total price
  const price = pvHighGrowth + pvTerminalValue;
  
  // Generate cash flows
  const cashFlows = [];
  
  // Year 0: Initial investment (negative)
  cashFlows.push({
    year: 0,
    yearLabel: '0',
    dividend: -price
  });
  
  // Years 1-10: High growth then sustainable growth
  for (let year = 1; year <= HORIZON_YEARS; year++) {
    let dividend;
    if (year <= shortYears) {
      // High growth period
      dividend = D0 * Math.pow(1 + gShort, year);
    } else {
      // Sustainable growth period
      dividend = D0 * Math.pow(1 + gShort, shortYears) * Math.pow(1 + gLong, year - shortYears);
    }
    
    cashFlows.push({
      year,
      yearLabel: year.toString(),
      dividend
    });
  }
  
  return { price, cashFlows };
}

/**
 * Calculate all three models
 * @param {Object} params - All input parameters
 * @returns {Object} All three model results
 */
export function calculateAllModels(params) {
  const { D0, required, gConst, gShort, gLong, shortYears } = params;
  
  const constant = calculateConstantModel({ D0, required });
  const growth = calculateGrowthModel({ D0, required, gConst });
  const changing = calculateChangingModel({ D0, required, gShort, gLong, shortYears });
  
  return {
    constant,
    growth,
    changing
  };
}

/**
 * Get model metadata
 * @param {string} modelKey - Model identifier
 * @returns {Object} Model metadata
 */
export function getModelMetadata(modelKey) {
  const metadata = {
    constant: {
      name: 'Constant Dividend Model',
      color: '#2563eb',
      description: 'Assumes dividends remain constant forever',
      formula: 'P = D₀ ÷ r'
    },
    growth: {
      name: 'Constant Growth Model',
      color: '#16a34a',
      description: 'Assumes constant dividend growth rate forever',
      formula: 'P = D₁ ÷ (r - g)'
    },
    changing: {
      name: 'Changing Growth Model',
      color: '#9333ea',
      description: 'High growth initially, then sustainable growth forever',
      formula: 'P = PV(high growth) + PV(terminal)'
    }
  };
  
  return metadata[modelKey] || null;
}