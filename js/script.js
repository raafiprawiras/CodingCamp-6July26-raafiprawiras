// =============================================================
// script.js — Expense & Budget Visualizer
// =============================================================

(function () {
  'use strict';

  // ===========================================================
  // CONFIG
  // ===========================================================

  /** Default categories for Income transactions. */
  const INCOME_CATEGORIES = [
    'Salary',
    'Freelance',
    'Business',
    'Investment',
    'Bonus',
    'Gift',
    'Side Income',
    'Rental',
  ];

  /** Default categories for Expense transactions. */
  const EXPENSE_CATEGORIES = [
    'Food & Drink',
    'Transport',
    'Shopping',
    'Housing',
    'Entertainment',
    'Health',
    'Education',
    'Utilities',
    'Subscription',
    'Travel',
  ];

  /**
   * Chart colour palette — 12 distinct colours that work on both
   * light and dark backgrounds. Cycles when there are more categories
   * than entries (via getChartColor).
   */
  const CHART_COLORS = [
    '#6c63ff', // purple   (brand)
    '#ef4444', // red
    '#f59e0b', // amber
    '#22c55e', // green
    '#3b82f6', // blue
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#e11d48', // rose
  ];

  /**
   * Return a chart colour for a given index, wrapping around if the
   * number of categories exceeds the palette length.
   *
   * @param {number} index
   * @returns {string}
   */
  function getChartColor(index) {
    return CHART_COLORS[index % CHART_COLORS.length];
  }

  /** LocalStorage keys — centralised so a typo can never cause a silent mismatch. */
  const STORAGE_KEYS = {
    TRANSACTIONS: 'budgetvis_transactions',
    CATEGORIES_INCOME: 'budgetvis_categories_income',
    CATEGORIES_EXPENSE: 'budgetvis_categories_expense',
    THEME: 'budgetvis_theme',
    SORT: 'budgetvis_sort',
  };

  // ===========================================================
  // STATE
  // ===========================================================

  /**
   * Central application state.
   * transactions : Array<Transaction>
   * categories   : string[]   — custom user-added categories
   * sort         : { field: string, dir: 'asc'|'desc' }
   */
  const state = {
    transactions: [],
    categoriesIncome: [],  // custom income categories
    categoriesExpense: [],  // custom expense categories
    sort: { field: 'date', dir: 'desc' },
  };

  /**
   * Return the currently selected transaction type from the radio buttons.
   * @returns {'income'|'expense'}
   */
  function getSelectedType() {
    const checked = document.querySelector('input[name="transaction-type"]:checked');
    return checked ? checked.value : 'income';
  }

  /** @type {Chart|null} */
  let expenseChart = null;

  // ===========================================================
  // STORAGE MODULE
  // ===========================================================

  /**
   * Generic helper — safely write any serialisable value to LocalStorage.
   * Wraps JSON.stringify and swallows QuotaExceededError gracefully.
   *
   * @param {string} key
   * @param {*}      value
   */
  function storageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[Storage] Could not save "${key}":`, err);
    }
  }

  /**
   * Generic helper — safely read and parse a value from LocalStorage.
   * Returns `fallback` when the key is missing or the JSON is corrupt.
   *
   * @template T
   * @param {string} key
   * @param {T}      fallback
   * @returns {T}
   */
  function storageGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn(`[Storage] Could not read "${key}":`, err);
      return fallback;
    }
  }

  /**
   * Persist the current state to LocalStorage.
   * Called after every mutation (add / delete transaction, add category, sort change).
   */
  function persistState() {
    storageSet(STORAGE_KEYS.TRANSACTIONS, state.transactions);
    storageSet(STORAGE_KEYS.CATEGORIES_INCOME, state.categoriesIncome);
    storageSet(STORAGE_KEYS.CATEGORIES_EXPENSE, state.categoriesExpense);
    storageSet(STORAGE_KEYS.SORT, state.sort);
  }

  /**
   * Hydrate state from LocalStorage on page load.
   * Validates that the stored data is an array before assigning,
   * so corrupt or tampered data never breaks the app.
   */
  function loadState() {
    const transactions = storageGet(STORAGE_KEYS.TRANSACTIONS, []);
    const categoriesIncome = storageGet(STORAGE_KEYS.CATEGORIES_INCOME, []);
    const categoriesExpense = storageGet(STORAGE_KEYS.CATEGORIES_EXPENSE, []);
    const sort = storageGet(STORAGE_KEYS.SORT, null);

    state.transactions = Array.isArray(transactions) ? transactions : [];
    state.categoriesIncome = Array.isArray(categoriesIncome) ? categoriesIncome : [];
    state.categoriesExpense = Array.isArray(categoriesExpense) ? categoriesExpense : [];

    // Validate sort config — must have a known field and direction
    const validFields = ['date', 'amount', 'category'];
    const validDirs = ['asc', 'desc'];
    if (
      sort &&
      typeof sort.field === 'string' && validFields.includes(sort.field) &&
      typeof sort.dir === 'string' && validDirs.includes(sort.dir)
    ) {
      state.sort = sort;
    }
    // else keep the default { field: 'date', dir: 'desc' } set in STATE
  }

  // ===========================================================
  // THEME MODULE
  // ===========================================================

  /**
   * Apply a theme to the document and sync the toggle button's
   * icon and accessible label.
   *
   * @param {'light'|'dark'} theme
   */
  function applyTheme(theme) {
    const root = document.documentElement;
    const toggleBtn = document.querySelector('[data-action="toggle-theme"]');
    const themeIcon = toggleBtn && toggleBtn.querySelector('.theme-icon');

    root.setAttribute('data-theme', theme);

    if (toggleBtn) {
      const isDark = theme === 'dark';
      toggleBtn.setAttribute(
        'aria-label',
        isDark ? 'Switch to light mode' : 'Switch to dark mode'
      );
      if (themeIcon) {
        themeIcon.innerHTML = isDark
          ? '<i class="fa-solid fa-sun"></i>'
          : '<i class="fa-solid fa-moon"></i>';
      }
    }
  }

  /**
   * Flip the current theme, persist the choice, and re-apply.
   * Called by the toggle button click handler.
   */
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storageSet(STORAGE_KEYS.THEME, next);
  }

  /**
   * Read the saved theme preference from LocalStorage and apply it
   * before the first render to prevent a flash of the wrong theme.
   *
   * Falls back to the OS-level preference via prefers-color-scheme,
   * then to 'light' if no preference is available.
   */
  function loadTheme() {
    const saved = storageGet(STORAGE_KEYS.THEME, null);

    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved);
      return;
    }

    // No saved preference — respect OS setting
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  // ===========================================================
  // DOM REFERENCES
  // ===========================================================

  const form = document.getElementById('transaction-form');
  const fieldDesc = document.getElementById('transaction-description');
  const fieldAmount = document.getElementById('transaction-amount');
  const fieldCat = document.getElementById('transaction-category');
  const errDesc = document.getElementById('description-error');
  const errAmount = document.getElementById('amount-error');
  const errCat = document.getElementById('category-error');

  const customCatForm = document.getElementById('custom-category-form');
  const customCatInput = document.getElementById('custom-category-input');
  const customCatErr = document.getElementById('custom-category-error');

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
   * Parse the raw numeric value from the (possibly formatted) amount field.
   * Strips dot thousand-separators before converting to integer.
   * @returns {number}
   */
  function parseRawAmount() {
    return parseInt(fieldAmount.value.replace(/\./g, '').trim(), 10);
  }

  /**
   * Validate the amount field.
   * Rules: required, must be a number, must be > 0, whole numbers only.
   * @returns {boolean}
   */
  function validateAmount() {
    const raw = fieldAmount.value.replace(/\./g, '').trim();
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
    const descOk = validateDescription();
    const amountOk = validateAmount();
    const catOk = validateCategory();
    return descOk && amountOk && catOk;
  }

  // ===========================================================
  // CATEGORY MODULE
  // ===========================================================

  /**
   * Return the full merged category list for a given type (defaults + custom).
   * @param {'income'|'expense'} [type] - defaults to currently selected type
   * @returns {string[]}
   */
  function getAllCategories(type) {
    const t = type || getSelectedType();
    if (t === 'income') {
      return [...INCOME_CATEGORIES, ...state.categoriesIncome];
    }
    return [...EXPENSE_CATEGORIES, ...state.categoriesExpense];
  }

  /**
   * Rebuild the <select> options based on the currently selected type.
   * Resets the selection and re-renders the tag list.
   */
  function renderCategoryOptions() {
    const current = fieldCat.value;
    const cats = getAllCategories();

    // Remove all dynamic options (keep the placeholder)
    while (fieldCat.options.length > 1) {
      fieldCat.remove(1);
    }

    cats.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      fieldCat.appendChild(opt);
    });

    // Restore selection only if still valid for current type
    if (current && cats.includes(current)) {
      fieldCat.value = current;
    } else {
      fieldCat.value = '';
    }

    // Keep the tag list in sync whenever options rebuild
    renderCategoryTags();
  }

  /**
   * Render the visual tag list below the form.
   * Shows default (non-deletable) and custom (deletable) chips for current type.
   */
  function renderCategoryTags() {
    const container = document.getElementById('category-tag-list');
    if (!container) return;

    container.innerHTML = '';

    const type = getSelectedType();
    const defaults = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const customs = type === 'income' ? state.categoriesIncome : state.categoriesExpense;

    // Default categories — static, non-deletable chips
    defaults.forEach((cat, i) => {
      container.appendChild(buildCategoryTag(cat, i, false, type));
    });

    // Custom categories — deletable
    customs.forEach((cat, i) => {
      container.appendChild(buildCategoryTag(cat, defaults.length + i, true, type));
    });
  }

  /**
   * Build a single category tag <span> element.
   *
   * @param {string}  name       - category name
   * @param {number}  colorIndex - index into CHART_COLORS for the dot
   * @param {boolean} deletable  - whether to show a remove button
   * @param {string}  type       - 'income' or 'expense' (for data attribute)
   * @returns {HTMLElement}
   */
  function buildCategoryTag(name, colorIndex, deletable, type) {
    const tag = document.createElement('span');
    tag.className = 'category-tag' + (deletable ? ' category-tag--custom' : ' category-tag--default');
    if (type === 'income') tag.classList.add('category-tag--income-type');
    else tag.classList.add('category-tag--expense-type');

    // Colour dot using the same palette as the chart
    const dot = document.createElement('span');
    dot.className = 'category-tag__dot';
    dot.style.backgroundColor = getChartColor(colorIndex);
    dot.setAttribute('aria-hidden', 'true');
    tag.appendChild(dot);

    // Label
    const label = document.createElement('span');
    label.className = 'category-tag__label';
    label.textContent = name;
    tag.appendChild(label);

    // Delete button — only for custom categories
    if (deletable) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'category-tag__remove';
      btn.setAttribute('aria-label', `Remove category: ${name}`);
      btn.dataset.action = 'delete-category';
      btn.dataset.category = name;
      btn.dataset.catType = type;
      btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      tag.appendChild(btn);
    }

    return tag;
  }

  /**
   * Delete a custom category by name and type.
   * @param {string} name
   * @param {'income'|'expense'} type
   */
  function deleteCategory(name, type) {
    const list = type === 'income' ? state.categoriesIncome : state.categoriesExpense;
    const idx = list.indexOf(name);
    if (idx === -1) return;
    list.splice(idx, 1);
    persistState();
    renderCategoryOptions();   // rebuilds select + tag list
    renderExpenseChart();      // chart may need to drop this category's slice
    showToast(`Category "${name}" removed.`);
  }

  /**
   * Add a new custom category for the current type.
   * @param {string} name - already trimmed
   */
  function addCategory(name) {
    const type = getSelectedType();
    if (type === 'income') {
      state.categoriesIncome.push(name);
    } else {
      state.categoriesExpense.push(name);
    }
    persistState();
    renderCategoryOptions();   // rebuilds select + tag list
    renderExpenseChart();      // palette expands — redraw chart
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
      id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      description: fieldDesc.value.trim(),
      amount: parseRawAmount(),
      type,
      category: fieldCat.value,
      date: new Date().toISOString(),
    };
  }

  /**
   * Add a transaction to state and re-render the list.
   * @param {Transaction} txn
   */
  function addTransaction(txn) {
    state.transactions.push(txn);
    persistState();
    renderAll();
  }

  /**
   * Remove a transaction from state by id.
   * @param {string} id
   */
  function deleteTransaction(id) {
    const idx = state.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return;
    state.transactions.splice(idx, 1);
    persistState();
    renderAll();
    showToast('Transaction deleted.');
  }

  // ===========================================================
  // SORT MODULE
  // ===========================================================

  /**
   * Return a new array of transactions sorted according to state.sort.
   * Never mutates the original array.
   *
   * Supported fields:
   *   'date'     — by ISO date string (newest desc, oldest asc)
   *   'amount'   — by numeric amount (highest desc, lowest asc)
   *   'category' — alphabetically by category name (A→Z asc, Z→A desc)
   *
   * @param {Transaction[]} transactions
   * @returns {Transaction[]}
   */
  function sortTransactions(transactions) {
    const { field, dir } = state.sort;
    const multiplier = dir === 'asc' ? 1 : -1;

    return [...transactions].sort((a, b) => {
      let cmp = 0;

      if (field === 'date') {
        // ISO strings compare lexicographically — no Date() parsing needed
        cmp = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      } else if (field === 'amount') {
        cmp = a.amount - b.amount;
      } else if (field === 'category') {
        cmp = a.category.localeCompare(b.category, undefined, { sensitivity: 'base' });
      }

      // Secondary sort: newest first when primary values are equal
      if (cmp === 0 && field !== 'date') {
        cmp = a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
      }

      return cmp * multiplier;
    });
  }

  /**
   * Direction labels shown inside each sort button.
   * Indexed by [field][dir].
   */
  const SORT_LABELS = {
    date: { desc: 'Newest', asc: 'Oldest' },
    amount: { desc: 'Amount ↓', asc: 'Amount ↑' },
    category: { desc: 'Category Z→A', asc: 'Category A→Z' },
  };

  /**
   * Sync the sort button UI to state.sort.
   * - Active button: aria-pressed="true", btn--sort-active class
   * - Inactive buttons: aria-pressed="false", no active class
   * - Each button's text reflects the current direction label for that field
   */
  function renderSortControls() {
    const buttons = document.querySelectorAll('[data-sort-field]');

    buttons.forEach((btn) => {
      const field = btn.dataset.sortField;
      const isActive = field === state.sort.field;

      btn.setAttribute('aria-pressed', String(isActive));
      btn.classList.toggle('btn--sort-active', isActive);

      // Update text label — show current direction for active button,
      // default direction label for inactive buttons
      const dir = isActive ? state.sort.dir : btn.dataset.sortDir;
      const labels = SORT_LABELS[field];
      if (labels) {
        btn.textContent = labels[dir] || btn.textContent;
      }

      // Update data-sort-dir to reflect what the next click would toggle to
      if (isActive) {
        btn.dataset.sortDir = state.sort.dir === 'asc' ? 'desc' : 'asc';
      }
    });
  }

  /**
   * Handle a sort button click.
   * - If clicking the already-active field: toggle direction (asc ↔ desc).
   * - If clicking a different field: switch to that field, keeping its default dir.
   *
   * @param {MouseEvent} e
   */
  function handleSortClick(e) {
    const btn = e.target.closest('[data-sort-field]');
    if (!btn) return;

    const field = btn.dataset.sortField;

    if (field === state.sort.field) {
      // Toggle direction on the active field
      state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      // Switch to new field with its natural default direction
      const defaultDirs = { date: 'desc', amount: 'desc', category: 'asc' };
      state.sort = { field, dir: defaultDirs[field] || 'desc' };
    }

    persistState();
    renderSortControls();
    renderTransactionList();
  }

  // ===========================================================
  // CALCULATION MODULE
  // ===========================================================

  /**
   * @typedef {Object} Summary
   * @property {number} income   - sum of all income transactions
   * @property {number} expenses - sum of all expense transactions
   * @property {number} balance  - income minus expenses (can be negative)
   */

  /**
   * Compute income, expenses, and balance in a single pass over the
   * transactions array. Every caller uses this snapshot so the array
   * is never iterated more than once per UI update.
   *
   * @returns {Summary}
   */
  function computeSummary() {
    const totals = state.transactions.reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.income += t.amount;
        } else {
          acc.expenses += t.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0 }
    );

    totals.balance = totals.income - totals.expenses;
    return totals;
  }

  /**
   * Compute expense totals grouped by category for the chart.
   * Only expense transactions are included.
   *
   * @returns {{ labels: string[], values: number[] }}
   */
  function computeExpenseCategoryTotals() {
    const totalsByCategory = state.transactions.reduce((acc, txn) => {
      if (txn.type !== 'expense') return acc;
      acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
      return acc;
    }, {});

    const labels = Object.keys(totalsByCategory);
    const values = labels.map((label) => totalsByCategory[label]);

    return { labels, values };
  }

  // ===========================================================
  // RENDER MODULE
  // ===========================================================

  /**
   * Format a non-negative integer as Indonesian Rupiah without sign.
   * Used as the shared number-formatting primitive.
   *
   * @param {number} amount - absolute value expected
   * @returns {string}  e.g. "Rp 1.500.000"
   */
  function formatRupiah(amount) {
    return 'Rp\u00a0' + Math.abs(amount).toLocaleString('id-ID');
  }

  /**
   * Format a signed currency amount for display.
   * Positive values get a "+" prefix (used for income in transaction rows).
   * Negative values get a "−" prefix (used for balance when in deficit).
   * Zero shows no prefix.
   *
   * @param {number}  amount
   * @param {'sign'|'none'} [mode='none'] - 'sign' prepends +/− for non-zero values
   * @returns {string}
   */
  function formatCurrency(amount, mode = 'none') {
    const abs = formatRupiah(amount);
    if (mode === 'sign') {
      if (amount > 0) return '+\u00a0' + abs;
      if (amount < 0) return '−\u00a0' + abs;
    }
    if (amount < 0) return '−\u00a0' + abs;
    return abs;
  }

  /**
   * Format an ISO date string to a readable short form.
   * @param {string} iso
   * @returns {string}  e.g. "8 Jul 2026, 14:30"
   */
  function formatDate(iso) {
    return new Date(iso).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Map a category name to a Font Awesome icon HTML string.
   * @param {string} category
   * @returns {string}
   */
  function categoryIcon(category) {
    const icons = {
      // Income
      'Salary': 'fa-solid fa-briefcase',
      'Freelance': 'fa-solid fa-laptop-code',
      'Business': 'fa-solid fa-building',
      'Investment': 'fa-solid fa-chart-line',
      'Bonus': 'fa-solid fa-gift',
      'Gift': 'fa-solid fa-hand-holding-heart',
      'Side Income': 'fa-solid fa-lightbulb',
      'Rental': 'fa-solid fa-house',
      // Expense
      'Food & Drink': 'fa-solid fa-utensils',
      'Transport': 'fa-solid fa-car',
      'Shopping': 'fa-solid fa-bag-shopping',
      'Housing': 'fa-solid fa-house-chimney',
      'Entertainment': 'fa-solid fa-gamepad',
      'Health': 'fa-solid fa-heart-pulse',
      'Education': 'fa-solid fa-graduation-cap',
      'Utilities': 'fa-solid fa-bolt',
      'Subscription': 'fa-solid fa-credit-card',
      'Travel': 'fa-solid fa-plane',
    };
    const cls = icons[category] || 'fa-solid fa-tag';
    return `<i class="${cls}"></i>`;
  }

  /** Update the three summary card amounts from a single computed snapshot. */
  function renderSummaryCards() {
    const { income, expenses, balance } = computeSummary();

    const elBalance = document.getElementById('total-balance');
    const elIncome = document.getElementById('total-income');
    const elExpenses = document.getElementById('total-expenses');

    elBalance.textContent = formatCurrency(balance);
    elIncome.textContent = formatRupiah(income);
    elExpenses.textContent = formatRupiah(expenses);

    // Visual cue: tint the balance card red when the user is in deficit
    const balanceCard = elBalance.closest('.summary-card--balance');
    if (balanceCard) {
      balanceCard.classList.toggle('summary-card--negative', balance < 0);
    }
  }

  /** Render or update the expense pie chart based on current data. */
  function renderExpenseChart() {
    const canvas = document.getElementById('expense-chart');
    const emptyState = document.getElementById('chart-empty-state');

    if (!canvas || typeof Chart === 'undefined') {
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.textContent = 'Chart could not be loaded.';
      }
      return;
    }

    const { labels, values } = computeExpenseCategoryTotals();
    const hasData = values.length > 0;

    canvas.hidden = !hasData;
    emptyState.hidden = hasData;

    if (!hasData) {
      // Destroy stale chart if it exists so canvas is clean
      if (expenseChart) {
        expenseChart.destroy();
        expenseChart = null;
      }
      return;
    }

    // Read the current surface color from CSS variables so the border
    // between slices always matches the card background in both themes.
    const borderColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-surface').trim() || '#ffffff';

    const backgroundColors = labels.map((_, i) => getChartColor(i));

    if (expenseChart) {
      // Update in-place — smoother than destroy + recreate
      expenseChart.data.labels = labels;
      expenseChart.data.datasets[0].data = values;
      expenseChart.data.datasets[0].backgroundColor = backgroundColors;
      expenseChart.data.datasets[0].borderColor = borderColor;
      expenseChart.update();
      return;
    }

    // First render — create the instance
    expenseChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: backgroundColors,
          borderColor: borderColor,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              // Use CSS variable for legend text so it adapts to dark mode
              color: getComputedStyle(document.documentElement)
                .getPropertyValue('--color-text-secondary').trim(),
              padding: 16,
              boxWidth: 12,
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label(context) {
                const label = context.label || 'Unknown';
                const value = context.raw || 0;
                // Show percentage alongside the amount
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return ` ${label}: ${formatRupiah(value)} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  /**
   * Build and return a single transaction <li> node from the template.
   * @param {Transaction} txn
   * @returns {HTMLElement}
   */
  function createTransactionNode(txn) {
    const template = document.getElementById('transaction-item-template');
    const node = template.content.cloneNode(true);
    const li = node.querySelector('.transaction-item');

    li.dataset.id = txn.id;
    li.dataset.type = txn.type;

    li.querySelector('.transaction-item__icon').innerHTML = categoryIcon(txn.category);
    li.querySelector('.transaction-item__description').textContent = txn.description;

    const timeEl = li.querySelector('.transaction-item__date');
    timeEl.textContent = formatDate(txn.date);
    timeEl.dateTime = txn.date;

    li.querySelector('.transaction-item__category-badge').textContent = txn.category;

    const amountEl = li.querySelector('.transaction-item__amount');
    amountEl.textContent = formatCurrency(
      txn.type === 'income' ? txn.amount : -txn.amount,
      'sign'
    );

    // Attach delete button data
    const deleteBtn = li.querySelector('[data-action="delete-transaction"]');
    deleteBtn.dataset.id = txn.id;
    deleteBtn.setAttribute('aria-label', `Delete transaction: ${txn.description}`);

    return li;
  }

  /** Re-render the full transaction list from state. */
  function renderTransactionList() {
    const list = document.getElementById('transaction-list');
    const emptyState = document.getElementById('list-empty-state');

    list.innerHTML = '';

    if (state.transactions.length === 0) {
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    // Sort according to current state.sort config before rendering
    const sorted = sortTransactions(state.transactions);
    sorted.forEach((txn) => list.appendChild(createTransactionNode(txn)));
  }

  /**
   * Full UI refresh — always call this after any state mutation.
   * Centralises the render sequence so callers never forget a step.
   */
  function renderAll() {
    renderSortControls();
    renderTransactionList();
    renderSummaryCards();
    renderExpenseChart();
  }

  // ===========================================================
  // FORM RESET
  // ===========================================================

  /** Clear all form fields and validation states after successful submission. */
  function resetForm() {
    form.reset();
    clearFieldState(fieldDesc, errDesc);
    clearFieldState(fieldAmount, errAmount);
    clearFieldState(fieldCat, errCat);
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

    // Amount — live formatting with dot thousand-separators
    fieldAmount.addEventListener('input', () => {
      const el = fieldAmount;
      const raw = el.value.replace(/\./g, '').replace(/\D/g, ''); // digits only
      const selStart = el.selectionStart;
      const prevLen = el.value.length;

      if (raw === '') {
        el.value = '';
      } else {
        // Format: add dots every 3 digits from the right
        el.value = Number(raw).toLocaleString('id-ID');
      }

      // Adjust caret: compensate for inserted/removed dot characters
      const newLen = el.value.length;
      const caretAdj = newLen - prevLen;
      const newCaret = Math.max(0, selStart + caretAdj);
      el.setSelectionRange(newCaret, newCaret);

      // Run validation once field has been touched
      if (el.classList.contains('is-invalid') || el.classList.contains('is-valid')) {
        validateAmount();
      }
    });

    fieldAmount.addEventListener('blur', () => validateAmount(), { once: false });

    // Prevent non-numeric keys (allow: digits, Backspace, Delete, Tab, arrows, Home/End)
    fieldAmount.addEventListener('keydown', (e) => {
      const allowed = [
        'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End',
      ];
      if (allowed.includes(e.key)) return;
      if (e.ctrlKey || e.metaKey) return; // allow Ctrl+A/C/V/X
      if (!/^\d$/.test(e.key)) e.preventDefault();
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
    const type = getSelectedType();

    // Validation
    if (name === '') {
      customCatErr.textContent = 'Category name cannot be empty.';
      customCatInput.classList.add('is-invalid');
      customCatInput.focus();
      return;
    }

    const exists = getAllCategories(type).some(
      (c) => c.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      customCatErr.textContent = `"${name}" already exists for ${type}.`;
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
    showToast(`Category "${name}" added to ${type}.`);
  }

  /**
   * Handle delete-category clicks via event delegation on the tag container.
   * @param {MouseEvent} e
   */
  function handleCategoryTagClick(e) {
    const btn = e.target.closest('[data-action="delete-category"]');
    if (!btn) return;
    const name = btn.dataset.category;
    const catType = btn.dataset.catType || getSelectedType();
    if (name) deleteCategory(name, catType);
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
    // Apply saved theme before first render — prevents flash of wrong theme
    loadTheme();

    // Hydrate state from LocalStorage before anything renders
    loadState();

    // Populate category <select> with defaults + any persisted custom categories
    renderCategoryOptions();

    // Render list + summary cards together via the unified render pipeline
    renderAll();

    // Attach events
    form.addEventListener('submit', handleFormSubmit);
    customCatForm.addEventListener('submit', handleCustomCategorySubmit);
    document.getElementById('transaction-list').addEventListener('click', handleListClick);
    document.getElementById('category-tag-list').addEventListener('click', handleCategoryTagClick);
    document.querySelector('[data-action="toggle-theme"]').addEventListener('click', toggleTheme);
    document.querySelector('.sort-controls').addEventListener('click', handleSortClick);
    bindLiveValidation();

    // Re-render category dropdown when Income/Expense type changes
    document.querySelectorAll('input[name="transaction-type"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        renderCategoryOptions();
        // Reset validation state on category field when type changes
        clearFieldState(fieldCat, errCat);
      });
    });
  }

  // Kick off when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
