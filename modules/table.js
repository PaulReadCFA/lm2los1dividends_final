/**
 * table.js – Add data-label for mobile stacking
 */
import { $ } from './utils.js';

export function renderTable(calculations, selectedModel) {
  const table = $('#data-table');
  if (!table) return;

  const modelsToShow = selectedModel === 'all'
    ? ['constant', 'growth', 'changing']
    : [selectedModel];

  const firstModel = calculations[modelsToShow[0]];
  if (!firstModel || !firstModel.cashFlows) return;

  const cashFlows = firstModel.cashFlows;

  const modelNames = {
    constant: 'Constant Dividend',
    growth: 'Constant Growth',
    changing: 'Two-Stage Growth',
  };

  let html = `
    <caption class="sr-only">Dividend cash flow schedule</caption>
    <thead>
      <tr>
        <th scope="col" class="text-left">Year</th>
  `;

  modelsToShow.forEach(m => {
    html += `<th scope="col" class="text-right">${modelNames[m]}</th>`;
  });

  html += `</tr></thead><tbody>`;

  cashFlows.forEach(cf => {
    const yearLabel = cf.year === 0 ? 'Initial' : `Year ${cf.year}`;
    html += `<tr>
      <th scope="row" class="text-left">${yearLabel}</th>`;

    modelsToShow.forEach(m => {
      const flow = calculations[m].cashFlows.find(c => c.year === cf.year);
      const val = flow ? flow.dividend : 0;
      const formatted = formatCurrency(val, true);
      html += `<td class="text-right" data-label="${modelNames[m]}">${formatted}</td>`;
    });

    html += `</tr>`;
  });

  // Footer – totals + price
  html += `</tbody><tfoot>
    <tr>
      <th scope="row" class="text-left">Total Received</th>`;
  modelsToShow.forEach(m => {
    const total = calculations[m].cashFlows
      .reduce((s, c) => s + (c.dividend > 0 ? c.dividend : 0), 0);
    html += `<td class="text-right"><strong>${formatCurrency(total)}</strong></td>`;
  });
  html += `</tr>
    <tr>
      <th scope="row" class="text-left">Stock Price (PV)</th>`;
  modelsToShow.forEach(m => {
    const price = calculations[m].price;
    const txt = isFinite(price) ? formatCurrency(price) : 'Invalid';
    html += `<td class="text-right"><strong>${txt}</strong></td>`;
  });
  html += `</tr></tfoot>`;

  table.innerHTML = html;
}

function formatCurrency(amount, showNegativeAsParens = false) {
  if (isNaN(amount)) return '$0.00';
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatted = formatter.format(Math.abs(amount));
  if (amount < 0 && showNegativeAsParens) return `(${formatted})`;
  return amount < 0 ? `-${formatted}` : formatted;
}