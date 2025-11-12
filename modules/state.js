/**
 * Simple Observable State - For dividend discount calculator
 */

export const state = {
  // Input values
  inputs: {
    D0: 5,                    // Current dividend
    required: 10,             // Required return (percentage)
    gConst: 5,                // Constant growth rate (percentage)
    gShort: 8,                // Short-term growth rate (percentage)
    gLong: 3,                 // Long-term growth rate (percentage)
    shortYears: 5             // Years of high growth
  },
  
  // Model selection
  selectedModel: 'all',       // 'constant' | 'growth' | 'changing' | 'all'
  
  // UI state
  view: 'chart',              // 'chart' | 'table'
  
  // Calculated values
  calculations: null,         // All three model calculations
  
  // Validation errors
  errors: {},
  
  // Listeners for state changes
  listeners: []
};

export function setState(updates) {
  Object.assign(state, updates);
  state.listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
  state.listeners.push(fn);
}