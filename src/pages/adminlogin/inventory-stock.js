/* Fleurs Kiosk — Inventory & Stock module
   Add <script src="inventory-stock.js"></script> after admen.js in admin.html.
   Requires the existing admin Supabase client to be available as window.sb or window.supabaseClient.
   This module injects its own Inventory & Stock navigation and page. */
(() => {
  'use strict';

  const LOW_STOCK_MAX = 2;
  const $ = (id) => document.getElementById(id);

  const esc = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[ch]);

  const peso = (value) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(Number(value) || 0);

  let supabase = window.sb || window.supabaseClient || null;
  let products = [];
  let busy = false;

  function toast(message, type = 'info') {
    const existing = $('toast');

    if (existing) {
      existing.textContent = message;
      existing.style.background =
        type === 'error' ? '#a93f4c' :
        type === 'success' ? '#347756' :
        '#36303b';

      existing.classList.remove('hidden');

      clearTimeout(toast._timer);

      toast._timer = setTimeout(() => {
        existing.classList.add('hidden');
      }, 3600);
    } else {
      alert(message);
    }
  }

  function getClient() {
    supabase = window.sb || window.supabaseClient || supabase;

    if (!supabase || typeof supabase.from !== 'function') {
      throw new Error(
        'Supabase client is not available. Load this module after admen.js has initialized.'
      );
    }

    return supabase;
  }

  function injectStyles() {
    if ($('inventoryModuleStyles')) return;

    const style = document.createElement('style');
    style.id = 'inventoryModuleStyles';

    style.textContent = `
      .inv-stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin: 16px 0;
      }

      .inv-stat {
        background: var(--card, #fff);
        border: 1px solid var(--line, #eee);
        border-radius: 14px;
        padding: 16px;
      }

      .inv-stat span {
        display: block;
        color: var(--muted, #777);
        font-size: .82rem;
        margin-bottom: 8px;
      }

      .inv-stat strong {
        font-size: 1.5rem;
      }

      .inv-toolbar {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin: 14px 0;
      }

      .inv-toolbar input,
      .inv-toolbar select {
        min-height: 42px;
        padding: 9px 12px;
        border: 1px solid var(--line, #ddd);
        border-radius: 10px;
        background: var(--card, #fff);
        color: inherit;
      }

      .inv-toolbar input {
        flex: 1;
        min-width: 190px;
      }

      .inv-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .inv-btn {
        border: 1px solid #e4c4ce;
        background: #fff7fa;
        color: #7d193e;
        border-radius: 8px;
        padding: 7px 10px;
        cursor: pointer;
        font-weight: 700;
      }

      .inv-btn:disabled {
        opacity: .5;
        cursor: wait;
      }

      .inv-stock {
        font-weight: 800;
        white-space: nowrap;
      }

      .inv-stock.low { color: #a36b00; }
      .inv-stock.none { color: #b42332; }
      .inv-stock.high { color: #28754b; }

      .inv-state {
        display: inline-block;
        border-radius: 999px;
        padding: 4px 9px;
        font-size: .78rem;
        font-weight: 700;
        background: #eee;
        color: #555;
      }

      .inv-state.low {
        background: #fff0cf;
        color: #8a5b00;
      }

      .inv-state.none {
        background: #ffe2e4;
        color: #a31d2b;
      }

      .inv-state.high {
        background: #dff5e8;
        color: #216b43;
      }

      @media (max-width: 800px) {
        .inv-stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .inv-table-wrap {
          overflow-x: auto;
        }

        .inv-table-wrap table {
          min-width: 700px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function injectPage() {
    if (!$('page-inventory')) {
      const page = document.createElement('section');

      page.id = 'page-inventory';
      page.className = 'page hidden';

      page.innerHTML = `
        <div class="row between" style="gap:12px;flex-wrap:wrap">
          <div>
            <h2 style="margin:0">Inventory &amp; Stock</h2>
            <p class="muted" style="margin:6px 0 0">
              Monitor available units and manually adjust stock.
            </p>
          </div>

          <button class="btn" id="inventoryRefresh" type="button">
            ↻ Refresh stock
          </button>
        </div>

        <div class="inv-stats">
          <div class="inv-stat">
            <span>Active products</span>
            <strong id="inventoryTotalProducts">0</strong>
          </div>

          <div class="inv-stat">
            <span>Total units in stock</span>
            <strong id="inventoryTotalUnits">0</strong>
          </div>

          <div class="inv-stat">
            <span>Low stock (1–2)</span>
            <strong id="inventoryLowStock">0</strong>
          </div>

          <div class="inv-stat">
            <span>Out of stock</span>
            <strong id="inventoryOutOfStock">0</strong>
          </div>
        </div>

        <div class="card" style="padding:16px">
          <div class="inv-toolbar">
            <input
              id="inventorySearch"
              type="search"
              placeholder="Search product name or ID…"
              aria-label="Search inventory"
            >

            <select id="inventoryCategory" aria-label="Filter by category">
              <option value="">All categories</option>
            </select>

            <select id="inventoryStatus" aria-label="Filter by stock status">
              <option value="">All stock levels</option>
              <option value="none">Out of stock</option>
              <option value="low">Low stock</option>
              <option value="high">In stock</option>
            </select>
          </div>

          <div id="inventoryTable" class="inv-table-wrap">
            <div class="empty">Loading inventory…</div>
          </div>
        </div>
      `;

      const app = $('app');

      if (!app) return;

      app.appendChild(page);
    }

    if (!$('inventoryNavButton')) {
      const nav = document.createElement('button');

      nav.id = 'inventoryNavButton';
      nav.type = 'button';
      nav.className = 'nav-btn';
      nav.dataset.page = 'inventory';

      nav.innerHTML = `
        <span>📦</span>
        <span>Inventory &amp; Stock</span>
      `;

      const navContainer =
        document.querySelector('.nav-btn[data-page]')?.parentElement;

      if (navContainer) {
        navContainer.appendChild(nav);
      }

      nav.addEventListener('click', () => showInventoryPage());
    }
  }

  function status(stock) {
    if (stock <= 0) {
      return { key: 'none', label: 'Out of stock' };
    }

    if (stock <= LOW_STOCK_MAX) {
      return { key: 'low', label: 'Low stock' };
    }

    return { key: 'high', label: 'In stock' };
  }

  function render() {
    if (!$('page-inventory')) return;

    const active = products.filter(p => p.is_active !== false);

    const totalUnits = active.reduce(
      (sum, p) => sum + Math.max(0, Number(p.stock) || 0),
      0
    );

    $('inventoryTotalProducts').textContent =
      active.length.toLocaleString();

    $('inventoryTotalUnits').textContent =
      totalUnits.toLocaleString();

    $('inventoryLowStock').textContent =
      active.filter(p =>
        Number(p.stock) > 0 &&
        Number(p.stock) <= LOW_STOCK_MAX
      ).length.toLocaleString();

    $('inventoryOutOfStock').textContent =
      active.filter(p => Number(p.stock) <= 0)
        .length.toLocaleString();

    const categorySelect = $('inventoryCategory');
    const oldCategory = categorySelect.value;

    const categories = [
      ...new Set(
        products.map(p => String(p.category || 'Other').trim() || 'Other')
      )
    ].sort();

    categorySelect.innerHTML =
      '<option value="">All categories</option>' +
      categories.map(c =>
        `<option value="${esc(c)}">${esc(c)}</option>`
      ).join('');

    if (categories.includes(oldCategory)) {
      categorySelect.value = oldCategory;
    }

    const search = $('inventorySearch').value.trim().toLowerCase();
    const category = categorySelect.value;
    const stockFilter = $('inventoryStatus').value;

    const filtered = products.filter(p => {
      const stock = Math.max(0, Number(p.stock) || 0);
      const s = status(stock);

      const matchesText =
        !search ||
        [p.name, p.id, p.description, p.category]
          .join(' ')
          .toLowerCase()
          .includes(search);

      return (
        matchesText &&
        (!category || String(p.category || 'Other') === category) &&
        (!stockFilter || s.key === stockFilter)
      );
    }).sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''))
    );

    if (!filtered.length) {
      $('inventoryTable').innerHTML =
        '<div class="empty">No products match these filters.</div>';
      return;
    }

    $('inventoryTable').innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${filtered.map(p => {
            const stock = Math.max(0, Number(p.stock) || 0);
            const s = status(stock);

            const disabled =
              p.is_active === false
                ? ' disabled title="Inactive product"'
                : '';

            return `
              <tr>
                <td>
                  <strong>${esc(p.name || p.id)}</strong>
                  <div class="muted small">ID: ${esc(p.id)}</div>
                </td>

                <td>${esc(p.category || 'Other')}</td>

                <td>${esc(peso(p.price))}</td>

                <td>
                  <span class="inv-stock ${s.key}">${stock}</span>
                </td>

                <td>
                  <span class="inv-state ${s.key}">${s.label}</span>
                  ${p.is_active === false
                    ? '<div class="muted small">Inactive</div>'
                    : ''}
                </td>

                <td>
                  <div class="inv-actions">
                    <button
                      class="inv-btn"
                      data-inv-action="add"
                      data-product-id="${esc(p.id)}"
                      ${disabled}
                    >＋ Add</button>

                    <button
                      class="inv-btn"
                      data-inv-action="reduce"
                      data-product-id="${esc(p.id)}"
                      ${disabled || (stock === 0 ? ' disabled' : '')}
                    >− Reduce</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  async function load() {
    try {
      $('inventoryTable').innerHTML =
        '<div class="empty">Loading inventory…</div>';

      const { data, error } = await getClient()
        .from('products')
        .select(
          'id,name,category,description,price,stock,is_active,created_at'
        )
        .order('name')
        .limit(2000);

      if (error) throw error;

      products = data || [];

      render();
    } catch (error) {
      console.error('Inventory load failed:', error);

      $('inventoryTable').innerHTML = `
        <div class="notice error">
          Could not load products: ${esc(error.message || error)}
        </div>
      `;

      toast(
        'Could not load inventory. Check Supabase permissions.',
        'error'
      );
    }
  }

  async function adjust(productId, action) {
    if (busy) return;

    const product = products.find(
      p => String(p.id) === String(productId)
    );

    if (!product) {
      return toast(
        'Product not found. Refresh inventory and try again.',
        'error'
      );
    }

    const current = Math.max(0, Number(product.stock) || 0);

    if (action === 'reduce' && current <= 0) {
      return toast(
        'This product is already out of stock.',
        'error'
      );
    }

    const verb = action === 'add' ? 'add to' : 'reduce from';

    const raw = prompt(
      `How many units do you want to ${verb} “${product.name}”?`,
      '1'
    );

    if (raw === null) return;

    const amount = Number(raw);

    if (!Number.isSafeInteger(amount) || amount < 1) {
      return toast(
        'Enter a whole number greater than zero.',
        'error'
      );
    }

    if (action === 'reduce' && amount > current) {
      return toast(
        `Cannot reduce ${amount} units. Current stock is ${current}.`,
        'error'
      );
    }

    const next =
      action === 'add'
        ? current + amount
        : current - amount;

    if (!Number.isSafeInteger(next) || next < 0) {
      return toast('That stock quantity is invalid.', 'error');
    }

    if (!confirm(
      `${product.name}\nStock: ${current} → ${next}\n\nConfirm this adjustment?`
    )) {
      return;
    }

    busy = true;
    render();

    try {
      // Compare-and-set avoids overwriting a stock value
      // changed since it was loaded.
      const { data, error } = await getClient()
        .from('products')
        .update({ stock: next })
        .eq('id', product.id)
        .eq('stock', current)
        .select('id,stock')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          'Stock changed in another session. Refresh inventory and try again.'
        );
      }

      product.stock = Number(data.stock);

      render();

      toast(
        `Stock updated: ${product.name} now has ${data.stock} unit(s).`,
        'success'
      );
    } catch (error) {
      console.error('Stock adjustment failed:', error);

      toast(
        `Could not update stock: ${error.message || error}. Check the products UPDATE policy for staff.`,
        'error'
      );

      await load();
    } finally {
      busy = false;
      render();
    }
  }

  function showInventoryPage() {
    document.querySelectorAll('.page').forEach(el => {
      el.classList.add('hidden');
    });

    $('page-inventory')?.classList.remove('hidden');

    document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
      btn.classList.toggle(
        'active',
        btn.dataset.page === 'inventory'
      );
    });

    if ($('topTitle')) {
      $('topTitle').textContent = 'Inventory & Stock';
    }

    $('sidebar')?.classList.remove('open');

    load();
  }

  function init() {
    injectStyles();
    injectPage();

    if (!$('page-inventory')) return;

    $('inventoryRefresh').addEventListener('click', load);
    $('inventorySearch').addEventListener('input', render);
    $('inventoryCategory').addEventListener('change', render);
    $('inventoryStatus').addEventListener('change', render);

    $('inventoryTable').addEventListener('click', event => {
      const button = event.target.closest('[data-inv-action]');

      if (button) {
        adjust(
          button.dataset.productId,
          button.dataset.invAction
        );
      }
    });

    // Handle navigation clicks even if the original admin
    // navigation is initialized after this module.
    document.addEventListener('click', event => {
      const button = event.target.closest(
        '.nav-btn[data-page="inventory"]'
      );

      if (button) {
        showInventoryPage();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {
      once: true
    });
  } else {
    init();
  }
})();