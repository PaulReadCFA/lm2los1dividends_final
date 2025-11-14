/**
 * calculator.js â€“ Dividend Discount Model Calculator
 */
import { state, setState, subscribe } from './modules/state.js';
import { calculateAllModels } from './modules/calculations.js';
import { renderResults } from './modules/results.js';
import { renderChart, destroyChart } from './modules/chart.js';
import { renderTable } from './modules/table.js';
import { $, listen, debounce } from './modules/utils.js';
import {
  validateAll,
  updateFieldError,
  updateValidationSummary,
  hasErrors,
} from './modules/validation.js';

/* ---------- INITIALIZATION ---------- */
function init() {
  // Check narrow screen FIRST before setting up anything else
  const initialNarrowCheck = window.innerWidth <= 480;
  if (initialNarrowCheck) {
    document.body.classList.add('force-table');
    setState({ view: 'table' });
  }
  
  setupInputs();
  setupModelSelector();
  setupViewToggle();
  subscribe(updateAll);
  updateCalculations();
  
  // Run narrow detection after initial setup
  detectNarrowScreen();
  window.addEventListener('resize', debounce(detectNarrowScreen, 200));

  // Skip to table
  const skipToTableLink = document.getElementById('skip-to-table');
  if (skipToTableLink) {
    skipToTableLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Switch to table view
      switchView('table');
      // Focus the table button so user knows they activated it
      const tableBtn = $('#view-table-btn');
      if (tableBtn) {
        setTimeout(() => {
          tableBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          tableBtn.focus();
        }, 100);
      }
    });
  }
}

function switchView(view) {
  const isForced = document.body.classList.contains('force-table');
  
  // If forced to table, ignore chart requests
  if (isForced && view === 'chart') {
    return;
  }

  // Update state
  setState({ view });
}

/* ---------- INPUTS ---------- */
function setupInputs() {
  const fields = ['D0', 'required', 'gConst', 'gShort', 'gLong', 'shortYears'];

  fields.forEach(id => {
    const el = $(`#${id}`);
    if (!el) return;

    const handler = debounce(() => {
      const raw = el.value.trim();
      const val = raw === '' ? NaN : Number(raw);

      // Always update inputs with current (possibly invalid) value
      const candidate = { ...state.inputs, [id]: val };

      // Run full validation
      const errors = validateAll(candidate);

      // Update error UI for ALL fields
      fields.forEach(f => {
        updateFieldError(f, errors[f]);
      });

      // Update validation summary
      updateValidationSummary(errors);

      // ALWAYS save inputs and errors
      setState({ inputs: candidate, errors });

      // Only calculate if no errors
      if (!hasErrors(errors)) {
        updateCalculations();
      }
    }, 300);

    listen(el, 'input', handler);
    listen(el, 'change', handler);
    listen(el, 'blur', handler);
  });
}

/* ---------- CALCULATIONS ---------- */
function updateCalculations() {
  const { inputs, errors } = state;
  if (hasErrors(errors)) {
    setState({ calculations: null });
    return;
  }

  try {
    const calculations = calculateAllModels({
      D0: inputs.D0,
      required: inputs.required / 100,
      gConst: inputs.gConst / 100,
      gShort: inputs.gShort / 100,
      gLong: inputs.gLong / 100,
      shortYears: inputs.shortYears,
    });
    setState({ calculations });
  } catch (e) {
    console.error(e);
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
  });
}

function selectModel(model) {
  document.querySelectorAll('.model-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.model === model);
    btn.setAttribute('aria-pressed', btn.dataset.model === model);
  });
  setState({ selectedModel: model });
}

/* ---------- VIEW TOGGLE ---------- */
function setupViewToggle() {
  const chartBtn = $('#view-chart-btn');
  const tableBtn = $('#view-table-btn');

  listen(chartBtn, 'click', () => switchView('chart'));
  listen(tableBtn, 'click', () => switchView('table'));

  updateButtonStates();
}

function updateButtonStates() {
  const chartBtn = $('#view-chart-btn');
  const tableBtn = $('#view-table-btn');
  const isForced = document.body.classList.contains('force-table');
  const currentView = isForced ? 'table' : state.view;

  if (!chartBtn || !tableBtn) return;

  // Update active states
  chartBtn.classList.toggle('active', currentView === 'chart');
  tableBtn.classList.toggle('active', currentView === 'table');
  
  // Update aria-pressed
  chartBtn.setAttribute('aria-pressed', currentView === 'chart');
  tableBtn.setAttribute('aria-pressed', currentView === 'table');
  
  // Disable chart button when forced to table
  chartBtn.disabled = isForced;
}

/* ---------- NARROW SCREEN ---------- */
function detectNarrowScreen() {
  const isNarrow = window.innerWidth <= 480;
  const body = document.body;
  const chartContainer = $('#chart-container');
  const tableContainer = $('#table-container');
  const wasForced = body.classList.contains('force-table');

  if (isNarrow) {
    // Force table view
    body.classList.add('force-table');
    
    // Destroy chart immediately if it exists
    destroyChart();
    
    // Set state to table
    setState({ view: 'table' });
    
    // Update DOM immediately - don't wait for state update
    if (chartContainer) {
      chartContainer.style.display = 'none';
    }
    if (tableContainer) {
      tableContainer.style.display = 'block';
    }
    
    // If we have calculations, render the table NOW
    if (state.calculations) {
      renderTable(state.calculations, state.selectedModel);
    }
    
    // Update button states
    updateButtonStates();
    
  } else if (wasForced) {
    // Was narrow, now wide - remove force
    body.classList.remove('force-table');
    
    // Restore to user's preferred view (or default to chart)
    const preferredView = state.view === 'table' ? 'table' : 'chart';
    setState({ view: preferredView });
    
    // Update DOM based on preferred view
    if (preferredView === 'chart') {
      if (chartContainer) chartContainer.style.display = 'block';
      if (tableContainer) tableContainer.style.display = 'none';
      if (state.calculations) {
        renderChart(state.calculations, state.selectedModel);
      }
    } else {
      if (chartContainer) chartContainer.style.display = 'none';
      if (tableContainer) tableContainer.style.display = 'block';
      if (state.calculations) {
        renderTable(state.calculations, state.selectedModel);
      }
    }
    
    // Update button states
    updateButtonStates();
  }
}

/* ---------- UPDATE ALL ---------- */
function updateAll(s) {
  if (!s.calculations) return;

  renderResults(s.calculations, s.selectedModel);
  
  const isForced = document.body.classList.contains('force-table');
  const actualView = isForced ? 'table' : s.view;

  const chartContainer = $('#chart-container');
  const tableContainer = $('#table-container');
  
  if (!chartContainer || !tableContainer) return;

  // Always render table first (needed for forced and optional table view)
  renderTable(s.calculations, s.selectedModel);
  
  // Show/hide containers based on actual view
  if (actualView === 'chart' && !isForced) {
    chartContainer.style.display = 'block';
    tableContainer.style.display = 'none';
    renderChart(s.calculations, s.selectedModel);
  } else {
    // Table view or forced table
    chartContainer.style.display = 'none';
    tableContainer.style.display = 'block';
    destroyChart(); // Ensure chart is destroyed
  }
  
  // Update button states
  updateButtonStates();
}

/* ---------- START ---------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}