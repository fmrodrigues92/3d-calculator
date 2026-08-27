const STORAGE_KEY = '3d-cost-calculator-settings-v1';

const DEFAULT_SETTINGS = {
  filaments: [
    { id: crypto.randomUUID(), name: 'PLA', pricePerKg: 115, machineCostPerHour: 0.24 },
    { id: crypto.randomUUID(), name: 'PETG', pricePerKg: 85, machineCostPerHour: 0.24 },
    { id: crypto.randomUUID(), name: 'ABS', pricePerKg: 99.9, machineCostPerHour: 0.24 },
    { id: crypto.randomUUID(), name: 'ASA', pricePerKg: 180, machineCostPerHour: 0.24 }
  ],
  paymentMethods: [
    { id: crypto.randomUUID(), name: 'Pix direto', percentageFee: 0 },
    { id: crypto.randomUUID(), name: 'Pix máquina', percentageFee: 0.99 },
    { id: crypto.randomUUID(), name: 'Débito', percentageFee: 1.49 },
    { id: crypto.randomUUID(), name: 'Crédito', percentageFee: 3.49 }
  ]
};

const state = {
  settings: loadSettings(),
  draftSettings: null
};

let calculationEventTimer;

const $ = (selector) => document.querySelector(selector);
const els = {
  weight: $('#weight'),
  hours: $('#hours'),
  minutes: $('#minutes'),
  quantity: $('#quantity'),
  packaging: $('#packaging'),
  otherCosts: $('#otherCosts'),
  margin: $('#margin'),
  paymentMethod: $('#paymentMethod'),
  resultsBody: $('#resultsBody'),
  resultsSummary: $('#resultsSummary'),
  emptyState: $('#emptyState'),
  settingsDialog: $('#settingsDialog'),
  settingsForm: $('#settingsForm'),
  filamentList: $('#filamentList'),
  paymentList: $('#paymentList'),
  filamentTemplate: $('#filamentTemplate'),
  paymentTemplate: $('#paymentTemplate')
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function trackEvent(name, properties) {
  if (typeof window.va === 'function') {
    window.va('event', name, properties);
  }
}

function scheduleCalculationEvent() {
  clearTimeout(calculationEventTimer);
  calculationEventTimer = setTimeout(() => {
    trackEvent('calculation_updated', {
      filamentCount: state.settings.filaments.length,
      paymentMethodConfigured: Boolean(els.paymentMethod.value)
    });
  }, 800);
}

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : deepClone(DEFAULT_SETTINGS);
  } catch {
    return deepClone(DEFAULT_SETTINGS);
  }
}

function persistSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
}

function numberValue(element, fallback = 0) {
  const value = Number(element.value);
  return Number.isFinite(value) ? value : fallback;
}

function currency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

function renderPaymentSelect() {
  const selected = els.paymentMethod.value;
  els.paymentMethod.innerHTML = '';

  state.settings.paymentMethods.forEach((method) => {
    const option = document.createElement('option');
    option.value = method.id;
    option.textContent = `${method.name} (${method.percentageFee.toFixed(2)}%)`;
    els.paymentMethod.appendChild(option);
  });

  if (state.settings.paymentMethods.some((m) => m.id === selected)) {
    els.paymentMethod.value = selected;
  }
}

function calculate() {
  const weightGrams = Math.max(0, numberValue(els.weight));
  const hours = Math.max(0, numberValue(els.hours));
  const minutes = Math.min(59, Math.max(0, numberValue(els.minutes)));
  const quantity = Math.max(1, Math.floor(numberValue(els.quantity, 1)));
  const packagingCost = Math.max(0, numberValue(els.packaging));
  const otherCosts = Math.max(0, numberValue(els.otherCosts));
  const margin = Math.min(99.99, Math.max(0, numberValue(els.margin))) / 100;
  const printingHours = hours + minutes / 60;
  const extras = packagingCost + otherCosts;

  const payment = state.settings.paymentMethods.find((m) => m.id === els.paymentMethod.value);
  const paymentFee = Math.min(99.99, Math.max(0, payment?.percentageFee || 0)) / 100;

  els.resultsBody.innerHTML = '';
  els.emptyState.classList.toggle('hidden', state.settings.filaments.length > 0);

  state.settings.filaments.forEach((filament) => {
    const materialCost = (weightGrams / 1000) * filament.pricePerKg;
    const machineCost = printingHours * filament.machineCostPerHour;
    const productionCost = materialCost + machineCost + extras;
    const netSalePrice = productionCost / (1 - margin);
    const finalSalePrice = netSalePrice / (1 - paymentFee);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${escapeHtml(filament.name)}</strong></td>
      <td>${currency(materialCost)}</td>
      <td>${currency(machineCost)}</td>
      <td>${currency(extras)}</td>
      <td><strong>${currency(productionCost)}</strong></td>
      <td>${currency(productionCost / quantity)}</td>
      <td class="highlight"><strong>${currency(finalSalePrice)}</strong></td>
      <td>${currency(finalSalePrice / quantity)}</td>
    `;
    els.resultsBody.appendChild(row);
  });

  const paymentText = payment ? `${payment.name} (${payment.percentageFee.toFixed(2)}%)` : 'sem taxa';
  els.resultsSummary.textContent = `${weightGrams.toFixed(0)} g · ${printingHours.toFixed(2)} h · ${quantity} peça(s) · ${paymentText}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function openSettings() {
  state.draftSettings = deepClone(state.settings);
  renderSettingsLists();
  els.settingsDialog.showModal();
  trackEvent('settings_opened');
}

function renderSettingsLists() {
  renderFilaments();
  renderPayments();
}

function renderFilaments() {
  els.filamentList.innerHTML = '';
  state.draftSettings.filaments.forEach((filament) => {
    const fragment = els.filamentTemplate.content.cloneNode(true);
    const row = fragment.querySelector('.filament-row');
    row.dataset.id = filament.id;
    row.querySelector('[data-field="name"]').value = filament.name;
    row.querySelector('[data-field="pricePerKg"]').value = filament.pricePerKg;
    row.querySelector('[data-field="machineCostPerHour"]').value = filament.machineCostPerHour;
    row.querySelector('.remove-row').addEventListener('click', () => {
      syncDraftFromUI();
      state.draftSettings.filaments = state.draftSettings.filaments.filter((item) => item.id !== filament.id);
      renderFilaments();
      trackEvent('settings_item_removed', { itemType: 'filament' });
    });
    els.filamentList.appendChild(fragment);
  });
}

function renderPayments() {
  els.paymentList.innerHTML = '';
  state.draftSettings.paymentMethods.forEach((method) => {
    const fragment = els.paymentTemplate.content.cloneNode(true);
    const row = fragment.querySelector('.payment-row');
    row.dataset.id = method.id;
    row.querySelector('[data-field="name"]').value = method.name;
    row.querySelector('[data-field="percentageFee"]').value = method.percentageFee;
    row.querySelector('.remove-row').addEventListener('click', () => {
      syncDraftFromUI();
      state.draftSettings.paymentMethods = state.draftSettings.paymentMethods.filter((item) => item.id !== method.id);
      renderPayments();
      trackEvent('settings_item_removed', { itemType: 'payment_method' });
    });
    els.paymentList.appendChild(fragment);
  });
}

function syncDraftFromUI() {
  if (!state.draftSettings) return;

  state.draftSettings.filaments = [...els.filamentList.querySelectorAll('.filament-row')].map((row) => ({
    id: row.dataset.id,
    name: row.querySelector('[data-field="name"]').value.trim(),
    pricePerKg: Number(row.querySelector('[data-field="pricePerKg"]').value) || 0,
    machineCostPerHour: Number(row.querySelector('[data-field="machineCostPerHour"]').value) || 0
  }));

  state.draftSettings.paymentMethods = [...els.paymentList.querySelectorAll('.payment-row')].map((row) => ({
    id: row.dataset.id,
    name: row.querySelector('[data-field="name"]').value.trim(),
    percentageFee: Number(row.querySelector('[data-field="percentageFee"]').value) || 0
  }));
}

$('#openSettings').addEventListener('click', openSettings);

$('#addFilament').addEventListener('click', () => {
  syncDraftFromUI();
  state.draftSettings.filaments.push({
    id: crypto.randomUUID(),
    name: '',
    pricePerKg: 0,
    machineCostPerHour: 0
  });
  renderFilaments();
  trackEvent('settings_item_added', { itemType: 'filament' });
});

$('#addPayment').addEventListener('click', () => {
  syncDraftFromUI();
  state.draftSettings.paymentMethods.push({
    id: crypto.randomUUID(),
    name: '',
    percentageFee: 0
  });
  renderPayments();
  trackEvent('settings_item_added', { itemType: 'payment_method' });
});

$('#resetSettings').addEventListener('click', () => {
  state.draftSettings = deepClone(DEFAULT_SETTINGS);
  renderSettingsLists();
  trackEvent('settings_reset');
});

els.settingsForm.addEventListener('submit', (event) => {
  if (event.submitter?.value === 'default') {
    event.preventDefault();
    syncDraftFromUI();

    const validFilaments = state.draftSettings.filaments.filter((item) => item.name.trim());
    const validPayments = state.draftSettings.paymentMethods.filter((item) => item.name.trim());

    if (!validPayments.length) {
      alert('Cadastre pelo menos uma forma de pagamento.');
      return;
    }

    state.settings = {
      filaments: validFilaments,
      paymentMethods: validPayments
    };
    persistSettings();
    renderPaymentSelect();
    calculate();
    els.settingsDialog.close();
    trackEvent('settings_saved', {
      filamentCount: validFilaments.length,
      paymentMethodCount: validPayments.length
    });
  }
});

[
  els.weight,
  els.hours,
  els.minutes,
  els.quantity,
  els.packaging,
  els.otherCosts,
  els.margin,
  els.paymentMethod
].forEach((element) => {
  element.addEventListener('input', () => {
    calculate();
    scheduleCalculationEvent();
  });
  element.addEventListener('change', () => {
    calculate();
    scheduleCalculationEvent();
  });
});

renderPaymentSelect();
calculate();
