(() => {
  "use strict";

  const SUPABASE_URL =
    "https://ylkrjvmwwuhitqmysrxf.supabase.co";

  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsa3Jqdm13d3VoaXRxbXlzcnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjAyMTIsImV4cCI6MjEwNjU5NjIxMn0.CyrwrASzk3EAJ5ChSgSGExl0qffdXOHkzg1_o7lPCFA";

  const ORDERS_TABLE = "orders";
  const ITEMS_RELATION = "order_items";
  const RATINGS_RPC = "get_ratings";
  const PROOF_BUCKET = "order-proofs";
  const CURRENCY = "PHP";

  const LOGO_FILE = "kiosk.jpg";
  const LOGO_TEXT_FILE = "logo-text.png";
  const SHOW_BRAND_TEXT = true;

  const LOW_MAX_UNITS = 2;

  const unitLevel = units =>
    units <= 0 ? "none" :
    units <= LOW_MAX_UNITS ? "low" : "high";

  const DAY_MS = 86400000;

  const startOfDay = d =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const addDays = (d, n) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

  const $ = id => document.getElementById(id);

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);

  const first = (obj, keys, fallback = "") => {
    for (const key of keys) {
      if (
        obj &&
        obj[key] !== undefined &&
        obj[key] !== null &&
        obj[key] !== ""
      ) {
        return obj[key];
      }
    }

    return fallback;
  };

  const money = value => new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: CURRENCY
  }).format(Number(value) || 0);

  const dateValue = value => {
    if (!value) return null;

    const d = new Date(value);

    return Number.isNaN(d.getTime()) ? null : d;
  };

  const dateText = value => {
    const d = dateValue(value);

    return d ? d.toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }) : "Not available";
  };

  const dateKey = value => {
    const d = dateValue(value);

    if (!d) return "";

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const statusOf = () => "completed";

  const orderNumber = o => first(o, [
    "order_number", "order_no", "reference_number",
    "reference", "order_code", "id"
  ], "—");

  const customerName = o => first(o, [
    "customer_name", "full_name", "name", "recipient_name",
    "shipping_name", "buyer_name"
  ], "Customer");

  const customerEmail = o => first(o, [
    "customer_email", "email", "email_address", "buyer_email"
  ], "");

  const customerPhone = o => first(o, [
    "customer_phone", "phone", "phone_number", "contact_number",
    "mobile_number", "recipient_phone"
  ], "");

  const totalOf = o => Number(first(o, [
    "total_amount", "total", "grand_total", "amount",
    "total_price", "order_total"
  ], 0)) || 0;

  const createdOf = o => first(o, [
    "created_at", "order_date", "ordered_at", "date_created"
  ], "");

  const PAY_METHOD_KEYS = [
    "payment_method", "payment_type", "payment_channel",
    "payment_source", "mode_of_payment", "payment_mode",
    "payment_option", "payment_provider", "payment_method_name",
    "paymentMethod", "paymentMethodName", "checkout_method",
    "paymongo_method", "method"
  ];

  const PAY_REF_KEYS = [
    "payment_reference", "payment_ref",
    "paymongo_payment_id", "paymongo_id", "payment_intent_id"
  ];

  const TENDER_KEYS = [
    "amount_tendered", "cash_tendered", "cash_received",
    "cash_given", "tendered_amount", "amount_received", "cash_amount"
  ];

  const CHANGE_KEYS = [
    "change_amount", "change", "change_due", "exchange",
    "exchange_amount", "Exchange", "cash_change",
    "change_given", "change_returned"
  ];

  function normalizePaymentMethod(o) {
    return String(first(o, PAY_METHOD_KEYS, ""))
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");
  }

  const paymentKind = o => {
    const raw = normalizePaymentMethod(o);

    if (!raw) return "unknown";

    if (/\bg\s*cash\b/.test(raw) || /\bgcash\b/.test(raw)) {
      return "gcash";
    }

    if (
      /\bcash\b/.test(raw) ||
      /\bcod\b/.test(raw) ||
      /\bcash on delivery\b/.test(raw) ||
      /\bcash on pickup\b/.test(raw) ||
      /\bcash on pick up\b/.test(raw) ||
      /\bcounter\b/.test(raw) ||
      /\bwalk in\b/.test(raw) ||
      /\bin store\b/.test(raw)
    ) {
      return "cash";
    }

    return "other";
  };

  const paymentMethod = o => {
    const kind = paymentKind(o);

    if (kind === "gcash") return "GCash";
    if (kind === "cash") return "Cash";

    if (kind === "other") {
      return String(first(o, PAY_METHOD_KEYS, "Other"));
    }

    return "Not specified";
  };

  const cashInfo = o => {
    const t = first(o, TENDER_KEYS, null);
    const c = first(o, CHANGE_KEYS, null);

    const tendered = t === null ? null : Number(t);
    let change = c === null ? null : Number(c);

    if (change === null && Number.isFinite(tendered)) {
      change = Math.max(0, tendered - totalOf(o));
    }

    return {
      tendered: Number.isFinite(tendered) ? tendered : null,
      change: Number.isFinite(change) ? change : null
    };
  };

  const paymentBadge = o => {
    const kind = paymentKind(o);

    return `<span class="badge pay-${esc(kind)}">${esc(paymentMethod(o))}</span>`;
  };

  const paymentStatus = o =>
    first(o, ["payment_status", "payment_state"], "Not specified");

  const proofValue = o => first(o, [
    "proof_photo_path", "proof_image_url", "proof_of_payment_url",
    "payment_proof_url", "proof_url", "proof_image", "payment_proof",
    "proof_of_payment", "receipt_url", "receipt_image_url", "image_url"
  ], "");

  const ratingValue = r =>
    Number(first(r, ["rating", "stars", "star_rating", "score"], 0)) || 0;

  const reviewName = r =>
    first(r, ["customer_name", "name", "full_name", "user_name"], "Customer");

  const reviewComment = r =>
    first(r, ["comment", "feedback", "review", "message"], "");

  const reviewOrder = r =>
    first(r, ["order_number", "order_no", "order_id"], "");

  const reviewDate = r =>
    first(r, ["created_at", "submitted_at", "date_created"], "");

  const itemList = o => {
    const v = o[ITEMS_RELATION] ?? o.items ?? o.orderItems ?? [];

    return Array.isArray(v) ? v : [];
  };

  const itemName = i =>
    first(i, ["product_name", "name", "title", "product_title"], "Product");

  const itemQty = i =>
    Number(first(i, ["quantity", "qty", "count"], 1)) || 1;

  const itemPrice = i =>
    Number(first(i, ["unit_price", "price", "product_price"], 0)) || 0;

  const itemSubtotal = i => {
    const direct = first(i, [
      "subtotal", "line_total", "total_price", "amount"
    ], null);

    return direct === null
      ? itemPrice(i) * itemQty(i)
      : Number(direct) || 0;
  };

  let sb;
  let orders = [];
  let feedback = [];
  let products = [];
  let activePage = "dashboard";
  let toastTimer = null;
  let dashType = "monthly";
  let dashAnchor = new Date();

  function notify(message, type = "info") {
    const el = $("toast");

    el.textContent = message;

    el.style.background =
      type === "error" ? "#a93f4c" :
      type === "success" ? "#347756" : "#36303b";

    el.classList.remove("hidden");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(
      () => el.classList.add("hidden"),
      3600
    );
  }

  function setGlobalMessage(message, type = "info") {
    const el = $("globalMessage");

    if (!message) {
      el.classList.add("hidden");
      return;
    }

    el.textContent = message;
    el.className = "notice " + type;
  }

  function setAdminEmail(email) {
    const text = email || "Administrator";

    $("adminEmail").textContent = text;
    $("adminEmail").title = text;
    $("adminEmailFull").textContent = text;

    $("profileButton").querySelector(".avatar").textContent =
      text.trim().charAt(0).toUpperCase() || "A";
  }

  function setupBranding() {
    document.querySelectorAll(".brand-logo img").forEach(img => {
      img.src = LOGO_FILE;
    });

    const word = document.querySelector(".brand-wordmark");

    if (word) word.src = LOGO_TEXT_FILE;

    if (!SHOW_BRAND_TEXT) {
      document.querySelector(".brand-words")?.classList.add("hide-text");
    }

    roundFavicon();
  }

  function roundFavicon() {
    const img = new Image();

    img.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement("canvas");

        canvas.width = canvas.height = size;

        const ctx = canvas.getContext("2d");

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const s = Math.min(img.naturalWidth, img.naturalHeight);

        ctx.drawImage(
          img,
          (img.naturalWidth - s) / 2,
          (img.naturalHeight - s) / 2,
          s, s, 0, 0, size, size
        );

        const url = canvas.toDataURL("image/png");

        document.querySelectorAll('link[rel~="icon"]').forEach(l => l.remove());

        const link = document.createElement("link");

        link.rel = "icon";
        link.type = "image/png";
        link.href = url;

        document.head.appendChild(link);
      } catch (error) {
        console.warn("Could not round the favicon:", error.message);
      }
    };

    img.src = LOGO_FILE;
  }

  function validConfig() {
    return SUPABASE_URL.startsWith("https://") &&
      !SUPABASE_URL.includes("PASTE_YOUR") &&
      SUPABASE_ANON_KEY &&
      !SUPABASE_ANON_KEY.includes("PASTE_YOUR");
  }

  function statusBadge() {
    return '<span class="badge completed">Completed</span>';
  }

  function shortId(value) {
    const s = String(value ?? "");

    return s.length > 12 ? s.slice(0, 8) + "…" : s;
  }

  // CUSTOMER GROUPING FIX
  // Different names sharing one email remain separate customers.
  function customerKey(o) {
    const email = customerEmail(o).trim().toLowerCase();
    const name = customerName(o).trim().toLowerCase();
    const phone = customerPhone(o).trim();

    if (email && name && name !== "customer") {
      return `email:${email}|name:${name}`;
    }

    if (email) {
      return `email:${email}`;
    }

    if (phone) {
      return `phone:${phone}`;
    }

    if (name && name !== "customer") {
      return `name:${name}`;
    }

    return "";
  }

  function uniqueCustomers(list) {
    const map = new Map();

    list.forEach(o => {
      const key = customerKey(o);

      if (key && !map.has(key)) {
        map.set(key, o);
      }
    });

    return [...map.values()];
  }

  function sortOrders(list) {
    return [...list].sort((a, b) =>
      (dateValue(createdOf(b))?.getTime() || 0) -
      (dateValue(createdOf(a))?.getTime() || 0)
    );
  }

  async function loadOrders() {
    const { data, error } = await sb
      .from(ORDERS_TABLE)
      .select(`*, ${ITEMS_RELATION}(*)`)
      .limit(5000);

    if (error) throw error;

    orders = data || [];
  }

  async function loadFeedback() {
    const { data, error } = await sb.rpc(RATINGS_RPC);

    if (error) {
      feedback = [];

      console.warn("Ratings RPC unavailable:", error.message);

      return error.message;
    }

    feedback = Array.isArray(data) ? data : [];

    return "";
  }

  async function loadProducts() {
    const { data, error } = await sb
      .from("products")
      .select("*")
      .limit(2000);

    if (error) {
      products = [];

      console.warn("Products table unavailable:", error.message);

      return;
    }

    products = data || [];
  }

  // ==========================================
  // PRODUCTS & INVENTORY
  // ==========================================

  const INVENTORY_LOW_STOCK_LIMIT = 10;

  function inventoryProducts() {
    return products.filter(p =>
      p.is_active === true &&
      String(p.name || "").trim().toUpperCase() !== "TEST MODE"
    );
  }

  function inventoryStockStatus(stock) {
    const qty = Number(stock) || 0;

    if (qty <= 0) {
      return {
        label: "Out of stock",
        className: "out"
      };
    }

    if (qty <= INVENTORY_LOW_STOCK_LIMIT) {
      return {
        label: "Low stock",
        className: "low"
      };
    }

    return {
      label: "In stock",
      className: "in"
    };
  }

  function inventoryMessage(message, type = "info") {
    const el = $("inventoryMessage");

    if (!el) return;

    if (!message) {
      el.textContent = "";
      el.className = "hidden";
      return;
    }

    el.textContent = message;
    el.className = "notice " + type;
  }

  function renderInventory() {
    const table = $("inventoryTable");
    if (!table) return;

    const activeProducts = inventoryProducts();

    const totalUnits = activeProducts.reduce(
      (sum, p) => sum + Math.max(0, Number(p.stock) || 0),
      0
    );

    const lowStock = activeProducts.filter(p => {
      const stock = Number(p.stock) || 0;
      return stock > 0 && stock <= INVENTORY_LOW_STOCK_LIMIT;
    });

    const outOfStock = activeProducts.filter(
      p => (Number(p.stock) || 0) <= 0
    );

    if ($("inventoryTotal")) {
      $("inventoryTotal").textContent = totalUnits.toLocaleString();
    }

    if ($("inventoryActive")) {
      $("inventoryActive").textContent =
        activeProducts.length.toLocaleString();
    }

    if ($("inventoryLow")) {
      $("inventoryLow").textContent = lowStock.length.toLocaleString();
    }

    if ($("inventoryOut")) {
      $("inventoryOut").textContent =
        outOfStock.length.toLocaleString();
    }

    const search = ($("inventorySearch")?.value || "")
      .trim()
      .toLowerCase();

    const filter = $("inventoryStockFilter")?.value || "all";

    const categoryFilter =
      $("inventoryCategoryFilter")?.value || "all";

    const filtered = activeProducts
      .filter(p => {
        const name = String(p.name || "").toLowerCase();
        const category = String(p.category || "").toLowerCase();
        const description = String(p.description || "").toLowerCase();

        const matchesSearch =
          !search ||
          name.includes(search) ||
          category.includes(search) ||
          description.includes(search);

        const stock = Number(p.stock) || 0;

        const matchesFilter =
          filter === "all" ||
          (filter === "in" && stock > INVENTORY_LOW_STOCK_LIMIT) ||
          (filter === "low" &&
            stock > 0 &&
            stock <= INVENTORY_LOW_STOCK_LIMIT) ||
          (filter === "out" && stock <= 0);

        // categoryFromValue() handles "Solo", "solo-flower",
        // "Solo Flower", etc. and returns Solo / Triple / Bouquet / Other.
        const matchesCategory =
          categoryFilter === "all" ||
          categoryFromValue(p.category) === categoryFromValue(categoryFilter);

        return matchesSearch && matchesFilter && matchesCategory;
      })
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );

    if (!filtered.length) {
      table.innerHTML = emptyBlock(
        activeProducts.length
          ? "No products match your search or filter."
          : "No active products found."
      );
      return;
    }

    table.innerHTML = `
      <div class="table-wrap">
        <table class="inventory-data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Current stock</th>
              <th>Status</th>
              <th>Update stock</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(p => {
              const stock = Number(p.stock) || 0;
              const status = inventoryStockStatus(stock);
              const imageUrl = String(p.image_url || "").trim();

              return `
                <tr>
                  <td>
                    <div class="inventory-product-cell">
                      ${
                        imageUrl
                          ? `<img
                              class="inventory-product-image"
                              src="${esc(imageUrl)}"
                              alt="${esc(p.name || "Product image")}"
                              loading="lazy"
                              onerror="this.classList.add('image-missing');this.removeAttribute('src')"
                            >`
                          : `<div class="inventory-product-image image-missing"
                              aria-label="No product image">🌸</div>`
                      }
                      <div class="inventory-product-info">
                        <strong>${esc(p.name || "Unnamed product")}</strong>
                        ${
                          p.description
                            ? `<div class="muted small">${esc(p.description)}</div>`
                            : ""
                        }
                      </div>
                    </div>
                  </td>

                  <td><strong>${esc(p.category || "Other")}</strong></td>
                  <td>${esc(money(p.price))}</td>
                  <td><strong>${stock}</strong></td>

                  <td>
                    <span class="inventory-badge ${status.className}">
                      ${status.label}
                    </span>
                  </td>

                  <td>
                    <form class="inventory-update-form"
                      data-inventory-form="${esc(p.id)}">
                      <input
                        class="inventory-stock-input"
                        type="number"
                        name="stock"
                        min="0"
                        step="1"
                        value="${stock}"
                        required
                        aria-label="New stock for ${esc(p.name)}"
                      >
                      <button
                        class="btn small-btn"
                        type="submit"
                        data-stock-save="${esc(p.id)}"
                      >Save</button>
                    </form>
                  </td>

                  <td>
                    <button
                      class="btn small-btn"
                      type="button"
                      data-edit-product="${esc(p.id)}"
                    >Edit</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  async function refreshInventory() {
    inventoryMessage("");

    if ($("inventoryRefresh")) {
      $("inventoryRefresh").disabled = true;
    }

    try {
      const { data, error } = await sb
        .from("products")
        .select("*")
        .order("name", { ascending: true })
        .limit(2000);

      if (error) throw error;

      products = data || [];

      renderInventory();

      inventoryMessage("Inventory refreshed successfully.", "success");
    } catch (error) {
      console.error("Inventory refresh failed:", error);

      inventoryMessage(
        "Unable to load inventory: " +
          (error?.message || String(error)),
        "error"
      );
    } finally {
      if ($("inventoryRefresh")) {
        $("inventoryRefresh").disabled = false;
      }
    }
  }

  async function saveInventoryStock(productId, form) {
    const input = form.querySelector('[name="stock"]');
    const button = form.querySelector('[type="submit"]');

    if (!input || !button) return;

    const rawValue = input.value.trim();
    const quantity = Number(rawValue);

    if (
      rawValue === "" ||
      !Number.isSafeInteger(quantity) ||
      quantity < 0
    ) {
      inventoryMessage(
        "Stock must be a whole number greater than or equal to zero.",
        "error"
      );

      input.focus();
      return;
    }

    const product = products.find(
      p => String(p.id) === String(productId)
    );

    if (!product) {
      inventoryMessage(
        "Product not found. Refresh the inventory and try again.",
        "error"
      );
      return;
    }

    button.disabled = true;
    button.textContent = "Saving…";

    try {
      const { data: sessionData, error: sessionError } =
        await sb.auth.getSession();

      if (sessionError) throw sessionError;

      if (!sessionData.session) {
        throw new Error("Please sign in again before updating stock.");
      }

      const { data, error } = await sb
        .from("products")
        .update({ stock: quantity })
        .eq("id", productId)
        .select("id, name, stock")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "No product was updated. Supabase blocked the change (missing UPDATE permission on the products table for this account)."
        );
      }

      const index = products.findIndex(
        p => String(p.id) === String(data.id)
      );

      if (index !== -1) {
        products[index] = {
          ...products[index],
          stock: data.stock
        };
      }

      renderInventory();

      inventoryMessage(
        `${data.name} stock updated to ${data.stock}.`,
        "success"
      );

      notify("Inventory stock updated.", "success");
    } catch (error) {
      console.error("Stock update failed:", error);

      inventoryMessage(
        "Could not update stock: " +
          (error?.message || String(error)) +
          " Check your login and staff permissions.",
        "error"
      );

      notify("Stock update failed.", "error");
    } finally {
      // The form may have been replaced by renderInventory().
      // Restore the button only if the original form still exists.
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = "Save";
      }
    }
  }

  async function refreshAll() {
    setGlobalMessage("");
    notify("Loading store data…");

    try {
      const results = await Promise.allSettled([
        loadOrders(),
        loadFeedback(),
        loadProducts()
      ]);

      if (results[0].status === "rejected") {
        throw results[0].reason;
      }

      if (results[1].status === "fulfilled" && results[1].value) {
        setGlobalMessage(
          "Orders loaded, but feedback could not be loaded. Check that the get_ratings RPC exists and that the admin has permission to call it. Details: " +
          results[1].value,
          "warning"
        );
      }

      renderAll();

      notify("Store data refreshed.", "success");
    } catch (error) {
      console.error(error);

      setGlobalMessage(
        "Could not load orders. Check the table name, order_items relationship, Supabase connection, and Row Level Security policies. " +
        (error?.message || String(error)),
        "error"
      );

      notify("Unable to load orders.", "error");
    }
  }

  function showPage(page) {
    activePage = page;

    document.querySelectorAll(".page").forEach(el =>
      el.classList.add("hidden")
    );

    $("page-" + page)?.classList.remove("hidden");

    document.querySelectorAll(".nav-btn[data-page]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.page === page);
    });

    const titles = {
      dashboard: "Dashboard",
      orders: "Orders & Transactions",
      customers: "Customers",
      feedback: "Feedback & Ratings",
      reports: "Sales Reports",
      inventory: "Products & Inventory"
    };

    $("topTitle").textContent = titles[page] || "Dashboard";

    $("sidebar").classList.remove("open");

    if (page === "orders") renderOrders();
    if (page === "customers") renderCustomers();
    if (page === "feedback") renderFeedback();
    if (page === "reports") renderReport();
    if (page === "inventory") renderInventory();
  }

  function renderAll() {
    renderDashboard();
    renderOrders();
    renderCustomers();
    renderFeedback();
    renderReport();
    renderInventory();
  }

  function renderDashboard() {
    $("statSales").textContent = money(
      orders.reduce((sum, o) => sum + totalOf(o), 0)
    );

    $("statOrders").textContent = orders.length.toLocaleString();

    $("statCustomers").textContent =
      uniqueCustomers(orders).length.toLocaleString();

    const validRatings = feedback
      .map(ratingValue)
      .filter(n => n > 0 && n <= 5);

    $("statRating").textContent = validRatings.length
      ? (
          validRatings.reduce((a, b) => a + b, 0) /
          validRatings.length
        ).toFixed(1) + " ★"
      : "—";

    $("statReviewCount").textContent =
      `${feedback.length} review(s) loaded`;

    renderDashboardChart();

    $("statusBreakdown").innerHTML = orders.length
      ? `<div class="bar-row">
          <div class="row between">
            <strong>${orders.length.toLocaleString()}</strong>
            ${statusBadge()}
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:100%"></div>
          </div>
        </div>`
      : emptyBlock("No orders found.");

    $("recentOrders").innerHTML = orders.length
      ? orderTable(sortOrders(orders).slice(0, 6))
      : emptyBlock("No transactions yet.");
  }

  function renderDashboardChart() {
    const range = rangeFor(dashType, dashAnchor);
    const list = reportOrders(range);

    const total = list.reduce((sum, o) => sum + totalOf(o), 0);
    const units = list.reduce((sum, o) => sum + orderUnits(o), 0);

    const buckets = buildBuckets(range, list);

    drawChart("dashboardChart", buckets, buckets.length > 10);

    $("dashRangeLabel").textContent = range.label;

    $("dashboardChartSummary").innerHTML =
      `<strong>${esc(money(total))}</strong> · ${list.length} order(s) · ${units} item(s) sold`;

    $("dashboardChartNote").textContent = range.note;

    $("dashNext").disabled = range.end.getTime() > Date.now();

    document.querySelectorAll("#dashPeriodSeg button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.type === dashType);
    });
  }

  function shiftDashboard(dir) {
    const a = new Date(dashAnchor);

    if (dashType === "daily") {
      a.setDate(a.getDate() + dir);
    } else if (dashType === "weekly") {
      a.setDate(a.getDate() + 7 * dir);
    } else {
      a.setDate(1);
      a.setMonth(a.getMonth() + dir);
    }

    dashAnchor = a;

    renderDashboardChart();
  }

  function drawChart(targetId, data, dense = false) {
    const el = $(targetId);

    el.classList.toggle("dense", dense);

    if (!data.length) {
      el.innerHTML =
        `<div class="empty" style="width:100%">No sales data available.</div>`;

      return;
    }

    const max = Math.max(
      ...data.map(d => Number(d.value) || 0),
      1
    );

    el.innerHTML = data.map(d => {
      const v = Number(d.value) || 0;
      const u = Number(d.units) || 0;
      const level = unitLevel(u);
      const height = Math.max(v > 0 ? 5 : 1, (v / max) * 230);
      const shown = v ? esc(compactMoney(v)) : (dense ? "" : "—");

      return `<div class="chart-col" title="${esc(d.tip || d.label)}: ${esc(money(v))} · ${u} item(s) sold">
        <div class="chart-value ${level}">${shown}</div>
        <div class="chart-bar ${level}" style="height:${height}px"></div>
        <div class="chart-label">${esc(d.label)}</div>
      </div>`;
    }).join("");
  }

  function compactMoney(v) {
    const n = Number(v) || 0;

    if (n >= 1000000) return "₱" + (n / 1000000).toFixed(1) + "m";
    if (n >= 1000) return "₱" + (n / 1000).toFixed(1) + "k";

    return "₱" + Math.round(n);
  }

  function orderTable(list) {
    if (!list.length) return emptyBlock("No matching orders.");

    return `<div class="table-wrap"><table>
      <thead><tr>
        <th>Order</th><th>Customer</th><th>Date</th><th>Total</th>
        <th>Payment</th><th>Status</th><th>Action</th>
      </tr></thead>
      <tbody>${list.map(o => `<tr>
        <td><strong>${esc(shortId(orderNumber(o)))}</strong></td>
        <td><div class="customer-cell">
          <div class="avatar">${esc(customerName(o).trim().charAt(0).toUpperCase() || "C")}</div>
          <div class="stack">
            <strong>${esc(customerName(o))}</strong>
            <span class="muted small">${esc(customerEmail(o) || customerPhone(o) || "No contact details")}</span>
          </div>
        </div></td>
        <td>${esc(dateText(createdOf(o)))}</td>
        <td><strong>${esc(money(totalOf(o)))}</strong></td>
        <td>${paymentBadge(o)}</td>
        <td>${statusBadge()}</td>
        <td><button class="btn small-btn" data-view-order="${esc(o.id)}">View details</button></td>
      </tr>`).join("")}</tbody></table></div>`;
  }

  function emptyBlock(message) {
    return `<div class="empty"><div class="empty-icon">✿</div>${esc(message)}</div>`;
  }

  function renderOrders() {
    $("orderCountAll").textContent = orders.length;
    $("orderCountComplete").textContent = orders.length;

    const search = ($("orderSearch").value || "").trim().toLowerCase();
    const date = $("orderDateFilter").value;

    const filtered = sortOrders(orders).filter(o => {
      const haystack = [
        orderNumber(o),
        customerName(o),
        customerEmail(o),
        customerPhone(o)
      ].join(" ").toLowerCase();

      return (!search || haystack.includes(search)) &&
        (!date || dateKey(createdOf(o)) === date);
    });

    $("ordersTable").innerHTML = orderTable(filtered);
  }

  function renderCustomers() {
    const search = ($("customerSearch").value || "").trim().toLowerCase();
    const grouped = new Map();

    sortOrders(orders).forEach(o => {
      const key = customerKey(o) || "order:" + orderNumber(o);

      if (!grouped.has(key)) {
        grouped.set(key, {
          order: o,
          count: 0,
          total: 0,
          lastDate: createdOf(o)
        });
      }

      const c = grouped.get(key);

      c.count++;
      c.total += totalOf(o);

      if (
        (dateValue(createdOf(o))?.getTime() || 0) >
        (dateValue(c.lastDate)?.getTime() || 0)
      ) {
        c.lastDate = createdOf(o);
      }
    });

    const list = [...grouped.values()].filter(c => {
      const o = c.order;

      return [
        customerName(o),
        customerEmail(o),
        customerPhone(o)
      ].join(" ").toLowerCase().includes(search);
    });

    $("customersTable").innerHTML = list.length
      ? `<div class="table-wrap"><table>
        <thead><tr>
          <th>Customer</th><th>Email</th><th>Phone</th><th>Orders</th>
          <th>Total spend</th><th>Last order</th><th>Action</th>
        </tr></thead>
        <tbody>${list.map(c => {
          const o = c.order;

          return `<tr>
            <td><strong>${esc(customerName(o))}</strong></td>
            <td>${esc(customerEmail(o) || "—")}</td>
            <td>${esc(customerPhone(o) || "—")}</td>
            <td>${c.count}</td>
            <td><strong>${esc(money(c.total))}</strong></td>
            <td>${esc(dateText(c.lastDate))}</td>
            <td><button class="btn small-btn" data-view-order="${esc(o.id)}">Latest order</button></td>
          </tr>`;
        }).join("")}</tbody></table></div>`
      : emptyBlock("No matching customers found.");
  }

  function renderFeedback() {
    const from = $("feedbackDateFrom").value;
    const to = $("feedbackDateTo").value;

    const dated = feedback.filter(r => {
      if (!from && !to) return true;

      const key = dateKey(reviewDate(r));

      if (!key) return false;

      return (!from || key >= from) && (!to || key <= to);
    });

    const validRatings = dated
      .map(ratingValue)
      .filter(n => n >= 1 && n <= 5);

    $("feedbackTotal").textContent = dated.length;

    $("feedbackAverage").textContent = validRatings.length
      ? (
          validRatings.reduce((a, b) => a + b, 0) /
          validRatings.length
        ).toFixed(1) + " ★"
      : "—";

    $("feedbackFive").textContent =
      validRatings.filter(n => n === 5).length;

    $("feedbackOne").textContent =
      validRatings.filter(n => n === 1).length;

    const search = ($("feedbackSearch").value || "").toLowerCase().trim();
    const rating = Number($("feedbackRatingFilter").value) || 0;

    const filtered = [...dated].filter(r => {
      const text = [
        reviewName(r),
        reviewOrder(r),
        reviewComment(r)
      ].join(" ").toLowerCase();

      return (!search || text.includes(search)) &&
        (!rating || ratingValue(r) === rating);
    }).sort((a, b) =>
      (dateValue(reviewDate(b))?.getTime() || 0) -
      (dateValue(reviewDate(a))?.getTime() || 0)
    );

    $("feedbackGrid").innerHTML = filtered.length
      ? filtered.map(r => {
        const n = ratingValue(r);
        const safeRating = Math.min(5, Math.max(0, n));

        return `<article class="card review-card">
          <div class="row between">
            <div class="row">
              <div class="avatar">${esc(reviewName(r).charAt(0).toUpperCase())}</div>
              <div class="stack">
                <strong>${esc(reviewName(r))}</strong>
                <span class="muted small">${esc(dateText(reviewDate(r)))}</span>
              </div>
            </div>
            <span class="stars" title="${n} out of 5">${"★".repeat(safeRating)}${"☆".repeat(5-safeRating)}</span>
          </div>
          ${reviewOrder(r) ? `<div class="muted small" style="margin-top:12px">Order: ${esc(reviewOrder(r))}</div>` : ""}
          <div class="review-comment">${esc(reviewComment(r) || "No written comment.")}</div>
        </article>`;
      }).join("")
      : emptyBlock("No matching feedback found.");
  }

  const orderUnits = o => {
    const items = itemList(o);

    return items.length
      ? items.reduce((sum, i) => sum + itemQty(i), 0)
      : 1;
  };

  function rangeFor(type, anchor) {
    const fmt = (d, opts) => d.toLocaleDateString("en-PH", opts);
    const pad = n => String(n).padStart(2, "0");

    if (type === "daily") {
      const start = startOfDay(anchor);

      return {
        type,
        start,
        end: addDays(start, 1),
        label: fmt(start, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }),
        tag: dateKey(start),
        chartTitle: "Hourly sales",
        note: "Each bar is one hour of the day (a = AM, p = PM). Hover a bar to see sales and items sold."
      };
    }

    if (type === "weekly") {
      const day = startOfDay(anchor);
      const start = addDays(day, -((day.getDay() + 6) % 7));
      const end = addDays(start, 7);
      const last = addDays(end, -1);

      return {
        type,
        start,
        end,
        label: `${fmt(start, { month: "short", day: "numeric" })} – ${fmt(last, { month: "short", day: "numeric", year: "numeric" })}`,
        tag: `${dateKey(start)}_to_${dateKey(last)}`,
        chartTitle: "Daily sales this week",
        note: "Each bar is one day, Monday to Sunday. Hover a bar to see sales and items sold."
      };
    }

    const y = anchor.getFullYear();
    const mo = anchor.getMonth();
    const start = new Date(y, mo, 1);

    return {
      type: "monthly",
      start,
      end: new Date(y, mo + 1, 1),
      label: fmt(start, { month: "long", year: "numeric" }),
      tag: `${y}-${pad(mo + 1)}`,
      chartTitle: "Daily sales this month",
      note: "The numbers under the bars are the day of the month (1 to 31). Hover a bar to see sales and items sold."
    };
  }

  function getReportRange() {
    const type = $("reportType").value || "monthly";

    if (type === "monthly") {
      const m = /^(\d{4})-(\d{2})$/.exec($("reportMonth").value || "");

      return rangeFor(
        "monthly",
        m ? new Date(+m[1], +m[2] - 1, 1) : new Date()
      );
    }

    const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec($("reportDay").value || "");

    return rangeFor(
      type,
      d ? new Date(+d[1], +d[2] - 1, +d[3]) : new Date()
    );
  }

  function reportOrders(range) {
    return sortOrders(orders).filter(o => {
      const d = dateValue(createdOf(o));

      return d && d >= range.start && d < range.end;
    });
  }

  function buildBuckets(range, list) {
    let buckets;

    if (range.type === "daily") {
      buckets = Array.from({ length: 24 }, (_, h) => ({
        label: h === 0 ? "12a" :
          h < 12 ? h + "a" :
          h === 12 ? "12p" : (h - 12) + "p",
        tip: `${String(h).padStart(2, "0")}:00`,
        value: 0,
        units: 0
      }));
    } else if (range.type === "weekly") {
      buckets = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(range.start, i);

        return {
          label: d.toLocaleDateString("en-PH", { weekday: "short" }),
          tip: d.toLocaleDateString("en-PH", {
            weekday: "long",
            month: "short",
            day: "numeric"
          }),
          value: 0,
          units: 0
        };
      });
    } else {
      const days = Math.round((range.end - range.start) / DAY_MS);

      buckets = Array.from({ length: days }, (_, i) => {
        const d = addDays(range.start, i);

        return {
          label: String(i + 1),
          tip: d.toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric"
          }),
          value: 0,
          units: 0
        };
      });
    }

    list.forEach(o => {
      const d = dateValue(createdOf(o));

      const idx = range.type === "daily"
        ? d.getHours()
        : range.type === "weekly"
          ? Math.round((startOfDay(d) - range.start) / DAY_MS)
          : d.getDate() - 1;

      const b = buckets[idx];

      if (!b) return;

      b.value += totalOf(o);
      b.units += orderUnits(o);
      b.orders = (b.orders || 0) + 1;
    });

    return buckets;
  }

  function syncReportControls() {
    const type = $("reportType").value;

    $("reportMonthWrap").classList.toggle("hidden", type !== "monthly");
    $("reportDayWrap").classList.toggle("hidden", type === "monthly");

    $("reportDayLabel").textContent =
      type === "weekly" ? "Pick any date in the week" : "Report date";
  }

  function renderReport() {
    syncReportControls();

    const range = getReportRange();
    const list = reportOrders(range);

    const total = list.reduce((sum, o) => sum + totalOf(o), 0);
    const unitsSold = list.reduce((sum, o) => sum + orderUnits(o), 0);

    $("reportSales").textContent = money(total);
    $("reportOrders").textContent = list.length;
    $("reportUnits").textContent = unitsSold;
    $("reportAov").textContent = money(list.length ? total / list.length : 0);
    $("reportCustomers").textContent = uniqueCustomers(list).length;
    $("reportRange").textContent = range.label;
    $("reportChartTitle").textContent = range.chartTitle;
    $("reportChartNote").textContent = range.note;

    const buckets = buildBuckets(range, list);

    drawChart("reportChart", buckets, buckets.length > 10);

    const sellers = {};

    list.forEach(o => itemList(o).forEach(i => {
      const name = itemName(i);

      if (!sellers[name]) {
        sellers[name] = { quantity: 0, sales: 0 };
      }

      sellers[name].quantity += itemQty(i);
      sellers[name].sales += itemSubtotal(i);
    }));

    const top = Object.entries(sellers)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 8);

    const maxQty = Math.max(1, ...top.map(([, v]) => v.quantity));

    const unsold = products
      .filter(p => p.is_active !== false)
      .map(p => String(first(p, ["name", "title", "product_name"], "")))
      .filter(n => n && n !== "TEST MODE" && !sellers[n])
      .slice(0, 5)
      .map(n => [n, { quantity: 0, sales: 0 }]);

    const rows = [...top, ...unsold];

    $("bestSellers").innerHTML = rows.length
      ? rows.map(([name, v]) => `<div class="bar-row">
          <div class="row between">
            <span class="wrap">${esc(name)}</span>
            <strong>${v.quantity} sold</strong>
          </div>
          <div class="bar-track">
            <div class="bar-fill ${unitLevel(v.quantity)}" style="width:${v.quantity / maxQty * 100}%"></div>
          </div>
          <div class="muted small" style="margin-top:5px">${esc(money(v.sales))}</div>
        </div>`).join("")
      : emptyBlock("No item-level sales data found for this period.");

    $("reportTable").innerHTML = orderTable(list);
  }

  function detailField(label, value) {
    const shown = value === "" || value === null || value === undefined
      ? "Not available"
      : value;

    return `<div class="detail-field">
      <div class="label">${esc(label)}</div>
      <div class="value">${esc(shown)}</div>
    </div>`;
  }

  const HIDDEN_FIELD = /delivery|courier|shipping|address|payment_ref|(^|_)tax(_|$)/i;

  function allFieldsSection(o) {
    const exclude = new Set([
      ITEMS_RELATION,
      "items",
      "orderItems",
      "tracking_number",
      "tracking_no",
      "tracking_code"
    ]);

    const fields = Object.entries(o).filter(([key, value]) =>
      !exclude.has(key) &&
      !HIDDEN_FIELD.test(key) &&
      (
        value === null ||
        ["string", "number", "boolean"].includes(typeof value)
      )
    );

    if (!fields.length) return "";

    return `<div class="detail-section">
      <h3>All available order fields</h3>
      <div class="detail-grid">
        ${fields.map(([key, value]) => detailField(
          key.replaceAll("_", " "),
          typeof value === "boolean"
            ? (value ? "Yes" : "No")
            : String(value ?? "")
        )).join("")}
      </div>
    </div>`;
  }

  function resolveProofUrl(value) {
    if (!value || typeof value !== "string") return "";

    const raw = value.trim();

    if (/^https?:\/\//i.test(raw)) return raw;
    if (!PROOF_BUCKET || !sb) return "";

    const path = raw
      .replace(/^\/+/, "")
      .replace(/^proofs\//, "");

    const { data } = sb.storage.from(PROOF_BUCKET).getPublicUrl(path);

    return data?.publicUrl || "";
  }

  function proofSection(o) {
    const raw = proofValue(o);

    if (!raw) {
      return `<div class="detail-section">
        <h3>Proof photos</h3>
        <div class="notice warning">
          No proof photo was saved in this order.
          Check the proof_photo_path column in Supabase.
        </div>
      </div>`;
    }

    const url = resolveProofUrl(String(raw));

    if (!url) {
      return `<div class="detail-section">
        <h3>Proof photos</h3>
        <div class="proof-placeholder">
          Could not create the photo URL. Check the Storage bucket and file path.
        </div>
        <div class="small muted wrap">${esc(raw)}</div>
      </div>`;
    }

    return `<div class="detail-section">
      <h3>Proof photos</h3>
      <div class="proof-grid">
        <div class="proof-card">
          <strong>Proof of payment</strong>
          <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">
            <img src="${esc(url)}" alt="Proof of payment" loading="lazy"
              style="max-width:100%;max-height:400px;object-fit:contain;"
              onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')">
            <div class="proof-placeholder hidden">
              Image could not be loaded. Check Storage permissions or the image path.
            </div>
          </a>
          <div class="small muted wrap" style="margin-top:8px">${esc(raw)}</div>
        </div>
      </div>
    </div>`;
  }

  function openOrderDetails(id) {
    const o = orders.find(item => String(item.id) === String(id));

    if (!o) {
      notify("Order not found. Refresh the data and try again.", "error");
      return;
    }

    $("detailTitle").textContent = "Order " + orderNumber(o);
    $("detailSubtitle").textContent = dateText(createdOf(o));

    const items = itemList(o);

    const itemsHtml = items.length
      ? items.map(i => `<div class="product-row">
          <div class="stack" style="min-width:0">
            <strong class="wrap">${esc(itemName(i))}</strong>
            <span class="muted small">Quantity: ${itemQty(i)} × ${esc(money(itemPrice(i)))}</span>
          </div>
          <strong>${esc(money(itemSubtotal(i)))}</strong>
        </div>`).join("")
      : `<div class="notice warning">
          No related order items were returned. Check the order_items relationship and database permissions.
        </div>`;

    const total = totalOf(o);

    const subtotal = items.reduce(
      (sum, i) => sum + itemSubtotal(i),
      0
    );

    const cash = paymentKind(o) === "cash" ? cashInfo(o) : null;

    const cashLines = cash ? `
      <div class="total-line">
        <span class="muted">Cash received</span>
        <span>${cash.tendered === null ? "Not recorded" : esc(money(cash.tendered))}</span>
      </div>
      <div class="total-line change-line">
        <span>Change / exchange</span>
        <span>${cash.change === null ? "Not recorded" : esc(money(cash.change))}</span>
      </div>` : "";

    $("orderDetailContent").innerHTML = `
      <div class="detail-section">
        <div class="row" style="flex-wrap:wrap;gap:36px;margin-bottom:14px">
          <div>
            <div class="muted small">ORDER STATUS</div>
            <div style="margin-top:6px">${statusBadge()}</div>
          </div>
          <div>
            <div class="muted small">PAYMENT</div>
            <div style="margin-top:6px">${paymentBadge(o)}</div>
          </div>
        </div>
        <div class="notice info">
          Order status is displayed as Completed in this admin view. Status editing is disabled here.
        </div>
      </div>
      <div class="detail-section">
        <h3>Customer information</h3>
        <div class="detail-grid">
          ${detailField("Full name", customerName(o))}
          ${detailField("Email", customerEmail(o))}
          ${detailField("Phone / mobile", customerPhone(o))}
          ${detailField("Order date", dateText(createdOf(o)))}
          ${detailField("Payment method", paymentMethod(o))}
          ${detailField("Payment status", paymentStatus(o))}
          ${detailField("Order status", "Completed")}
        </div>
      </div>
      <div class="detail-section">
        <h3>Items ordered</h3>
        <div class="card" style="padding:0 15px">${itemsHtml}</div>
        <div style="max-width:350px;margin:14px 0 0 auto">
          <div class="total-line">
            <span class="muted">Items subtotal</span>
            <span>${esc(money(subtotal))}</span>
          </div>
          <div class="total-line grand">
            <span>Total amount</span>
            <span>${esc(money(total))}</span>
          </div>
          ${cashLines}
        </div>
      </div>
      ${proofSection(o)}
      <div class="detail-section">
        <h3>Additional information</h3>
        <div class="detail-grid">
          ${detailField("Order ID", o.id)}
          ${detailField("Order reference", orderNumber(o))}
          ${detailField("Notes / instructions", first(o, ["notes", "order_notes", "special_instructions", "customer_note"], ""))}
          ${detailField("Cancellation reason", first(o, ["cancellation_reason", "cancel_reason"], ""))}
        </div>
      </div>
      ${allFieldsSection(o)}
    `;

    $("orderModal").classList.remove("hidden");
  }

  // PRODUCT CATEGORIES
  const PRODUCT_CATEGORIES = ["Solo", "Triple", "Bouquet"];

  const categoryFromValue = value => {
    const category = String(value ?? "")
      .toLowerCase()
      .trim()
      .replace(/[_\s]+/g, "-");

    if (category.includes("solo")) return "Solo";
    if (category.includes("triple")) return "Triple";
    if (category.includes("bouquet")) return "Bouquet";

    return "Other";
  };

  const categoryOf = (item, categoryLookup) => {
    const direct = categoryFromValue(first(item, [
      "category", "product_category", "type", "product_type"
    ], ""));

    if (direct !== "Other") return direct;

    const productId = first(item, ["product_id", "productId"], "");

    if (
      productId !== "" &&
      categoryLookup.has(String(productId))
    ) {
      return categoryLookup.get(String(productId));
    }

    return "Other";
  };

  // EXCEL REPORT EXPORT
  async function exportReport() {
    if (typeof ExcelJS === "undefined") {
      notify("ExcelJS did not load. Check the ExcelJS script in admin.html.", "error");
      return;
    }

    const range = getReportRange();
    const typeName = range.type.charAt(0).toUpperCase() + range.type.slice(1);
    const list = reportOrders(range);
    const total = list.reduce((sum, o) => sum + totalOf(o), 0);
    const unitsSold = list.reduce((sum, o) => sum + orderUnits(o), 0);

    const productCategoryMap = new Map(
      (Array.isArray(products) ? products : []).map(p => [
        String(p.id ?? ""),
        categoryFromValue(first(p, [
          "category", "product_category", "type", "product_type"
        ], ""))
      ])
    );

    const PINK = "FFD98D9F";
    const PINK_LIGHT = "FFF9E9ED";
    const INK = "FF302A2B";
    const MUTED = "FF898184";
    const line = { style: "thin", color: { argb: "FFEEE7E6" } };
    const borders = { top: line, left: line, bottom: line, right: line };

    const zebra = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFCFAF9" }
    };

    const PESO = '"₱"#,##0.00';
    const DATE_FMT = "mmm d, yyyy h:mm AM/PM";

    const styleHeader = row => {
      row.eachCell(c => {
        c.font = { bold: true, color: { argb: "FFFFFFFF" } };

        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: PINK }
        };

        c.alignment = {
          vertical: "middle",
          horizontal: "center"
        };

        c.border = borders;
      });

      row.height = 24;
    };

    const styleTotal = row => {
      row.eachCell(c => {
        c.font = { bold: true, color: { argb: INK } };

        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: PINK_LIGHT }
        };

        c.border = borders;
      });
    };

    const writeTable = (ws, startRow, headers, rows, fmts = [], aligns = []) => {
      const header = ws.getRow(startRow);

      headers.forEach((value, index) => {
        header.getCell(index + 1).value = value;
      });

      styleHeader(header);

      rows.forEach((values, rowIndex) => {
        const row = ws.getRow(startRow + 1 + rowIndex);

        values.forEach((value, columnIndex) => {
          const cell = row.getCell(columnIndex + 1);

          cell.value = value;

          if (fmts[columnIndex]) {
            cell.numFmt = fmts[columnIndex];
          }

          cell.border = borders;

          cell.alignment = {
            vertical: "middle",
            horizontal: aligns[columnIndex] || undefined
          };

          if (rowIndex % 2) cell.fill = zebra;
        });
      });

      return startRow + rows.length + 1;
    };

    const sectionTitle = (ws, rowNum, text) => {
      const cell = ws.getRow(rowNum).getCell(1);

      cell.value = text;

      cell.font = {
        bold: true,
        size: 12,
        color: { argb: INK }
      };
    };

    const setWidths = (ws, widths) => {
      widths.forEach((width, index) => {
        ws.getColumn(index + 1).width = width;
      });
    };

    const catTotals = new Map(
      PRODUCT_CATEGORIES.map(category => [
        category,
        { qty: 0, sales: 0 }
      ])
    );

    const productMap = new Map();
    const itemRows = [];

    list.forEach(order => {
      itemList(order).forEach(item => {
        const category = categoryOf(item, productCategoryMap);
        const name = itemName(item);
        const qty = itemQty(item);
        const subtotal = itemSubtotal(item);

        if (!catTotals.has(category)) {
          catTotals.set(category, { qty: 0, sales: 0 });
        }

        catTotals.get(category).qty += qty;
        catTotals.get(category).sales += subtotal;

        const key = category + "||" + name;

        if (!productMap.has(key)) {
          productMap.set(key, {
            category,
            name,
            qty: 0,
            sales: 0
          });
        }

        const product = productMap.get(key);

        product.qty += qty;
        product.sales += subtotal;

        itemRows.push([
          shortId(orderNumber(order)),
          dateValue(createdOf(order)),
          customerName(order),
          category,
          name,
          qty,
          itemPrice(item),
          subtotal
        ]);
      });
    });

    const categoryOrder = [...PRODUCT_CATEGORIES, "Other"];

    const productRows = [...productMap.values()]
      .sort((a, b) =>
        (categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)) ||
        (b.qty - a.qty)
      )
      .map(p => [p.category, p.name, p.qty, p.sales]);

    const wb = new ExcelJS.Workbook();

    wb.creator = "Fleurs Kiosk";
    wb.created = new Date();

    // SHEET 1: SUMMARY
    const sm = wb.addWorksheet("Summary", {
      views: [{ showGridLines: false }]
    });

    setWidths(sm, [30, 22, 18, 18]);

    sm.mergeCells("A1:D1");
    sm.getCell("A1").value = `Fleurs Kiosk · ${typeName} Sales Report`;

    sm.getCell("A1").font = {
      name: "Georgia",
      bold: true,
      size: 18,
      color: { argb: INK }
    };

    sm.getRow(1).height = 32;

    sm.mergeCells("A2:D2");
    sm.getCell("A2").value = range.label;

    sm.getCell("A2").font = {
      size: 13,
      bold: true,
      color: { argb: "FFA9506B" }
    };

    sm.mergeCells("A3:D3");
    sm.getCell("A3").value =
      "Generated " + new Date().toLocaleString("en-PH");

    sm.getCell("A3").font = {
      size: 10,
      color: { argb: MUTED }
    };

    sectionTitle(sm, 5, "Key figures");

    const kpis = [
      ["Total sales", total, PESO],
      ["Number of orders", list.length, "#,##0"],
      ["Items sold", unitsSold, "#,##0"],
      ["Average order value", list.length ? total / list.length : 0, PESO],
      ["Unique customers", uniqueCustomers(list).length, "#,##0"]
    ];

    const kh = sm.getRow(6);

    kh.getCell(1).value = "Metric";
    kh.getCell(2).value = "Value";

    styleHeader(kh);

    kpis.forEach(([label, value, format], index) => {
      const row = sm.getRow(7 + index);

      row.getCell(1).value = label;
      row.getCell(2).value = value;
      row.getCell(2).numFmt = format;
      row.getCell(2).alignment = { horizontal: "right" };
      row.getCell(1).font = { bold: true };

      [1, 2].forEach(column => {
        row.getCell(column).border = borders;

        if (index % 2) {
          row.getCell(column).fill = zebra;
        }
      });
    });

    let rowNum = 7 + kpis.length + 2;

    sectionTitle(sm, rowNum, "What was sold (by type)");

    const catRows = [...catTotals.entries()]
      .filter(([name, values]) =>
        PRODUCT_CATEGORIES.includes(name) || values.qty > 0
      )
      .map(([name, values]) => [name, values.qty, values.sales]);

    rowNum = writeTable(
      sm,
      rowNum + 1,
      ["Type", "Items sold", "Sales"],
      catRows,
      [null, "#,##0", PESO],
      [null, "right", "right"]
    );

    const categoryTotalRow = sm.getRow(rowNum);

    categoryTotalRow.getCell(1).value = "Total";

    categoryTotalRow.getCell(2).value =
      catRows.reduce((sum, values) => sum + values[1], 0);

    categoryTotalRow.getCell(3).value =
      catRows.reduce((sum, values) => sum + values[2], 0);

    categoryTotalRow.getCell(2).numFmt = "#,##0";
    categoryTotalRow.getCell(3).numFmt = PESO;

    categoryTotalRow.getCell(2).alignment = { horizontal: "right" };
    categoryTotalRow.getCell(3).alignment = { horizontal: "right" };

    styleTotal(categoryTotalRow);

    rowNum += 2;

    sectionTitle(sm, rowNum, "How customers paid");

    const payMap = new Map([
      ["GCash", { n: 0, sales: 0 }],
      ["Cash", { n: 0, sales: 0 }]
    ]);

    list.forEach(order => {
      const label = paymentMethod(order);

      if (!payMap.has(label)) {
        payMap.set(label, { n: 0, sales: 0 });
      }

      payMap.get(label).n += 1;
      payMap.get(label).sales += totalOf(order);
    });

    const payRows = [...payMap.entries()].map(([label, values]) => [
      label,
      values.n,
      values.sales
    ]);

    rowNum = writeTable(
      sm,
      rowNum + 1,
      ["Payment method", "Orders", "Sales"],
      payRows,
      [null, "#,##0", PESO],
      [null, "right", "right"]
    );

    rowNum += 1;

    sm.mergeCells(`A${rowNum}:D${rowNum}`);

    sm.getCell(`A${rowNum}`).value =
      "Order status is shown as Completed in this admin view. Sales total adds up the total of every order in the period.";

    sm.getCell(`A${rowNum}`).font = {
      italic: true,
      size: 9,
      color: { argb: MUTED }
    };

    // SHEET 2: PRODUCTS SOLD
    const ps = wb.addWorksheet("Products Sold");

    setWidths(ps, [14, 38, 12, 18]);

    let nextRow = writeTable(
      ps,
      1,
      ["Type", "Product", "Qty sold", "Sales"],
      productRows,
      [null, null, "#,##0", PESO],
      [null, null, "right", "right"]
    );

    if (!productRows.length) {
      ps.getRow(2).getCell(1).value =
        "No item-level sales found for this period.";
    } else {
      const totalRow = ps.getRow(nextRow);

      totalRow.getCell(1).value = "Total";

      totalRow.getCell(3).value =
        productRows.reduce((sum, values) => sum + values[2], 0);

      totalRow.getCell(4).value =
        productRows.reduce((sum, values) => sum + values[3], 0);

      totalRow.getCell(3).numFmt = "#,##0";
      totalRow.getCell(4).numFmt = PESO;

      totalRow.getCell(3).alignment = { horizontal: "right" };
      totalRow.getCell(4).alignment = { horizontal: "right" };

      styleTotal(totalRow);
    }

    ps.views = [{ state: "frozen", ySplit: 1 }];

    ps.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 4 }
    };

    // SHEET 3: SALES BREAKDOWN
    const bd = wb.addWorksheet("Sales Breakdown");

    setWidths(bd, [20, 12, 14, 18, 14]);

    const buckets = buildBuckets(range, list);

    const levelText = {
      none: "No sales",
      low: "Low",
      high: "High"
    };

    const levelStyle = {
      none: { fill: "FFFDE8E8", font: "FFAD414B" },
      low: { fill: "FFFFF1D9", font: "FF95631A" },
      high: { fill: "FFE6EFFF", font: "FF3863A7" }
    };

    const breakdownRows = buckets.map(bucket => [
      bucket.tip,
      bucket.orders || 0,
      bucket.units,
      bucket.value,
      levelText[unitLevel(bucket.units)]
    ]);

    nextRow = writeTable(
      bd,
      1,
      [
        range.type === "daily" ? "Hour" : "Date",
        "Orders",
        "Items sold",
        "Sales",
        "Level"
      ],
      breakdownRows,
      [null, "#,##0", "#,##0", PESO, null],
      [null, "right", "right", "right", "center"]
    );

    buckets.forEach((bucket, index) => {
      const cell = bd.getRow(2 + index).getCell(5);
      const style = levelStyle[unitLevel(bucket.units)];

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: style.fill }
      };

      cell.font = {
        bold: true,
        color: { argb: style.font }
      };
    });

    const breakdownTotal = bd.getRow(nextRow);

    breakdownTotal.getCell(1).value = "Total";
    breakdownTotal.getCell(2).value = list.length;
    breakdownTotal.getCell(3).value = unitsSold;
    breakdownTotal.getCell(4).value = total;

    breakdownTotal.getCell(2).numFmt = "#,##0";
    breakdownTotal.getCell(3).numFmt = "#,##0";
    breakdownTotal.getCell(4).numFmt = PESO;

    [2, 3, 4].forEach(column => {
      breakdownTotal.getCell(column).alignment = {
        horizontal: "right"
      };
    });

    styleTotal(breakdownTotal);

    bd.views = [{ state: "frozen", ySplit: 1 }];

    // SHEET 4: TRANSACTIONS
    const tx = wb.addWorksheet("Transactions");

    setWidths(tx, [
      14, 22, 24, 28, 16, 18, 44, 16, 16, 16, 16, 38
    ]);

    const transactionRows = list.map(order => [
      shortId(orderNumber(order)),
      dateValue(createdOf(order)),
      customerName(order),
      customerEmail(order),
      customerPhone(order),
      paymentMethod(order),
      itemList(order).map(item =>
        `${itemName(item)} ×${itemQty(item)}`
      ).join(", ") || "—",
      paymentStatus(order),
      totalOf(order),
      paymentKind(order) === "cash"
        ? (cashInfo(order).tendered ?? "")
        : "",
      paymentKind(order) === "cash"
        ? (cashInfo(order).change ?? "")
        : "",
      order.id ?? ""
    ]);

    nextRow = writeTable(
      tx,
      1,
      [
        "Order #", "Date", "Customer", "Email", "Phone",
        "Payment", "Items ordered", "Payment status", "Total",
        "Cash received", "Change", "Order ID"
      ],
      transactionRows,
      [
        null, DATE_FMT, null, null, null, null,
        null, null, PESO, PESO, PESO, null
      ],
      [
        null, null, null, null, null, null,
        null, null, "right", "right", "right", null
      ]
    );

    if (transactionRows.length) {
      const totalRow = tx.getRow(nextRow);

      totalRow.getCell(1).value = "Total";
      totalRow.getCell(9).value = total;
      totalRow.getCell(9).numFmt = PESO;

      totalRow.getCell(9).alignment = {
        horizontal: "right"
      };

      for (let column = 1; column <= 12; column++) {
        totalRow.getCell(column).border = borders;
      }

      styleTotal(totalRow);
    }

    tx.views = [{ state: "frozen", ySplit: 1 }];

    tx.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 12 }
    };

    // SHEET 5: ORDER ITEMS
    const oi = wb.addWorksheet("Order Items");

    setWidths(oi, [14, 22, 24, 12, 34, 10, 16, 16]);

    writeTable(
      oi,
      1,
      [
        "Order #", "Date", "Customer", "Type",
        "Product", "Qty", "Unit price", "Subtotal"
      ],
      itemRows,
      [null, DATE_FMT, null, null, null, "#,##0", PESO, PESO],
      [null, null, null, null, null, "right", "right", "right"]
    );

    oi.views = [{ state: "frozen", ySplit: 1 }];

    oi.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 8 }
    };

    // DOWNLOAD EXCEL FILE
    try {
      const buffer = await wb.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      const a = document.createElement("a");

      a.href = URL.createObjectURL(blob);
      a.download = `Fleurs_Kiosk_${typeName}_Report_${range.tag}.xlsx`;

      document.body.appendChild(a);

      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(a.href), 1500);

      notify("Excel report exported.", "success");
    } catch (error) {
      console.error(error);

      notify(
        "Could not create the Excel file: " + (error?.message || error),
        "error"
      );
    }
  }

  // ==========================================
  // ADD / EDIT PRODUCT
  // (builds its own modal, button and styles; no admin.html changes needed)
  // ==========================================

  const PRODUCT_IMAGE_BUCKET = "product-images";
  const PRODUCT_FORM_CATEGORIES = ["Solo", "Triple", "Bouquet"];
  const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

  let productEditingId = null;
  let productImageFile = null;
  let productPreviewUrl = "";
  let productSaving = false;

  function injectProductStyles() {
    if ($("pmStyles")) return;

    const style = document.createElement("style");

    style.id = "pmStyles";

    style.textContent = `
      .pm-overlay{position:fixed;inset:0;z-index:1000;background:rgba(40,32,36,.5);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}
      .pm-overlay[hidden]{display:none !important}
      .pm-panel{background:#fff;color:#302a2b;width:100%;max-width:480px;border-radius:16px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.25);max-height:92vh;overflow-y:auto}
      .pm-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}
      .pm-head h2{margin:0;font-size:20px}
      .pm-close{border:0;background:transparent;font-size:28px;line-height:1;cursor:pointer;color:#898184}
      .pm-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
      .pm-field label{font-size:13px;font-weight:600}
      .pm-field input,.pm-field select{padding:10px 12px;border:1px solid #e3dad9;border-radius:10px;font:inherit;background:#fff;color:inherit;width:100%;box-sizing:border-box}
      .pm-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .pm-photo-actions{display:flex;gap:8px;flex-wrap:wrap}
      .pm-preview{display:flex;align-items:center;justify-content:center;width:100%;height:200px;margin-top:6px;border:1px dashed #e3dad9;border-radius:12px;background:#fcfaf9;overflow:hidden;color:#898184;font-size:13px}
      .pm-preview img{width:100%;height:100%;object-fit:contain}
      .pm-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
      .pm-msg{padding:10px 12px;border-radius:10px;font-size:13px;margin-top:4px}
      .pm-msg[hidden]{display:none !important}
      .pm-msg.error{background:#fde8e8;color:#a93f4c}
      .pm-msg.info{background:#eef3fb;color:#3863a7}
    `;

    document.head.appendChild(style);
  }

  function ensureProductModal() {
    if ($("pmOverlay")) return;

    const overlay = document.createElement("div");

    overlay.id = "pmOverlay";
    overlay.className = "pm-overlay";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "pmTitle");

    overlay.innerHTML = `
      <div class="pm-panel">
        <div class="pm-head">
          <div>
            <h2 id="pmTitle">Add New Product</h2>
            <div class="muted small" id="pmSubtitle"></div>
          </div>
          <button type="button" class="pm-close" id="pmClose"
                  aria-label="Close">×</button>
        </div>

        <form id="pmForm" novalidate>
          <div class="pm-field">
            <label for="pmName">Product name</label>
            <input id="pmName" type="text" maxlength="120"
                   placeholder="Enter product name" required>
          </div>

          <div class="pm-field">
            <label for="pmCategory">Category</label>
            <select id="pmCategory" required>
              <option value="">Select category</option>
              ${PRODUCT_FORM_CATEGORIES.map(c =>
                `<option value="${c}">${c}</option>`
              ).join("")}
            </select>
          </div>

          <div class="pm-row">
            <div class="pm-field">
              <label for="pmPrice">Price (₱)</label>
              <input id="pmPrice" type="number" min="0.01" step="0.01"
                     inputmode="decimal" placeholder="0.00" required>
            </div>

            <div class="pm-field">
              <label for="pmStock" id="pmStockLabel">Initial stock</label>
              <input id="pmStock" type="number" min="0" step="1"
                     inputmode="numeric" placeholder="0" required>
            </div>
          </div>

          <div class="pm-field">
            <label>Photo</label>

            <div class="pm-photo-actions">
              <button type="button" class="btn small-btn"
                      id="pmGalleryBtn">📁 Choose photo</button>
              <button type="button" class="btn small-btn"
                      id="pmCameraBtn">📷 Take photo</button>
            </div>

            <input id="pmGallery" type="file" accept="image/*"
                   style="display:none">
            <input id="pmCamera" type="file" accept="image/*"
                   capture="environment" style="display:none">

            <div class="pm-preview" id="pmPreview">No photo yet</div>
          </div>

          <div id="pmMessage" class="pm-msg" hidden></div>

          <div class="pm-actions">
            <button type="button" class="btn" id="pmCancel">Cancel</button>
            <button type="submit" class="btn primary"
                    id="pmSave">Save product</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    $("pmClose").addEventListener("click", closeProductForm);
    $("pmCancel").addEventListener("click", closeProductForm);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeProductForm();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !overlay.hidden) {
        closeProductForm();
      }
    });

    $("pmGalleryBtn").addEventListener("click", () => $("pmGallery").click());
    $("pmCameraBtn").addEventListener("click", () => $("pmCamera").click());

    $("pmGallery").addEventListener("change", event =>
      handleProductPhoto(event.target, $("pmCamera"))
    );

    $("pmCamera").addEventListener("change", event =>
      handleProductPhoto(event.target, $("pmGallery"))
    );

    $("pmForm").addEventListener("submit", saveProduct);
  }

  function setProductMessage(message, type = "error") {
    const el = $("pmMessage");

    if (!el) return;

    if (!message) {
      el.hidden = true;
      el.textContent = "";
      return;
    }

    el.hidden = false;
    el.className = "pm-msg " + type;
    el.textContent = message;
  }

  function setProductPreview(url) {
    const box = $("pmPreview");

    if (!box) return;

    box.innerHTML = "";

    if (!url) {
      box.textContent = "No photo yet";
      return;
    }

    const img = document.createElement("img");

    img.alt = "Product preview";
    img.src = url;

    img.onerror = () => {
      box.textContent = "Photo could not be loaded";
    };

    box.appendChild(img);
  }

  function clearProductPreviewUrl() {
    if (productPreviewUrl) {
      URL.revokeObjectURL(productPreviewUrl);
      productPreviewUrl = "";
    }
  }

  function handleProductPhoto(input, otherInput) {
    const file = input.files && input.files[0];

    if (!file) return;

    if (!String(file.type).startsWith("image/")) {
      setProductMessage("Please choose an image file.");
      input.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setProductMessage("That photo is too large. Please use one under 15 MB.");
      input.value = "";
      return;
    }

    if (otherInput) otherInput.value = "";

    setProductMessage("");

    productImageFile = file;

    clearProductPreviewUrl();

    productPreviewUrl = URL.createObjectURL(file);

    setProductPreview(productPreviewUrl);
  }

  function openProductForm(productId = null) {
    injectProductStyles();
    ensureProductModal();

    const product = productId
      ? products.find(p => String(p.id) === String(productId))
      : null;

    if (productId && !product) {
      notify("Product not found. Refresh the inventory and try again.", "error");
      return;
    }

    productEditingId = product ? product.id : null;
    productImageFile = null;

    clearProductPreviewUrl();

    $("pmTitle").textContent = product ? "Edit Product" : "Add New Product";

    $("pmSubtitle").textContent = product
      ? "Update the details, price, photo or stock."
      : "Enter the product details below.";

    $("pmName").value = product ? (product.name || "") : "";

    const normalized = product ? categoryFromValue(product.category) : "";

    $("pmCategory").value =
      PRODUCT_FORM_CATEGORIES.includes(normalized) ? normalized : "";

    $("pmPrice").value = product ? (Number(product.price) || "") : "";
    $("pmStock").value = product ? (Number(product.stock) || 0) : "";

    $("pmStockLabel").textContent = product ? "Stock" : "Initial stock";
    $("pmSave").textContent = product ? "Save changes" : "Save product";
    $("pmSave").disabled = false;

    $("pmGallery").value = "";
    $("pmCamera").value = "";

    setProductPreview(product ? String(product.image_url || "").trim() : "");
    setProductMessage("");

    $("pmOverlay").hidden = false;

    $("pmName").focus();
  }

  function closeProductForm() {
    if (productSaving) return;

    const overlay = $("pmOverlay");

    if (overlay) overlay.hidden = true;

    clearProductPreviewUrl();

    productImageFile = null;
    productEditingId = null;
  }

  // Shrinks big phone photos before upload (max 1200px, JPEG).
  function compressImage(file, maxSize = 1200, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);

        const scale = Math.min(
          1,
          maxSize / Math.max(img.naturalWidth, img.naturalHeight)
        );

        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));

        const canvas = document.createElement("canvas");

        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          blob => blob
            ? resolve(blob)
            : reject(new Error("Could not process the photo.")),
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read the photo."));
      };

      img.src = url;
    });
  }

  async function uploadProductImage(file) {
    let body = file;
    let contentType = file.type || "image/jpeg";
    let ext = (file.name.split(".").pop() || "jpg").toLowerCase();

    try {
      body = await compressImage(file);
      contentType = "image/jpeg";
      ext = "jpg";
    } catch (error) {
      console.warn("Photo compression skipped:", error.message);
    }

    const path =
      `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await sb.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(path, body, {
        contentType,
        cacheControl: "3600",
        upsert: false
      });

    if (error) {
      throw new Error(
        "Photo upload failed: " + error.message +
        ` (check that the "${PRODUCT_IMAGE_BUCKET}" bucket exists and allows uploads)`
      );
    }

    const { data } = sb.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new Error("Photo uploaded but its public URL could not be created.");
    }

    return data.publicUrl;
  }

  // Keeps the same raw category text your database already uses
  // (e.g. "solo-flower") instead of forcing "Solo".
  function rawCategoryFor(categoryName, existing) {
    if (existing && categoryFromValue(existing.category) === categoryName) {
      return existing.category;
    }

    const match = products.find(p =>
      p.category && categoryFromValue(p.category) === categoryName
    );

    return match ? match.category : categoryName;
  }

  async function saveProduct(event) {
    event.preventDefault();

    if (productSaving) return;

    const name = $("pmName").value.trim();
    const categoryName = $("pmCategory").value;
    const price = Number($("pmPrice").value);
    const stockRaw = $("pmStock").value.trim();
    const stock = Number(stockRaw);

    if (!name) {
      setProductMessage("Please enter the product name.");
      $("pmName").focus();
      return;
    }

    if (!PRODUCT_FORM_CATEGORIES.includes(categoryName)) {
      setProductMessage("Please select a category.");
      $("pmCategory").focus();
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setProductMessage("Price must be greater than zero.");
      $("pmPrice").focus();
      return;
    }

    if (stockRaw === "" || !Number.isSafeInteger(stock) || stock < 0) {
      setProductMessage("Stock must be a whole number, zero or higher.");
      $("pmStock").focus();
      return;
    }

    const existing = productEditingId
      ? products.find(p => String(p.id) === String(productEditingId))
      : null;

    productSaving = true;

    $("pmSave").disabled = true;
    $("pmSave").textContent = "Saving…";

    setProductMessage("");

    try {
      const { data: sessionData, error: sessionError } =
        await sb.auth.getSession();

      if (sessionError) throw sessionError;

      if (!sessionData.session) {
        throw new Error("Please sign in again before saving products.");
      }

      let imageUrl = existing ? (existing.image_url || null) : null;

      if (productImageFile) {
        $("pmSave").textContent = "Uploading photo…";
        imageUrl = await uploadProductImage(productImageFile);
        $("pmSave").textContent = "Saving…";
      }

      const payload = {
        name,
        category: rawCategoryFor(categoryName, existing),
        price,
        stock,
        image_url: imageUrl
      };

      let saved;

      if (existing) {
        const { data, error } = await sb
          .from("products")
          .update(payload)
          .eq("id", existing.id)
          .select("*")
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          throw new Error(
            "Nothing was updated. Supabase blocked the change (missing UPDATE permission on the products table for this account)."
          );
        }

        saved = data;

        const index = products.findIndex(
          p => String(p.id) === String(saved.id)
        );

        if (index !== -1) {
          products[index] = { ...products[index], ...saved };
        }
      } else {
        const { data, error } = await sb
          .from("products")
          .insert({ ...payload, is_active: true })
          .select("*")
          .single();

        if (error) throw error;

        saved = data;

        products.push(saved);
      }

      productSaving = false;

      closeProductForm();
      renderInventory();

      inventoryMessage(
        existing
          ? `${saved.name} was updated.`
          : `${saved.name} was added to your products.`,
        "success"
      );

      notify(existing ? "Product updated." : "Product added.", "success");
    } catch (error) {
      console.error("Save product failed:", error);

      setProductMessage(
        (error?.message || String(error)) +
        (/row-level security|permission|policy/i.test(error?.message || "")
          ? " Check your Supabase staff permissions (RLS policies)."
          : "")
      );
    } finally {
      productSaving = false;

      if ($("pmSave")) {
        $("pmSave").disabled = false;
        $("pmSave").textContent =
          productEditingId ? "Save changes" : "Save product";
      }
    }
  }

  function setupProductManager() {
    injectProductStyles();
    ensureProductModal();

    let addBtn = $("addProductButton");

    if (!addBtn) {
      addBtn = document.createElement("button");

      addBtn.id = "addProductButton";
      addBtn.type = "button";
      addBtn.className = "btn primary";
      addBtn.textContent = "+ Add Product";

      const toolbar = document.querySelector(".inventory-toolbar");
      const refresh = $("inventoryRefresh");

      if (toolbar && refresh && refresh.parentElement === toolbar) {
        toolbar.insertBefore(addBtn, refresh);
      } else if (toolbar) {
        toolbar.appendChild(addBtn);
      } else if ($("page-inventory")) {
        $("page-inventory").prepend(addBtn);
      }
    }

    addBtn.addEventListener("click", () => openProductForm());

    if ($("inventoryTable")) {
      $("inventoryTable").addEventListener("click", event => {
        const button = event.target.closest("[data-edit-product]");

        if (button) openProductForm(button.dataset.editProduct);
      });
    }
  }

  // LOGIN
  $("loginForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!sb) {
      $("loginMessage").textContent = validConfig()
        ? "Supabase library did not load. Check the Supabase script in admin.html."
        : "Please configure your Supabase URL and anon/publishable key in the code first.";

      return;
    }

    $("loginButton").disabled = true;
    $("loginButton").textContent = "Signing in…";
    $("loginMessage").textContent = "";

    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email: $("loginEmail").value.trim(),
        password: $("loginPassword").value
      });

      if (error) throw error;

      $("loginScreen").classList.add("hidden");
      $("app").classList.remove("hidden");

      setAdminEmail(data.user?.email);

      await refreshAll();
    } catch (error) {
      $("loginMessage").textContent =
        error?.message || "Sign-in failed.";
    } finally {
      $("loginButton").disabled = false;
      $("loginButton").textContent = "Sign in";
    }
  });

  // NAVIGATION
  document.querySelectorAll(".nav-btn[data-page]").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });

  document.querySelectorAll("[data-go]").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.go));
  });

  $("topRefresh").addEventListener("click", refreshAll);

  $("menuButton").addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
  });

  // PROFILE DROPDOWN AND LOGOUT CONFIRMATION
  const closeProfileMenu = () => {
    $("profileDropdown").classList.add("hidden");
    $("profileButton").setAttribute("aria-expanded", "false");
  };

  $("profileButton").addEventListener("click", event => {
    event.stopPropagation();

    const open =
      $("profileDropdown").classList.toggle("hidden") === false;

    $("profileButton").setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("click", event => {
    if (!event.target.closest("#profileMenu")) {
      closeProfileMenu();
    }
  });

  $("logoutButton").addEventListener("click", () => {
    closeProfileMenu();
    $("logoutModal").classList.remove("hidden");
  });

  const closeLogoutModal = () => {
    $("logoutModal").classList.add("hidden");
  };

  $("cancelLogout").addEventListener("click", closeLogoutModal);

  $("logoutModal").addEventListener("click", event => {
    if (event.target === $("logoutModal")) {
      closeLogoutModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeLogoutModal();
      closeProfileMenu();
    }
  });

  $("confirmLogout").addEventListener("click", async () => {
    if (!sb) return;

    $("confirmLogout").disabled = true;
    $("confirmLogout").textContent = "Logging out…";

    try {
      const { error } = await sb.auth.signOut();

      if (error) {
        notify("Could not sign out: " + error.message, "error");
        return;
      }

      orders = [];
      feedback = [];
      products = [];

      closeLogoutModal();

      $("app").classList.add("hidden");
      $("loginScreen").classList.remove("hidden");
      $("loginPassword").value = "";
      $("loginMessage").textContent = "";

      // Reset inventory filters so the next login starts clean
      if ($("inventoryCategoryFilter")) {
        $("inventoryCategoryFilter").value = "all";
      }

      showPage("dashboard");
    } finally {
      $("confirmLogout").disabled = false;
      $("confirmLogout").textContent = "Yes, log out";
    }
  });

  // ORDER FILTERS
  $("orderSearch").addEventListener("input", renderOrders);
  $("orderDateFilter").addEventListener("change", renderOrders);

  $("clearOrderFilters").addEventListener("click", () => {
    $("orderSearch").value = "";
    $("orderDateFilter").value = "";

    renderOrders();
  });

  // INVENTORY FILTERS AND STOCK UPDATES
  if ($("inventorySearch")) {
    $("inventorySearch").addEventListener("input", renderInventory);
  }

  if ($("inventoryStockFilter")) {
    $("inventoryStockFilter").addEventListener("change", renderInventory);
  }

  if ($("inventoryCategoryFilter")) {
    $("inventoryCategoryFilter").addEventListener("change", renderInventory);
  }

  if ($("inventoryRefresh")) {
    $("inventoryRefresh").addEventListener("click", refreshInventory);
  }

  if ($("inventoryTable")) {
    $("inventoryTable").addEventListener("submit", async event => {
      const form = event.target.closest("[data-inventory-form]");

      if (!form) return;

      event.preventDefault();

      const productId = form.dataset.inventoryForm;

      await saveInventoryStock(productId, form);
    });
  }

  // CUSTOMER AND FEEDBACK FILTERS
  $("customerSearch").addEventListener("input", renderCustomers);
  $("feedbackSearch").addEventListener("input", renderFeedback);
  $("feedbackRatingFilter").addEventListener("change", renderFeedback);
  $("feedbackDateFrom").addEventListener("change", renderFeedback);
  $("feedbackDateTo").addEventListener("change", renderFeedback);

  $("clearFeedbackFilters").addEventListener("click", () => {
    $("feedbackSearch").value = "";
    $("feedbackRatingFilter").value = "";
    $("feedbackDateFrom").value = "";
    $("feedbackDateTo").value = "";

    renderFeedback();
  });

  // REPORTS AND DASHBOARD CONTROLS
  $("reportMonth").addEventListener("change", renderReport);
  $("reportDay").addEventListener("change", renderReport);

  document.querySelectorAll("#dashPeriodSeg button").forEach(btn => {
    btn.addEventListener("click", () => {
      dashType = btn.dataset.type;
      dashAnchor = new Date();

      renderDashboardChart();
    });
  });

  $("dashPrev").addEventListener("click", () => shiftDashboard(-1));
  $("dashNext").addEventListener("click", () => shiftDashboard(1));

  $("reportType").addEventListener("change", renderReport);
  $("generateReport").addEventListener("click", renderReport);
  $("exportExcel").addEventListener("click", exportReport);

  // ORDER DETAIL MODAL
  $("closeOrderModal").addEventListener("click", () => {
    $("orderModal").classList.add("hidden");
  });

  $("orderModal").addEventListener("click", event => {
    if (event.target === $("orderModal")) {
      $("orderModal").classList.add("hidden");
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      $("orderModal").classList.add("hidden");
      $("sidebar").classList.remove("open");
    }
  });

  // VIEW DETAILS BUTTONS FOR ORDERS AND CUSTOMERS
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-view-order]");

    if (button) {
      openOrderDetails(button.dataset.viewOrder);
    }
  });

  // TODAY'S DATE
  $("todayLabel").textContent = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const now = new Date();

  $("reportMonth").value =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  $("reportDay").value = dateKey(now);

  syncReportControls();
  setupBranding();
  setupProductManager();

  // INITIALIZE SUPABASE (single client, created only once)
  if (!validConfig()) {
    $("loginMessage").textContent =
      "Set SUPABASE_URL and SUPABASE_ANON_KEY in the configuration section of this file.";
  } else if (!window.supabase) {
    $("loginMessage").textContent =
      "Supabase library did not load. Check the Supabase script in admin.html.";
  } else {
   sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

window.adminSupabase = sb;

    sb.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        console.warn("Session check:", error.message);
        return;
      }

      if (data.session) {
        $("loginScreen").classList.add("hidden");
        $("app").classList.remove("hidden");

        setAdminEmail(data.session.user?.email);

        await refreshAll();
      }
    });
  }
})();