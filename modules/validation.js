/**
 * Validation Module - Dividend Discount Calculator
 * Simplified for use without tooltip system
 */

/**
 * Validation rules for each input field
 */
const validationRules = {
  D0: {
    min: 0.01,
    max: 1000,
    label: 'Current Dividend',
    errorMessage: 'Current dividend must be between $0.01 and $1,000',
    formatValue: (val) => `$${val.toFixed(2)}`
  },
  required: {
    min: 0.1,
    max: 50,
    label: 'Required Return',
    errorMessage: 'Required return must be between 0.1% and 50%',
    formatValue: (val) => `${val}%`
  },
  gConst: {
    min: -10,
    max: 30,
    label: 'Constant Growth Rate',
    errorMessage: 'Constant growth rate must be between -10% and 30%',
    formatValue: (val) => `${val}%`,
    customValidation: (value, allInputs) => {
      if (allInputs.required && value >= allInputs.required) {
        return 'Growth rate must be less than required return';
      }
      return null;
    }
  },
  gShort: {
    min: -10,
    max: 50,
    label: 'Short-term Growth Rate',
    errorMessage: 'Short-term growth rate must be between -10% and 50%',
    formatValue: (val) => `${val}%`
  },
  gLong: {
    min: -10,
    max: 30,
    label: 'Long-term Growth Rate',
    errorMessage: 'Long-term growth rate must be between -10% and 30%',
    formatValue: (val) => `${val}%`,
    customValidation: (value, allInputs) => {
      if (allInputs.required && value >= allInputs.required) {
        return 'Long-term growth must be less than required return';
      }
      return null;
    }
  },
  shortYears: {
    min: 1,
    max: 10,
    label: 'High Growth Period',
    errorMessage: 'High growth period must be between 1 and 10 years',
    formatValue: (val) => `${val} years`
  }
};

/**
 * Validate a single field
 * @param {string} field - Field name
 * @param {number} value - Field value
 * @param {Object} allInputs - All current input values (for cross-field validation)
 * @returns {string|null} Error message or null if valid
 */
export function validateField(field, value, allInputs = {}) {
  const rules = validationRules[field];
  
  if (!rules) {
    return null;
  }
  
  // Check if value is a number
  if (isNaN(value) || value === '') {
    return `${rules.label} is required`;
  }
  
  // Check min/max bounds
  if (value < rules.min || value > rules.max) {
    return rules.errorMessage;
  }
  
  // Custom validation
  if (rules.customValidation) {
    const customError = rules.customValidation(value, allInputs);
    if (customError) {
      return customError;
    }
  }
  
  return null;
}

/**
 * Validate all input fields
 * @param {Object} inputs - Object with all input values
 * @returns {Object} Object with field names as keys and error messages as values
 */
export function validateAllInputs(inputs) {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const error = validateField(field, inputs[field], inputs);
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
}

/**
 * Check if there are any validation errors
 * @param {Object} errors - Errors object
 * @returns {boolean} True if there are errors
 */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

/**
 * Update input field UI to show/hide error state
 * Also updates aria-describedby to link error message
 * @param {string} fieldId - Input field ID
 * @param {string|null} errorMessage - Error message or null
 */
export function updateFieldError(fieldId, errorMessage) {
  const input = document.getElementById(fieldId);
  
  if (!input) {
    return;
  }
  
  if (errorMessage) {
    // Show error in input
    input.setAttribute('aria-invalid', 'true');
    input.classList.add('error');
    
    // Create or update error element
    let errorEl = document.getElementById(`${fieldId}-error`);
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.id = `${fieldId}-error`;
      errorEl.className = 'input-error-message';
      errorEl.setAttribute('role', 'alert');
      
      // Insert after the input's parent wrapper
      const wrapper = input.closest('.input-wrapper');
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.insertBefore(errorEl, wrapper.nextSibling);
      }
    }
    errorEl.textContent = errorMessage;
    
    // Link error to input via aria-describedby
    const helpId = `${fieldId}-help`;
    const errorId = `${fieldId}-error`;
    const describedby = [helpId, errorId].join(' ');
    input.setAttribute('aria-describedby', describedby);
    
    // Announce error for screen readers
    announceError(fieldId, errorMessage);
  } else {
    // Clear error
    input.setAttribute('aria-invalid', 'false');
    input.classList.remove('error');
    
    // Remove error element
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
      errorEl.remove();
    }
    
    // Restore aria-describedby to just help text
    const helpId = `${fieldId}-help`;
    input.setAttribute('aria-describedby', helpId);
  }
}

/**
 * Announce validation error to screen readers
 * @param {string} fieldId - Input field ID
 * @param {string} errorMessage - Error message
 */
function announceError(fieldId, errorMessage) {
  let liveRegion = document.getElementById('validation-live-region');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'validation-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }
  
  const rules = validationRules[fieldId];
  const label = rules ? rules.label : fieldId;
  
  // Announce error with context
  liveRegion.textContent = `${label}: ${errorMessage}`;
  
  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 1000);
}

/**
 * Update validation summary section
 * @param {Object} errors - Errors object
 */
export function updateValidationSummary(errors) {
  const summary = document.getElementById('validation-summary');
  const list = document.getElementById('validation-list');
  
  if (!summary || !list) {
    return;
  }
  
  if (hasErrors(errors)) {
    // Show validation summary
    list.innerHTML = '';
    Object.entries(errors).forEach(([field, error]) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${field}`;
      link.textContent = error;
      link.onclick = (e) => {
        e.preventDefault();
        document.getElementById(field)?.focus();
      };
      li.appendChild(link);
      list.appendChild(li);
    });
    summary.style.display = 'block';
    
    // Announce summary for screen readers
    announceSummary(errors);
  } else {
    // Hide validation summary
    summary.style.display = 'none';
    list.innerHTML = '';
  }
}

/**
 * Announce validation summary to screen readers
 * @param {Object} errors - Errors object
 */
function announceSummary(errors) {
  let liveRegion = document.getElementById('summary-live-region');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'summary-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }
  
  const errorCount = Object.keys(errors).length;
  liveRegion.textContent = `${errorCount} validation ${errorCount === 1 ? 'error' : 'errors'} found. Please review and correct.`;
  
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 2000);
}

/**
 * Get validation rule for a field
 * @param {string} field - Field name
 * @returns {Object|null} Validation rule or null
 */
export function getValidationRule(field) {
  return validationRules[field] || null;
}