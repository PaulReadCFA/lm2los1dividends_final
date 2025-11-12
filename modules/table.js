/**
 * Table Rendering - Dividend Cash Flows
 */
import { $ } from './utils.js';

export function renderTable(calculations, selectedModel) {
  const table = $('#data-table');
  
  if (!table) {
    console.error('Table element not found');
    return;
  }
  
  // Determine which models to display
  const modelsToShow = selectedModel === 'all' 
    ? ['constant', 'growth', 'changing']
    : [selectedModel];
  
  // Get data from first model (they all have same years)
  const firstModel = calculations[modelsToShow[0]];
  if (!firstModel || !firstModel.cashFlows) {
    console.error('No cash flow data available');
    return;
  }
  
  const cashFlows = firstModel.cashFlows;
  
  // Build table HTML
  let html = `
    <caption class="sr-only">Dividend cash flow schedule showing year, and dividend payments for selected model(s). Year 0 shows initial investment (negative). Years 1-10 show expected dividend payments.</caption>
    <thead>
      <tr>
        <th scope="col" class="text-left">Year</th>
  `;
  
  // Add column headers for each model
  const modelNames = {
    constant: 'Constant Dividend',
    growth: 'Constant Growth',
    changing: 'Two-Stage Growth'
  };
  
  modelsToShow.forEach(modelKey => {
    html += `<th scope="col" class="text-right">${modelNames[modelKey]}</th>`;
  });
  
  html += `
      </tr>
    </thead>
    <tbody>
  `;
  
  // Add rows for each year
  cashFlows.forEach((cf) => {
    const yearLabel = cf.year === 0 ? 'Initial' : `Year ${cf.year}`;
    
    html += `
      <tr>
        <th scope="row" class="text-left">${yearLabel}</th>
    `;
    
    // Add cells for each model
    modelsToShow.forEach(modelKey => {
      const modelData = calculations[modelKey];
      const cashFlow = modelData.cashFlows.find(c => c.year === cf.year);
      const dividend = cashFlow ? cashFlow.dividend : 0;
      
      html += `<td class="text-right">${formatCurrency(dividend, true)}</td>`;
    });
    
    html += `</tr>`;
  });
  
  html += `
    </tbody>
    <tfoot>
      <tr>
        <th scope="row" class="text-left">Total Received</th>
  `;
  
  // Calculate totals for each model (excluding initial investment)
  modelsToShow.forEach(modelKey => {
    const modelData = calculations[modelKey];
    const total = modelData.cashFlows.reduce((sum, cf) => {
      return sum + (cf.dividend > 0 ? cf.dividend : 0);
    }, 0);
    
    html += `<td class="text-right"><strong>${formatCurrency(total)}</strong></td>`;
  });
  
  html += `
      </tr>
      <tr>
        <th scope="row" class="text-left">Stock Price (PV)</th>
  `;
  
  // Add stock prices for each model
  modelsToShow.forEach(modelKey => {
    const modelData = calculations[modelKey];
    const price = modelData.price;
    
    html += `<td class="text-right"><strong>${isFinite(price) ? formatCurrency(price) : 'Invalid'}</strong></td>`;
  });
  
  html += `
      </tr>
    </tfoot>
  `;
  
  table.innerHTML = html;
}

function formatCurrency(amount, showNegativeAsParens = false) {
  if (isNaN(amount)) return '$0.00';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const formattedAmount = formatter.format(Math.abs(amount));
  
  if (amount < 0 && showNegativeAsParens) {
    return `(${formattedAmount})`;
  }
  
  if (amount < 0) {
    return `-${formattedAmount}`;
  }
  
  return formattedAmount;
}