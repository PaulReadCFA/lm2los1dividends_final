/**
 * calculations.js Dividend Discount Model Calculations
 * All functions are pure and exported for calculator.js
 */

const HORIZON_YEARS = 10;

/**
 * Constant Dividend Model (no growth)
 */
function calculateConstantModel({ D0, required }) {
  if (required <= 0) return { price: NaN, cashFlows: [] };
  const price = D0 / required;
  const cashFlows = [{ year: 0, yearLabel: '0', dividend: -price }];
  for (let y = 1; y <= HORIZON_YEARS; y++) {
    cashFlows.push({ year: y, yearLabel: y.toString(), dividend: D0 });
  }
  return { price, cashFlows };
}

/**
 * Constant Growth Model (Gordon)
 */
function calculateGrowthModel({ D0, required, gConst }) {
  if (gConst >= required || required <= 0) return { price: NaN, cashFlows: [] };
  const D1 = D0 * (1 + gConst);
  const price = D1 / (required - gConst);
  const cashFlows = [{ year: 0, yearLabel: '0', dividend: -price }];
  for (let y = 1; y <= HORIZON_YEARS; y++) {
    cashFlows.push({
      year: y,
      yearLabel: y.toString(),
      dividend: D0 * Math.pow(1 + gConst, y)
    });
  }
  return { price, cashFlows };
}

/**
 * Two-Stage (Changing) Growth Model
 */
function calculateChangingModel({ D0, required, gShort, gLong, shortYears }) {
  if (gLong >= required || required <= 0 || gShort < 0 || gLong < 0) {
    return { price: NaN, cashFlows: [] };
  }

  // PV of high-growth dividends
  let pvHighGrowth = 0;
  for (let t = 1; t <= shortYears; t++) {
    const div = D0 * Math.pow(1 + gShort, t);
    pvHighGrowth += div / Math.pow(1 + required, t);
  }

  // Terminal value
  const terminalDiv = D0 * Math.pow(1 + gShort, shortYears) * (1 + gLong);
  const terminal = terminalDiv / (required - gLong);
  const pvTerminal = terminal / Math.pow(1 + required, shortYears);

  const price = pvHighGrowth + pvTerminal;

  // Cash flows
  const cashFlows = [{ year: 0, yearLabel: '0', dividend: -price }];
  for (let y = 1; y <= HORIZON_YEARS; y++) {
    const div = y <= shortYears
      ? D0 * Math.pow(1 + gShort, y)
      : D0 * Math.pow(1 + gShort, shortYears) * Math.pow(1 + gLong, y - shortYears);
    cashFlows.push({ year: y, yearLabel: y.toString(), dividend: div });
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
  return {
    constant: calculateConstantModel({ D0, required }),
    growth: calculateGrowthModel({ D0, required, gConst }),
    changing: calculateChangingModel({ D0, required, gShort, gLong, shortYears })
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
      color: '#3c6ae5',
      description: 'Assumes dividends remain constant forever',
      formula: 'P = D₀ ÷ r'
    },
    growth: {
      name: 'Constant Growth Model',
      color: '#15803d',
      description: 'Assumes constant dividend growth rate forever',
      formula: 'P = D₁ ÷ (r − g)'
    },
    changing: {
      name: 'Changing Growth Model',
      color: '#7a46ff',
      description: 'High growth initially, then sustainable growth forever',
      formula: 'P = PV(high growth) + PV(terminal)'
    }
  };
  return metadata[modelKey] || null;
}