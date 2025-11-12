/**
 * Enhanced Accessible Tooltip Module
 * - Shows allowable input ranges
 * - Displays validation errors
 * - Full keyboard + mouse support
 * - SR-friendly with aria-describedby & role="tooltip"
 */
import { createElement, listen } from './utils.js';

export function initTooltips() {
  const triggers = document.querySelectorAll('[data-tooltip-id]');
  
  triggers.forEach(trigger => {
    const id = trigger.getAttribute('data-tooltip-id');
    const text = trigger.getAttribute('data-tooltip-text');
    const range = trigger.getAttribute('data-tooltip-range');
    
if (!id || !text) return;

// Always ensure tooltip content reflects range
let tooltip = document.getElementById(id);
if (!tooltip) {
  tooltip = createElement('div', { id, role: 'tooltip', className: 'tooltip hidden' });
  document.body.appendChild(tooltip);
}

// Clear existing content (avoids duplication)
tooltip.innerHTML = '';

const content = document.createElement('div');
content.className = 'tooltip-content';

const description = document.createElement('div');
description.className = 'tooltip-description';
description.textContent = text;
content.appendChild(description);

if (range) {
  const rangeInfo = document.createElement('div');
  rangeInfo.className = 'tooltip-range';
  rangeInfo.textContent = `Range: ${range}`;
  content.appendChild(rangeInfo);
}

// Optional: error container
const errorContainer = document.createElement('div');
errorContainer.className = 'tooltip-error hidden';
errorContainer.id = `${id}-error`;
content.appendChild(errorContainer);

tooltip.appendChild(content);


    // Link tooltip to input for accessibility
    const inputId = id.replace('tooltip-', '');
    const input = document.getElementById(inputId);
    if (input && !input.hasAttribute('aria-describedby')) {
      input.setAttribute('aria-describedby', id);
    }

    const show = () => positionAndShow(trigger, tooltip);
    const hide = () => hideTooltip(tooltip);

    listen(trigger, 'mouseenter', show);
    listen(trigger, 'mouseleave', hide);
    listen(trigger, 'focus', show);
    listen(trigger, 'blur', hide);
  });
}

/**
 * Update tooltip with validation error
 * @param {string} tooltipId - Tooltip ID
 * @param {string|null} errorMessage - Error message or null to clear
 */
export function updateTooltipError(tooltipId, errorMessage) {
  const tooltip = document.getElementById(tooltipId);
  if (!tooltip) return;
  
  const errorContainer = tooltip.querySelector('.tooltip-error');
  if (!errorContainer) return;
  
  if (errorMessage) {
    errorContainer.textContent = `⚠ ${errorMessage}`;
    errorContainer.classList.remove('hidden');
    tooltip.classList.add('has-error');
  } else {
    errorContainer.textContent = '';
    errorContainer.classList.add('hidden');
    tooltip.classList.remove('has-error');
  }
}

function positionAndShow(trigger, tooltip) {
  tooltip.classList.remove('hidden');
  tooltip.style.visibility='hidden';
  tooltip.style.top='0';
  tooltip.style.left='0';

  const rect = trigger.getBoundingClientRect();
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const pad = 8;

  const ttRect = tooltip.getBoundingClientRect();
  let top = rect.top + scrollY - ttRect.height - pad;
  let placement = 'top';
  if (top < 0) { 
    top = rect.bottom + scrollY + pad;
    placement = 'bottom';
  }

  let left = rect.left + scrollX + rect.width/2 - ttRect.width/2;
  left = Math.max(8, Math.min(left, window.innerWidth - ttRect.width - 8));

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
  tooltip.dataset.placement = placement;
  tooltip.style.visibility='visible';
}

function hideTooltip(tooltip) {
  tooltip.classList.add('hidden');
  tooltip.style.visibility='hidden';
}