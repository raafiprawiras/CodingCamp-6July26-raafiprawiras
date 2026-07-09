// =============================================================
// script.js — Expense & Budget Visualizer
// =============================================================

(function () {
  'use strict';

  // ===========================================================
  // CONFIG
  // ===========================================================

  /** Default categories always available in the select. */
  const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

  /** LocalStorage keys — centralised so a typo can never cause a silent mismatch. */
  const STORAGE_KEYS = {
    TRANSACTIONS : 'budgetvis_transactions',
    CATEGORIES   : 'budgetvis_categories',
  };

  // ===========================================================
  // STATE
  // ===========================================================

  /**
   * Central application state.
   * transactions : Array<Transaction>
   * categories   : string[]   — custom user-added categories
   */
  const state = {
    transactions: [],
    categories: [],   // custom additions only; merged with DEFAULT_CATEGORIES at render time
  };

  // ===========================================================
  // DOM REFERENCES
  // ===========================================================

  const form         = document.getElementById('transaction-form');
  const fieldDesc    = document.getElementById('transaction-description');
  const fieldAmount  = document.getElementById('transaction-amount');
  const fieldCat     = document.getElementById('transaction-category');
  const errDesc      = document.getElementById('description-error');
  const errAmount    = document.getElementById('amount-error');
  const errCat       = document.getElementById('category-error');

  const customCatForm  = document.getElementById('custom-category-form');
  const customCatInput = document.getElementById('custom-category-input');
  const customCatErr   = document.getElementById('custom-category-error');

  // ===========================================================
  // UTILITY — Toast notification
  // ===========================================================

  let toastTimer = null;

  /**
   * Show a brief slide-up toast message at the bottom of the screen.
   * @param {string}  message
   * @param {'success'|'error'} [type='success']
   */
  function showToast(message, type = 'success') {
    // Reuse or create the toast element
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    // Reset classes, set content
    toast.className = 'toast' + (type === 'error' ? ' toast--error' : '');
    toast.textContent = message;

    // Trigger slide-in on next frame so CSS transition fires
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('toast--visible'));
    });

    // Auto-dismiss after 2.5 s
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('toast--visible');
    }, 2500);
  }

  // ===========================================================
  // UTILITY — Field-level validation helpers
  // ===========================================================

  /**
   * Mark a field as invalid and show an error message.
   * @param {HTMLElement} field   - input or select element
   * @param {HTMLElement} errEl   - associated <span class="form-error">
   * @param {string}      message - error text
   */
  function setFieldError(field, errEl, message) {
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
    field.setAttribute('aria-invalid', 'true');
    errEl.textContent = message;
  }

  /**
   * Mark a field as valid and clear any error message.
   * @param {HTMLElement} field
   * @param {HTMLElement} errEl
   */
  function setFieldValid(field, errEl) {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    field.setAttribute('aria-invalid', 'false');
    errEl.textContent = '';
  }

  /**
   * Clear visual validation state (used on reset).
   * @param {HTMLElement} field
   * @param {HTMLElement} errEl
   */
  function clearFieldState(field, errEl) {
    field.classList.remove('is-invalid', 'is-valid');
    field.removeAttribute('aria-invalid');
    errEl.textContent = '';
  }

  // ===========================================================
  // VALIDATION — Individual rules
  // ===========================================================

  /**
   * Validate the description field.
   * Rules: required, non-empty after trim.
   * @returns {boolean}
   */
  function validateDescription() {
    const value = fieldDesc.value.trim();

    if (value === '') {
      setFieldError(fieldDesc, errDesc, 'Item name is required.');
      return false;
    }

    setFieldValid(fieldDesc, errDesc);
    return true;
  }

  /**
   * Validate the amount field.
   * Rules: required, must be a number, must be > 0, no decimals allowed.
   * @returns {boolean}
   */
  function validateAmount() {
    const raw   = fieldAmount.value.trim();
    const value = Number(raw);

    if (raw === '') {
      setFieldError(fieldAmount, errAmount, 'Amount is required.');
      return false;
    }

    if (isNaN(value) || !isFinite(value)) {
      setFieldError(fieldAmount, errAmount, 'Enter a valid number.');
      return false;
    }

    if (value <= 0) {
      setFieldError(fieldAmount, errAmount, 'Amount must be greater than zero.');
      return false;
    }

    if (!Number.isInteger(value)) {
      setFieldError(fieldAmount, errAmount, 'Amount must be a whole number (no decimals).');
      return false;
    }

    setFieldValid(fieldAmount, errAmount);
    return true;
  }

  /**
   * Validate the category select.
   * Rules: a non-empty option must be chosen.
   * @returns {boolean}
   */
  function validateCategory() {
    if (fieldCat.value === '') {
      setFieldError(fieldCat, errCat, 'Please select a category.');
      return false;
    }

    setFieldValid(fieldCat, errCat);
    return true;
  }

  /**
   * Run all field validations and return whether the whole form is valid.
   * All three validators always run (no short-circuit) so every error
   * is shown at once rather than one at a time.
   * @returns {boolean}
   */
  function validateForm() {
    const descOk   = validateDescription();
    const amountOk = validateAmount();
    const catOk    = validateCategory();
    return descOk && amountOk && catOk;
  }

  // ===========================================================
  // CATEGORY MODULE
  // ===========================================================

  /**
   * Return the full merged category list (defaults + custom).
   * @returns {string[]}
   */
  function getAllCategories() {
    return [...DEFAULT_CATEGORIES, ...state.categories];
  }

  /**
   * Rebuild the <select> options from the current category list.
   * Preserves the currently selected value if it still exists.
   */
  function renderCategoryOptions() {
    const current = fieldCat.value;

    // Remove all dynamic options (keep the placeholder)
    while (fieldCat.options.length > 1) {
      fieldCat.remove(1);
    }

    getAllCategories().forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      fieldCat.appendChild(opt);
    });

    // Restore selection if still valid
    if (current && getAllCategories().includes(current)) {
      fieldCat.value = current;
    }
  }

  /**
   * Add a new custom category to state (no LocalStorage yet).
   * @param {string} name - already trimmed
   */
  function addCategory(name) {
    state.categories.push(name);
    renderCategoryOptions();
  }

  // ===========================================================
  // TRANSACTION MODULE
  // ===========================================================

  /**
   * @typedef {Object} Transaction
   * @property {string} id          - unique identifier
   * @property {string} description - trimmed item name
   * @property {number} amount      - positive integer
   * @property {'income'|'expense'} type
   * @property {string} category
   * @property {string} date        - ISO 8601 string
   */

  /**
   * Build a new Transaction object from validated form data.
   * @returns {Transaction}
   */
  function buildTransaction() {
    const type = document.querySelector('input[name="transaction-type"]:checked').value;

    return {
      id          : `txn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      description : fieldDesc.value.trim(),
      amount      : parseInt(fieldAmount.value.trim(), 10),
      type,
      category    : fieldCat.value,
      date        : new Date().toISOString(),
    };
  }

  /**
   * Add a transaction to state and re-render the list.
   * @param {Transaction} txn
   */
  function addTransaction(txn) {
    state.transactions.push(txn);
    renderTransactionList();
    renderSummaryCards();
  }

  /**
   * Remove a transaction from state by id.
   * @param {string} id
   */
  function deleteTransaction(id) {
    const idx = state.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return;
    state.transactions.splice(idx, 1);
    renderTransactionList();
    renderSummaryCards();
    showToast('Transaction deleted.');
  }

  // ===========================================================
  // CALCULATION MODULE
  // ===========================================================

  /** @returns {number} */
  function getTotalIncome() {
    return state.transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /** @returns {number} */
  function getTotalExpenses() {
    return state.transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /** @returns {number} */
  function getTotalBalance() {
    return getTotalIncome() - getTotalExpenses();
  }

  // ===========================================================
  // RENDER MODULE
  // ===========================================================

  /**
   * Format a number as Indonesian Rupiah.
   * @param {number} amount
   * @returns {string}  e.g. "Rp 1.500.000"
   */
  function formatRupiah(amount) {
    return 'Rp ' + Math.abs(amount).toLocaleString('id-ID');
  }

  /**
   * Format an ISO date string to a readable short form.
   * @param {string} iso
   * @returns {string}  e.g. "8 Jul 2026, 14:30"
   */
  function formatDate(iso) {
    return new Date(iso).toLocaleString('en-GB', {
      day   : 'numeric',
      month : 'short',
      year  : 'numeric',
      hour  : '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Map a category name to a representative emoji icon.
   * @param {string} category
   * @returns {string}
   */
  function categoryIcon(category) {
    const icons = {
      Food      : '🍔',
      Transport : '🚗',
      Fun       : '🎮',
    };
    return icons[category] || '🏷️';
  }

  /** Update the three summary card amounts. */
  function renderSummaryCards() {
    const balance  = getTotalBalance();
    const income   = getTotalIncome();
    const expenses = getTotalExpenses();

    const elBalance  = document.getElementById('total-balance');
    const elIncome   = document.getElementById('total-income');
    const elExpenses = document.getElementById('total-expenses');

    elBalance.textContent  = (balance < 0 ? '− ' : '') + formatRupiah(balance);
    elIncome.textContent   = formatRupiah(income);
    elExpenses.textContent = formatRupiah(expenses);
  }

  /**
   * Build and return a single transaction <li> node from the template.
   * @param {Transaction} txn
   * @returns {HTMLElement}
   */
  function createTransactionNode(txn) {
    const template = document.getElementById('transaction-item-template');
    const node     = template.content.cloneNode(true);
    const li       = node.querySelector('.transaction-item');

    li.dataset.id   = txn.id;
    li.dataset.type = txn.type;

    li.querySelector('.transaction-item__icon').textContent        = categoryIcon(txn.category);
    li.querySelector('.transaction-item__description').textContent = txn.description;

    const timeEl       = li.querySelector('.transaction-item__date');
    timeEl.textContent = formatDate(txn.date);
    timeEl.dateTime    = txn.date;

    li.querySelector('.transaction-item__category-badge').textContent = txn.category;

    const amountEl       = li.querySelector('.transaction-item__amount');
    amountEl.textContent = (txn.type === 'income' ? '+ ' : '− ') + formatRupiah(txn.amount);

    // Attach delete button data
    const deleteBtn   = li.querySelector('[data-action="delete-transaction"]');
    deleteBtn.dataset.id = txn.id;
    deleteBtn.setAttribute('aria-label', `Delete transaction: ${txn.description}`);

    return li;
  }

  /** Re-render the full transaction list from state. */
  function renderTransactionList() {
    const list      = document.getElementById('transaction-list');
    const emptyState = document.getElementById('list-empty-state');

    // Clear current items
    list.innerHTML = '';

    if (state.transactions.length === 0) {
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    // Render newest-first by default
    const sorted = [...state.transactions].reverse();
    sorted.forEach((txn) => list.appendChild(createTransactionNode(txn)));
  }

  // ===========================================================
  // FORM RESET
  // ===========================================================

  /** Clear all form fields and validation states after successful submission. */
  function resetForm() {
    form.reset();
    clearFieldState(fieldDesc,   errDesc);
    clearFieldState(fieldAmount, errAmount);
    clearFieldState(fieldCat,    errCat);
    fieldDesc.focus();
  }

  // ===========================================================
  // EVENT HANDLERS
  // ===========================================================

  /**
   * Live validation: validate each field as the user types / changes,
   * but only once the field has been "touched" (blur fires first).
   */
  function bindLiveValidation() {
    // Description
    fieldDesc.addEventListener('blur', () => validateDescription(), { once: false });
    fieldDesc.addEventListener('input', () => {
      if (fieldDesc.classList.contains('is-invalid') || fieldDesc.classList.contains('is-valid')) {
        validateDescription();
      }
    });

    // Amount
    fieldAmount.addEventListener('blur', () => validateAmount(), { once: false });
    fieldAmount.addEventListener('input', () => {
      if (fieldAmount.classList.contains('is-invalid') || fieldAmount.classList.contains('is-valid')) {
        validateAmount();
      }
    });

    // Category
    fieldCat.addEventListener('change', () => validateCategory());
  }

  /** Handle main form submission. */
  function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      // Focus the first invalid field to assist keyboard / screen-reader users
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const txn = buildTransaction();
    addTransaction(txn);
    resetForm();
    showToast('Transaction added successfully!');
  }

  /** Handle custom category form submission. */
  function handleCustomCategorySubmit(e) {
    e.preventDefault();

    const name = customCatInput.value.trim();

    // Validation
    if (name === '') {
      customCatErr.textContent = 'Category name cannot be empty.';
      customCatInput.classList.add('is-invalid');
      customCatInput.focus();
      return;
    }

    const exists = getAllCategories().some(
      (c) => c.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      customCatErr.textContent = `"${name}" already exists.`;
      customCatInput.classList.add('is-invalid');
      customCatInput.focus();
      return;
    }

    if (name.length > 30) {
      customCatErr.textContent = 'Category name must be 30 characters or fewer.';
      customCatInput.classList.add('is-invalid');
      customCatInput.focus();
      return;
    }

    // All good
    addCategory(name);
    customCatInput.value = '';
    customCatInput.classList.remove('is-invalid', 'is-valid');
    customCatErr.textContent = '';
    showToast(`Category "${name}" added.`);
  }

  /**
   * Handle delete clicks via event delegation on the transaction list.
   * @param {MouseEvent} e
   */
  function handleListClick(e) {
    const btn = e.target.closest('[data-action="delete-transaction"]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (id) deleteTransaction(id);
  }

  // ===========================================================
  // INIT
  // ===========================================================

  function init() {
    // Populate category <select> with defaults
    renderCategoryOptions();

    // Render initial empty states
    renderTransactionList();
    renderSummaryCards();

    // Attach events
    form.addEventListener('submit', handleFormSubmit);
    customCatForm.addEventListener('submit', handleCustomCategorySubmit);
    document.getElementById('transaction-list').addEventListener('click', handleListClick);
    bindLiveValidation();
  }

  // Kick off when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
