/**
 * calculator.js – Dividend Discount Model Calculator
 * Adapted to simple calculator template structure with full accessibility
 */
import { state, setState, subscribe } from './modules/state.js';
import { calculateAllModels } from './modules/calculations.js';
import { renderResults } from './modules/results.js';
import { renderChart, destroyChart } from './modules/chart.js';
import { renderTable } from './modules/table.js';
import { $, listen, debounce } from './modules/utils.js';
import { validateField, hasErrors, updateFieldError, updateValidationSummary } from './modules/validation.js';

/* ---------- INITIALIZATION ---------- */
function init() {
  setupInputs();
  setupModelSelector();
  setupViewToggle();
  subscribe(updateAll);
  detectNarrowScreen();
  window.addEventListener('resize', debounce(detectNarrowScreen, 200));
  
  // Trigger initial calculation with default values
  updateCalculations();
}

/* ---------- INPUTS ---------- */
function setupInputs() {
  const inputFields = ['D0', 'required', 'gConst', 'gShort', 'gLong', 'shortYears'];
  
  inputFields.forEach(id => {
    const el = $(`#${id}`);
    if (!el) return;
    
    const update = debounce(() => {
      const val = Number(el.value) || 0;
      
      // Validate field
      const error = validateField(id, val, state.inputs);
      updateFieldError(id, error);
      
      // Update state
      const errors = { ...state.errors };
      if (error) {
        errors[id] = error;
      } else {
        delete errors[id];
      }
      
      const newInputs = { ...state.inputs, [id]: val };
      setState({ inputs: newInputs, errors });
      
      // Update validation summary
      updateValidationSummary(errors);
      
      // Recalculate if no errors
      if (!hasErrors(errors)) {
        updateCalculations();
      }
    }, 300);
    
    listen(el, 'input', update);
    listen(el, 'change', update);
  });
}

/* ---------- CALCULATIONS ---------- */
function updateCalculations() {
  const { D0, required, gConst, gShort, gLong, shortYears } = state.inputs;
  const { errors } = state;
  
  // Don't calculate if there are validation errors
  if (hasErrors(errors)) {
    setState({ calculations: null });
    return;
  }
  
  try {
    // Calculate all three models (convert percentages to decimals)
    const calculations = calculateAllModels({
      D0,
      required: required / 100,
      gConst: gConst / 100,
      gShort: gShort / 100,
      gLong: gLong / 100,
      shortYears
    });
    
    // Update state with calculations
    setState({ calculations });
    
  } catch (error) {
    console.error('Calculation error:', error);
    setState({ calculations: null });
  }
}

/* ---------- MODEL SELECTOR ---------- */
function setupModelSelector() {
  const modelButtons = [
    { id: 'model-all-btn', model: 'all' },
    { id: 'model-constant-btn', model: 'constant' },
    { id: 'model-growth-btn', model: 'growth' },
    { id: 'model-changing-btn', model: 'changing' }
  ];
  
  modelButtons.forEach(({ id, model }) => {
    const btn = $(`#${id}`);
    if (!btn) return;
    
    listen(btn, 'click', () => selectModel(model));
    
    // Arrow key navigation between model buttons
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const currentIndex = modelButtons.findIndex(b => b.id === id);
        const direction = e.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (currentIndex + direction + modelButtons.length) % modelButtons.length;
        const nextBtn = $(`#${modelButtons[nextIndex].id}`);
        if (nextBtn) {
          nextBtn.focus();
          selectModel(modelButtons[nextIndex].model);
        }
      }
    });
  });
}

function selectModel(model) {
  // Update button states
  const allButtons = document.querySelectorAll('.model-btn');
  allButtons.forEach(btn => {
    const btnModel = btn.getAttribute('data-model');
    if (btnModel === model) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });
  
  // Update state
  setState({ selectedModel: model });
  
  // Announce change
  const modelNames = {
    'all': 'All models',
    'constant': 'Constant dividend model',
    'growth': 'Constant growth model',
    'changing': 'Two-stage model'
  };
  announceToScreenReader(`${modelNames[model]} selected`);
}

/* ---------- VIEW TOGGLE WITH ARROW KEYS ---------- */
function setupViewToggle() {
  const chartBtn = $('#view-chart-btn');
  const tableBtn = $('#view-table-btn');

  updateButtonStates();

  listen(chartBtn, 'click', () => { setState({ view: 'chart' }); updateButtonStates(); });
  listen(tableBtn, 'click', () => { setState({ view: 'table' }); updateButtonStates(); });

  [chartBtn, tableBtn].forEach(btn => {
    btn.tabIndex = 0;
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = btn === chartBtn ? tableBtn : chartBtn;
        next.focus();
        setState({ view: next.id === 'view-chart-btn' ? 'chart' : 'table' });
        updateButtonStates();
      }
    });
  });

  (state.view === 'chart' ? chartBtn : tableBtn).focus();
}

/* ---------- BUTTON STATE ---------- */
function updateButtonStates() {
  const chartBtn = $('#view-chart-btn');
  const tableBtn = $('#view-table-btn');
  const isTable = state.view === 'table' || document.body.classList.contains('force-table');

  chartBtn.classList.toggle('active', !isTable);
  tableBtn.classList.toggle('active', isTable);
  chartBtn.setAttribute('aria-pressed', !isTable);
  tableBtn.setAttribute('aria-pressed', isTable);
  chartBtn.disabled = document.body.classList.contains('force-table');
}

/* ---------- NARROW SCREEN (force table) ---------- */
function detectNarrowScreen() {
  const narrow = window.innerWidth <= 480;
  if (narrow) {
    document.body.classList.add('force-table');
    if (state.view !== 'table') setState({ view: 'table' });
  } else {
    document.body.classList.remove('force-table');
  }
  updateButtonStates();
}

/* ---------- UPDATE ALL ---------- */
function updateAll(s) {
  if (!s.calculations) return;
  
  renderResults(s.calculations, s.selectedModel);
  renderTable(s.calculations, s.selectedModel);

  if (s.view === 'chart' && !document.body.classList.contains('force-table')) {
    $('#chart-container').style.display = 'block';
    $('#table-container').style.display = 'none';
    renderChart(s.calculations, s.selectedModel);
  } else {
    $('#chart-container').style.display = 'none';
    $('#table-container').style.display = 'block';
    destroyChart();
  }
}

/* ---------- SCREEN READER ANNOUNCEMENTS ---------- */
function announceToScreenReader(message) {
  let region = $('#result-announcement');
  if (!region) {
    region = document.createElement('div');
    region.id = 'result-announcement';
    region.className = 'sr-only';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
  }
  
  region.textContent = message;
  setTimeout(() => region.textContent = '', 1000);
}

/* ---------- START ---------- */
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();