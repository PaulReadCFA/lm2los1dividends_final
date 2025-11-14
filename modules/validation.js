/**
 * validation.js – Clean, cross-field aware validation
 * Matches the pattern used in other calculators
 */
import { $ } from './utils.js';

/* ---------- 1. RULES ---------- */
const RULES = {
  D0: {
    min: 0.01,
    max: 1000,
    required: true,
    label: 'Current Dividend',
  },
  required: {
    min: 0.1,
    max: 50,
    required: true,
    label: 'Required Return',
  },
  gConst: {
    min: -10,
    max: 30,
    required: true,
    label: 'Constant Growth',
    custom: (v, all) => (v >= all.required ? 'Growth must be < required return' : null),
  },
  gShort: {
    min: -10,
    max: 50,
    required: true,
    label: 'Short-term Growth',
  },
  gLong: {
    min: -10,
    max: 30,
    required: true,
    label: 'Long-term Growth',
    custom: (v, all) => (v >= all.required ? 'Long-term growth must be < required return' : null),
  },
  shortYears: {
    min: 1,
    max: 10,
    required: true,
    label: 'High Growth Period',
  },
};

/* ---------- 2. SINGLE FIELD ---------- */
export function validateField(field, value, allInputs = {}) {
  const r = RULES[field];
  if (!r) return null;

  if (r.required && (value === '' || value == null || isNaN(value))) {
    return `${r.label} is required`;
  }
  if (r.min !== undefined && value < r.min) return `${r.label} must be ≥ ${r.min}`;
  if (r.max !== undefined && value > r.max) return `${r.label} must be ≤ ${r.max}`;

  if (r.custom) {
    const msg = r.custom(value, allInputs);
    if (msg) return msg;
  }
  return null;
}

/* ---------- 3. ALL FIELDS ---------- */
export function validateAll(inputs) {
  const errors = {};
  for (const f in RULES) {
    const err = validateField(f, inputs[f], inputs);
    if (err) errors[f] = err;
  }
  return errors;
}

/* ---------- 4. UI HELPERS ---------- */
export function updateFieldError(fieldId, msg) {
  const el = $(`#${fieldId}`);
  if (!el) return;
  el.classList.toggle('error', !!msg);
  el.toggleAttribute('aria-invalid', !!msg);
}

/* ---------- 5. SUMMARY ---------- */
let liveRegion = null;
function announceSummary(cnt) {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'validation-live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = `${cnt} validation ${cnt === 1 ? 'error' : 'errors'}.`;
  setTimeout(() => (liveRegion.textContent = ''), 1500);
}

export function updateValidationSummary(errors) {
  const sum = $('#validation-summary');
  const list = $('#validation-list');
  if (!sum || !list) return;

  const cnt = Object.keys(errors).length;
  if (cnt) {
    list.innerHTML = Object.entries(errors)
      .map(
        ([f, m]) =>
          `<li><a href="#${f}" onclick="document.getElementById('${f}').focus();return false;">${m}</a></li>`
      )
      .join('');
    sum.style.display = 'block';
    announceSummary(cnt);
  } else {
    sum.style.display = 'none';
  }
}

/* ---------- 6. HAS ERRORS ---------- */
export function hasErrors(e) {
  return Object.keys(e).length > 0;
}