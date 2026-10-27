
/* Fleurs Admin — Standalone Inventory CRUD
   Add this script AFTER admen.js in admin.html.
   Uses window.adminSupabase, created by admen.js.
   Deactivate instead of hard-delete to protect historical orders.
*/
(() => {
  "use strict";

  const PAGE_ID = "page-inventory-crud";
  const NAV_ID = "inventoryCrudNavButton";

  let sb = null;
  let products = [];
  let editingId = null;
  let busy = false;
  let channel = null;

  const $ = (selector, root = document) => root.querySelector(selector);

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);

  function getClient() {
    return window.adminSupabase ||
      window.sb ||
      window.supabaseClient ||
      null;
  }

  function injectStyles() {
    if ($("#inventoryCrudStyles")) return;

    const style = document.createElement("style");
    style.id = "inventoryCrudStyles";
    style.textContent = `
      #${PAGE_ID} {
        padding: 24px;
        color: var(--text-color, #222);
        font-family: inherit;
      }
      #${PAGE_ID} .ic-head {
        display:flex; gap:12px; align-items:center;
        justify-content:space-between; flex-wrap:wrap;
        margin-bottom:18px;
      }
      #${PAGE_ID} .ic-actions {
        display:flex; gap:8px; flex-wrap:wrap;
      }
      #${PAGE_ID} button,
      #${PAGE_ID} input,
      #${PAGE_ID} select,
      #${PAGE_ID} textarea { font:inherit; }
      #${PAGE_ID} .ic-btn {
        border:1px solid #ddd; border-radius:9px;
        padding:9px 13px; cursor:pointer;
        background:#fff; color:#222;
      }
      #${PAGE_ID} .ic-primary {
        background:#246b50; color:#fff; border-color:#246b50;
      }
      #${PAGE_ID} .ic-danger { color:#a32626; }
      #${PAGE_ID} .ic-filters {
        display:flex; gap:10px; flex-wrap:wrap; margin:14px 0;
      }
      #${PAGE_ID} .ic-field {
        display:flex; flex-direction:column; gap:5px;
        min-width:150px; flex:1;
      }
      #${PAGE_ID} .ic-field input,
      #${PAGE_ID} .ic-field select,
      #${PAGE_ID} .ic-field textarea {
        width:100%; box-sizing:border-box;
        border:1px solid #d8d8d8; border-radius:8px;
        padding:10px; background:#fff; color:#222;
      }
      #${PAGE_ID} .ic-table-wrap {
        overflow:auto; border:1px solid #e7e7e7;
        border-radius:12px; background:#fff;
      }
      #${PAGE_ID} table {
        border-collapse:collapse; width:100%; min-width:760px;
      }
      #${PAGE_ID} th, #${PAGE_ID} td {
        text-align:left; padding:11px 12px;
        border-bottom:1px solid #eee; vertical-align:middle;
      }
      #${PAGE_ID} th {
        background:#f8f8f8; font-size:12px;
        text-transform:uppercase; letter-spacing:.04em;
      }
      #${PAGE_ID} .ic-muted { color:#777; font-size:13px; }
      #${PAGE_ID} .ic-status {
        display:inline-block; border-radius:20px;
        padding:4px 8px; background:#e8f5ed;
        color:#21643c; font-size:12px;
      }
      #${PAGE_ID} .ic-status.off {
        background:#f3eeee; color:#8b3333;
      }
      #${PAGE_ID} .ic-notice {
        padding:10px 12px; border-radius:8px;
        margin:10px 0; background:#f4f7f5;
      }
      #${PAGE_ID} .ic-notice.error {
        background:#fff0f0; color:#8b2222;
      }
      #${PAGE_ID} .ic-form {
        display:none; border:1px solid #e5e5e5;
        border-radius:12px; padding:16px;
        margin:12px 0 18px; background:#fff;
      }
      #${PAGE_ID} .ic-form.open { display:block; }
      #${PAGE_ID} .ic-form-grid {
        display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;
      }
      #${PAGE_ID} .ic-form .wide { grid-column:1/-1; }
      #${PAGE_ID} .ic-form-footer {
        display:flex; gap:8px; justify-content:flex-end;
        margin-top:14px;
      }
      @media(max-width:650px) {
        #${PAGE_ID} { padding:14px; }
        #${PAGE_ID} .ic-form-grid { grid-template-columns:1fr; }
        #${PAGE_ID} .ic-form .wide { grid-column:auto; }
      }
    `;
    document.head.appendChild(style);
  }

  function findSidebar() {
    return document.querySelector(".sidebar nav") ||
      document.querySelector("aside nav") ||
      document.querySelector(".sidebar") ||
      document.querySelector("aside");
  }

  function addNavigation() {
    if ($("#" + NAV_ID)) return;

    const sidebar = findSidebar();
    if (!sidebar) return;

    const button = document.createElement("button");
    button.id = NAV_ID;
    button.type = "button";
    button.textContent = "▦ Inventory CRUD";
    button.style.cssText =
      "display:block;width:100%;text-align:left;padding:12px 16px;" +
      "border:0;background:transparent;color:inherit;cursor:pointer;" +
      "font:inherit;border-radius:8px";

    button.addEventListener("click", showPage);
    sidebar.appendChild(button);
  }

  function ensurePage() {
    if ($("#" + PAGE_ID)) return;

    const page = document.createElement("section");
    page.id = PAGE_ID;
    page.style.display = "none";

    page.innerHTML = `
      <div class="ic-head">
        <div>
          <h2 style="margin:0">Inventory CRUD</h2>
          <div class="ic-muted">
            Manage products separately from the existing inventory page.
          </div>
        </div>
        <div class="ic-actions">
          <button class="ic-btn" type="button" data-ic-refresh>
            ↻ Refresh
          </button>
          <button class="ic-btn ic-primary" type="button" data-ic-add>
            ＋ Add Product
          </button>
        </div>
      </div>

      <div data-ic-notice class="ic-notice" role="status">
        Loading products…
      </div>

      <form class="ic-form" data-ic-form>
        <h3 data-ic-form-title style="margin-top:0">Add product</h3>

        <div class="ic-form-grid">
          <label class="ic-field">
            Product name *
            <input name="name" required maxlength="160">
          </label>

          <label class="ic-field">
            Category *
            <select name="category" required>
              <option value="">Choose category</option>
              <option>Solo</option>
              <option>Triple</option>
              <option>Bouquet</option>
              <option>Other</option>
            </select>
          </label>

          <label class="ic-field">
            Price (₱) *
            <input name="price" type="number" min="0"
              step="0.01" required>
          </label>

          <label class="ic-field">
            Stock quantity *
            <input name="stock" type="number" min="0"
              step="1" required>
          </label>

          <label class="ic-field wide">
            Description
            <textarea name="description" rows="3" maxlength="2000"></textarea>
          </label>

          <label class="ic-field wide">
            Image URL (optional)
            <input name="image_url" type="url" placeholder="https://…">
            <span class="ic-muted">
              Enter an image URL. This form does not upload image files.
            </span>
          </label>

          <label style="display:flex;align-items:center;gap:8px">
            <input name="is_active" type="checkbox" checked>
            Active / visible in store
          </label>
        </div>

        <div class="ic-form-footer">
          <button class="ic-btn" type="button" data-ic-cancel>
            Cancel
          </button>
          <button class="ic-btn ic-primary" type="submit" data-ic-save>
            Save product
          </button>
        </div>
      </form>

      <div class="ic-filters">
        <label class="ic-field">
          Search
          <input data-ic-search placeholder="Search name or description">
        </label>

        <label class="ic-field">
          Category
          <select data-ic-category>
            <option value="">All categories</option>
          </select>
        </label>

        <label class="ic-field">
          Status
          <select data-ic-status>
            <option value="">All products</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <div class="ic-table-wrap">
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
          <tbody data-ic-rows>
            <tr><td colspan="6">Loading…</td></tr>
          </tbody>
        </table>
      </div>
      <p class="ic-muted" data-ic-count></p>
    `;

    const main =
      document.querySelector("main") ||
      document.querySelector(".main-content") ||
      document.querySelector("#mainContent") ||
      document.body;

    main.appendChild(page);

    $("[data-ic-add]", page).addEventListener("click", () => openForm(null));
    $("[data-ic-refresh]", page).addEventListener("click", loadProducts);
    $("[data-ic-cancel]", page).addEventListener("click", closeForm);
    $("[data-ic-form]", page).addEventListener("submit", saveProduct);
    $("[data-ic-search]", page).addEventListener("input", renderRows);
    $("[data-ic-category]", page).addEventListener("change", renderRows);
    $("[data-ic-status]", page).addEventListener("change", renderRows);
    $("[data-ic-rows]", page).addEventListener("click", handleRowAction);
  }

  function notice(message, error = false) {
    const el = $("[data-ic-notice]", $("#" + PAGE_ID));
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("error", error);
  }

  function showPage() {
    ensurePage();

    document.querySelectorAll("[id^='page-']").forEach(page => {
      page.style.display = page.id === PAGE_ID ? "block" : "none";
    });

    document.querySelectorAll(
      ".sidebar .active, aside .active, nav .active"
    ).forEach(el => el.classList.remove("active"));

    $("#" + NAV_ID)?.classList.add("active");

    const title =
      $("#pageTitle") ||
      $(".page-title") ||
      document.querySelector("header h1");

    if (title) title.textContent = "Inventory CRUD";

    loadProducts();
  }

  async function loadProducts() {
    sb = getClient();

    if (!sb) {
      notice(
        "Supabase client not found. Make sure admen.js loads before inventory-crud.js.",
        true
      );
      return;
    }

    notice("Loading products…");

    const { data, error } = await sb
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      notice("Could not load products: " + error.message, true);
      return;
    }

    products = data || [];

    const categorySelect = $("[data-ic-category]", $("#" + PAGE_ID));
    const currentCategory = categorySelect.value;
    const categories = [
      ...new Set(products.map(p => p.category).filter(Boolean))
    ].sort();

    categorySelect.innerHTML =
      '<option value="">All categories</option>' +
      categories.map(c =>
        `<option value="${esc(c)}">${esc(c)}</option>`
      ).join("");

    categorySelect.value = categories.includes(currentCategory)
      ? currentCategory
      : "";

    renderRows();
    notice(`${products.length} product(s) loaded.`);
    setupRealtime();
  }

  function renderRows() {
    const tbody = $("[data-ic-rows]", $("#" + PAGE_ID));
    if (!tbody) return;

    const search = (
      $("[data-ic-search]", $("#" + PAGE_ID)).value || ""
    ).trim().toLowerCase();

    const category = $("[data-ic-category]", $("#" + PAGE_ID)).value;
    const status = $("[data-ic-status]", $("#" + PAGE_ID)).value;

    const rows = products.filter(p => {
      const matchesSearch = !search ||
        `${p.name || ""} ${p.description || ""}`
          .toLowerCase().includes(search);

      const matchesCategory = !category || p.category === category;
      const active = p.is_active !== false;
      const matchesStatus = !status ||
        (status === "active" ? active : !active);

      return matchesSearch && matchesCategory && matchesStatus;
    });

    tbody.innerHTML = rows.length ? rows.map(p => {
      const active = p.is_active !== false;

      return `
        <tr>
          <td>
            <strong>${esc(p.name || "Unnamed product")}</strong>
            <div class="ic-muted">${esc(p.description || "")}</div>
          </td>
          <td>${esc(p.category || "—")}</td>
          <td>₱${Number(p.price || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</td>
          <td>${Number(p.stock || 0)}</td>
          <td>
            <span class="ic-status ${active ? "" : "off"}">
              ${active ? "Active" : "Inactive"}
            </span>
          </td>
          <td>
            <div class="ic-actions">
              <button class="ic-btn" data-ic-edit="${esc(p.id)}"
                type="button">Edit</button>
              <button class="ic-btn ic-danger"
                data-ic-toggle="${esc(p.id)}"
                data-active="${active ? "1" : "0"}"
                type="button">
                ${active ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("") : '<tr><td colspan="6">No matching products found.</td></tr>';

    $("[data-ic-count]", $("#" + PAGE_ID)).textContent =
      `Showing ${rows.length} of ${products.length} products.`;
  }

  function openForm(id) {
    const form = $("[data-ic-form]", $("#" + PAGE_ID));
    editingId = id;
    form.reset();
    form.elements.is_active.checked = true;

    const product = id == null
      ? null
      : products.find(p => String(p.id) === String(id));

    if (product) {
      form.elements.name.value = product.name || "";
      form.elements.category.value = product.category || "";

      if (
        product.category &&
        ![...form.elements.category.options].some(
          option => option.value === product.category
        )
      ) {
        const option = document.createElement("option");
        option.value = product.category;
        option.textContent = product.category;
        form.elements.category.appendChild(option);
        form.elements.category.value = product.category;
      }

      form.elements.price.value = product.price ?? 0;
      form.elements.stock.value = product.stock ?? 0;
      form.elements.description.value = product.description || "";
      form.elements.image_url.value =
        product.image_url || product.image || "";
      form.elements.is_active.checked = product.is_active !== false;
    }

    $("[data-ic-form-title]", form).textContent =
      product ? "Edit product" : "Add product";

    $("[data-ic-save]", form).textContent =
      product ? "Save changes" : "Create product";

    form.classList.add("open");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeForm() {
    $("[data-ic-form]", $("#" + PAGE_ID)).classList.remove("open");
    editingId = null;
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (busy) return;

    sb = getClient();
    if (!sb) return notice("Supabase client is unavailable.", true);

    const form = event.currentTarget;
    const fd = new FormData(form);

    const name = String(fd.get("name") || "").trim();
    const category = String(fd.get("category") || "").trim();
    const price = Number(fd.get("price"));
    const stock = Number(fd.get("stock"));

    if (
      !name || !category ||
      !Number.isFinite(price) || price < 0 ||
      !Number.isInteger(stock) || stock < 0
    ) {
      return notice(
        "Check required fields. Price must be non-negative and stock must be a whole number.",
        true
      );
    }

    const payload = {
      name,
      category,
      description: String(fd.get("description") || "").trim(),
      price,
      stock,
      is_active: form.elements.is_active.checked
    };

    const imageUrl = String(fd.get("image_url") || "").trim();
    const existing = editingId == null
      ? null
      : products.find(p => String(p.id) === String(editingId));

    if (imageUrl) {
      if (existing && "image" in existing && !("image_url" in existing)) {
        payload.image = imageUrl;
      } else {
        payload.image_url = imageUrl;
      }
    }

    const wasEditing = editingId != null;
    const savedId = editingId;

    busy = true;
    const saveButton = $("[data-ic-save]", form);
    saveButton.disabled = true;
    notice("Saving product…");

    try {
      const result = wasEditing
        ? await sb.from("products").update(payload).eq("id", savedId)
        : await sb.from("products").insert(payload);

      if (result.error) throw result.error;

      closeForm();
      await loadProducts();
      notice(wasEditing ? "Product updated." : "Product created.");
    } catch (error) {
      notice(
        `Save failed: ${error.message || error}. Check your products table columns and Supabase permissions.`,
        true
      );
    } finally {
      busy = false;
      saveButton.disabled = false;
    }
  }

  async function handleRowAction(event) {
    const editButton = event.target.closest("[data-ic-edit]");
    const toggleButton = event.target.closest("[data-ic-toggle]");

    if (editButton) return openForm(editButton.dataset.icEdit);
    if (!toggleButton || busy) return;

    const id = toggleButton.dataset.icToggle;
    const product = products.find(p => String(p.id) === String(id));
    if (!product) return;

    const currentlyActive = toggleButton.dataset.active === "1";
    const action = currentlyActive ? "deactivate" : "reactivate";

    if (!confirm(
      `${action} "${product.name}"? ` +
      (currentlyActive
        ? "This hides the product from active listings and preserves historical orders."
        : "This activates the product again.")
    )) return;

    sb = getClient();
    if (!sb) return notice("Supabase client is unavailable.", true);

    busy = true;

    try {
      const { error } = await sb
        .from("products")
        .update({ is_active: !currentlyActive })
        .eq("id", id);

      if (error) throw error;

      await loadProducts();
      notice(`Product ${currentlyActive ? "deactivated" : "reactivated"}.`);
    } catch (error) {
      notice(`Could not ${action} product: ${error.message || error}`, true);
    } finally {
      busy = false;
    }
  }

  function setupRealtime() {
    sb = getClient();
    if (!sb || !sb.channel) return;

    if (channel) {
      try { sb.removeChannel(channel); } catch (_) {}
      channel = null;
    }

    channel = sb
      .channel("inventory-crud-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => loadProducts()
      )
      .subscribe();
  }

  function init() {
    injectStyles();
    ensurePage();
    addNavigation();

    if (!getClient()) {
      let attempts = 0;

      const clientTimer = setInterval(() => {
        attempts++;
        sb = getClient();

        if (sb || attempts >= 40) {
          clearInterval(clientTimer);

          if (sb) loadProducts();
          else notice(
            "Supabase client not found. Make sure admen.js loads first.",
            true
          );
        }
      }, 250);
    } else {
      loadProducts();
    }

    let navAttempts = 0;
    const navTimer = setInterval(() => {
      addNavigation();
      navAttempts++;

      if ($("#" + NAV_ID) || navAttempts >= 20) {
        clearInterval(navTimer);
      }
    }, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
