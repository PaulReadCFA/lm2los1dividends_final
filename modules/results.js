/**
 * Results Rendering - Dividend Discount Calculator
 */
import { $ } from './utils.js';

const MODEL_META = {
  constant: {
    name: 'Constant Dividend',
    color: '#2563eb',
    description: 'No growth assumed',
    formula: 'P = D₀ ÷ r'
  },
  growth: {
    name: 'Constant Growth',
    color: '#16a34a',
    description: 'Constant growth rate',
    formula: 'P = D₁ ÷ (r − g)'
  },
  changing: {
    name: 'Two-Stage Growth',
    color: '#9333ea',
    description: 'High then sustainable growth',
    formula: 'P = PV(high) + PV(term)'
  }
};

export function renderResults(calculations, selectedModel) {
  const container = $('#results-content');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Determine which models to display
  const modelsToShow = selectedModel === 'all' 
    ? ['constant', 'growth', 'changing']
    : [selectedModel];
  
  // Create result boxes for each model
  modelsToShow.forEach(modelKey => {
    const modelData = calculations[modelKey];
    const metadata = MODEL_META[modelKey];
    
    const box = document.createElement('div');
    box.className = `result-box model-${modelKey}`;
    box.setAttribute('aria-live', 'polite');
    
    // Title
    const title = document.createElement('h5');
    title.className = `result-title model-${modelKey}`;
    title.textContent = metadata.name;
    box.appendChild(title);
    
    // Price value
    const valueDiv = document.createElement('div');
    valueDiv.className = `result-value model-${modelKey}`;
    
    if (isFinite(modelData.price)) {
      valueDiv.textContent = formatCurrency(modelData.price);
    } else {
      valueDiv.textContent = 'Not Applicable';
      valueDiv.style.fontSize = '1.25rem';
      
      // Add explanation for why it's invalid
      const explanation = document.createElement('div');
      explanation.className = 'result-explanation';
      explanation.style.fontSize = '0.75rem';
      explanation.style.marginTop = '0.25rem';
      explanation.style.fontWeight = 'normal';
      explanation.textContent = 'Growth rate must be less than required return';
      box.appendChild(explanation);
    }
    
    box.appendChild(valueDiv);
    
    // Description (only if valid)
    if (isFinite(modelData.price)) {
      const description = document.createElement('div');
      description.className = 'result-description';
      description.textContent = metadata.description;
      box.appendChild(description);
      
      // Formula
      const formula = document.createElement('div');
      formula.className = 'result-formula';
      formula.textContent = metadata.formula;
      box.appendChild(formula);
    }
    
    container.appendChild(box);
  });
}

function formatCurrency(amount) {
  if (isNaN(amount)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}