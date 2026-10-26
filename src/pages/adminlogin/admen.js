
(() => {
  "use strict";

  const SUPABASE_URL = "https://ylkrjvmwwuhitqmysrxf.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsa3Jqdm13d3VoaXRxbXlzcnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjAyMTIsImV4cCI6MjEwNjU5NjIxMn0.CyrwrASzk3EAJ5ChSgSGExl0qffdXOHkzg1_o7lPCFA";

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
    units <= 0 ? "none" : units <= LOW_MAX_UNITS ? "low" : "high";

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
    "payment_method",
    "payment_type",
    "payment_channel",
    "payment_source",
    "mode_of_payment",
    "payment_mode",
    "payment_option",
    "payment_provider",
    "payment_method_name",
    "paymentMethod",
    "paymentMethodName",
    "checkout_method",
    "paymongo_method",
    "method"
  ];

  const PAY_REF_KEYS = [
    "payment_reference",
    "payment_ref",
    "paymongo_payment_id",
    "paymongo_id",
    "payment_intent_id"
  ];

  const TENDER_KEYS = [
    "amount_tendered",
    "cash_tendered",
    "cash_received",
    "cash_given",
    "tendered_amount",
    "amount_received",
    "cash_amount"
  ];

  const CHANGE_KEYS = [
    "change_amount",
    "change",
    "change_due",
    "exchange",
    "exchange_amount",
    "sukli",
    "cash_change",
    "change_given",
    "change_returned"
  ];

  function normalizePaymentMethod(o) {
    const value = first(o, PAY_METHOD_KEYS, "");

    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");
  }

  const paymentKind = o => {
    const raw = normalizePaymentMethod(o);

    if (!raw) return "unknown";

    if (
      /\bg\s*cash\b/.test(raw) ||
      /\bgcash\b/.test(raw) ||
      /\bgcash\b/.test(raw.replace(/\s/g, ""))
    ) {
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

    const tendered =
      t === null ? null : Number(t);

    let change =
      c === null ? null : Number(c);

    if (
      change === null &&
      Number.isFinite(tendered)
    ) {
      change = Math.max(
        0,
        tendered - totalOf(o)
      );
    }

    return {
      tendered: Number.isFinite(tendered)
        ? tendered
        : null,

      change: Number.isFinite(change)
        ? change
        : null
    };
  };

  const paymentBadge = o => {
    const kind = paymentKind(o);
    const label = paymentMethod(o);

    return `
      <span class="badge pay-${esc(kind)}">
        ${esc(label)}
      </span>
    `;
  };

  const paymentStatus = o =>
    first(
      o,
      ["payment_status", "payment_state"],
      "Not specified"
    );

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
    toastTimer = setTimeout(() => el.classList.add("hidden"), 3600);
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

  function customerKey(o) {
    const email = customerEmail(o).trim().toLowerCase();
    if (email) return "email:" + email;

    const phone = customerPhone(o).trim();
    if (phone) return "phone:" + phone;

    const name = customerName(o).trim().toLowerCase();
    return name !== "customer" ? "name:" + name : "";
  }

  function uniqueCustomers(list) {
    const map = new Map();

    list.forEach(o => {
      const key = customerKey(o);
      if (key && !map.has(key)) map.set(key, o);
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

  async function refreshAll() {
    setGlobalMessage("");
    notify("Loading store data…");

    try {
      const results = await Promise.allSettled([
        loadOrders(), loadFeedback(), loadProducts()
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

    document.querySelectorAll(".page").forEach(el => {
      el.classList.add("hidden");
    });

    $("page-" + page)?.classList.remove("hidden");

    document.querySelectorAll(".nav-btn[data-page]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.page === page);
    });

    const titles = {
      dashboard: "Dashboard",
      orders: "Orders & Transactions",
      customers: "Customers",
      feedback: "Feedback & Ratings",
      reports: "Sales Reports"
    };

    $("topTitle").textContent = titles[page] || "Dashboard";
    $("sidebar").classList.remove("open");

    if (page === "orders") renderOrders();
    if (page === "customers") renderCustomers();
    if (page === "feedback") renderFeedback();
    if (page === "reports") renderReport();
  }

  function renderAll() {
    renderDashboard();
    renderOrders();
    renderCustomers();
    renderFeedback();
    renderReport();
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
      ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1) + " ★"
      : "—";

    $("statReviewCount").textContent =
      `${feedback.length} review(s) loaded`;

    renderDashboardChart();

    $("statusBreakdown").innerHTML = orders.length
      ? `<div class="bar-row">
          <div class="row between">
            <span>${statusBadge()}</span>
            <strong>${orders.length}</strong>
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

    const max = Math.max(...data.map(d => Number(d.value) || 0), 1);

    el.innerHTML = data.map(d => {
      const v = Number(d.value) || 0;
      const u = Number(d.units) || 0;
      const level = unitLevel(u);
      const height = Math.max(v > 0 ? 5 : 1, (v / max) * 150);
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
        orderNumber(o), customerName(o), customerEmail(o), customerPhone(o)
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
      return [customerName(o), customerEmail(o), customerPhone(o)]
        .join(" ").toLowerCase().includes(search);
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
      ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1) + " ★"
      : "—";

    $("feedbackFive").textContent =
      validRatings.filter(n => n === 5).length;

    $("feedbackOne").textContent =
      validRatings.filter(n => n === 1).length;

    const search = ($("feedbackSearch").value || "").toLowerCase().trim();
    const rating = Number($("feedbackRatingFilter").value) || 0;

    const filtered = [...dated].filter(r => {
      const text = [
        reviewName(r), reviewOrder(r), reviewComment(r)
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
          weekday: "long", year: "numeric", month: "long", day: "numeric"
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
            weekday: "long", month: "short", day: "numeric"
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
            month: "short", day: "numeric"
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
    const shown =
      value === "" || value === null || value === undefined
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
      ITEMS_RELATION, "items", "orderItems",
      "tracking_number", "tracking_no", "tracking_code"
    ]);

    const fields = Object.entries(o).filter(([key, value]) =>
      !exclude.has(key) &&
      !HIDDEN_FIELD.test(key) &&
      (value === null ||
        ["string", "number", "boolean"].includes(typeof value))
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

    const { data } = sb.storage
      .from(PROOF_BUCKET)
      .getPublicUrl(path);

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
            <img
              src="${esc(url)}"
              alt="Proof of payment"
              loading="lazy"
              style="max-width:100%;max-height:400px;object-fit:contain;"
              onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden')"
            >
            <div class="proof-placeholder hidden">
              Image could not be loaded. Check Storage permissions or the image path.
            </div>
          </a>
          <div class="small muted wrap" style="margin-top:8px">
            ${esc(raw)}
          </div>
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
    const subtotal = items.reduce((sum, i) => sum + itemSubtotal(i), 0);
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
          ${detailField("Notes / instructions", first(o, [
            "notes", "order_notes", "special_instructions", "customer_note"
          ], ""))}
          ${detailField("Cancellation reason", first(o, [
            "cancellation_reason", "cancel_reason"
          ], ""))}
        </div>
      </div>

      ${allFieldsSection(o)}
    `;

    $("orderModal").classList.remove("hidden");
  }

  const PRODUCT_CATEGORIES = ["Solo", "Triple", "Bouquet"];

  const categoryOf = i => {
    const text = (
      String(first(i, ["category", "product_category", "type"], "")) +
      " " + itemName(i)
    ).toLowerCase();

    return PRODUCT_CATEGORIES.find(c =>
      text.includes(c.toLowerCase())
    ) || "Other";
  };

  async function exportReport() {
    if (!window.ExcelJS) {
      notify("Excel export library failed to load. Check your internet connection.", "error");
      return;
    }

    const range = getReportRange();
    const typeName = range.type[0].toUpperCase() + range.type.slice(1);
    const list = reportOrders(range);
    const total = list.reduce((sum, o) => sum + totalOf(o), 0);
    const unitsSold = list.reduce((sum, o) => sum + orderUnits(o), 0);

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
      const h = ws.getRow(startRow);

      headers.forEach((t, i) => {
        h.getCell(i + 1).value = t;
      });

      styleHeader(h);

      rows.forEach((r, ri) => {
        const row = ws.getRow(startRow + 1 + ri);

        r.forEach((v, i) => {
          const c = row.getCell(i + 1);
          c.value = v;

          if (fmts[i]) c.numFmt = fmts[i];

          c.border = borders;
          c.alignment = {
            vertical: "middle",
            horizontal: aligns[i] || undefined
          };

          if (ri % 2) c.fill = zebra;
        });
      });

      return startRow + rows.length + 1;
    };

    const sectionTitle = (ws, rowNum, text) => {
      const c = ws.getRow(rowNum).getCell(1);
      c.value = text;
      c.font = {
        bold: true,
        size: 12,
        color: { argb: INK }
      };
    };

    const setWidths = (ws, widths) => {
      widths.forEach((w, i) => {
        ws.getColumn(i + 1).width = w;
      });
    };

    const catTotals = new Map(
      PRODUCT_CATEGORIES.map(c => [c, { qty: 0, sales: 0 }])
    );

    const productMap = new Map();
    const itemRows = [];

    list.forEach(o => itemList(o).forEach(i => {
      const cat = categoryOf(i);
      const name = itemName(i);
      const qty = itemQty(i);
      const sub = itemSubtotal(i);

      if (!catTotals.has(cat)) {
        catTotals.set(cat, { qty: 0, sales: 0 });
      }

      catTotals.get(cat).qty += qty;
      catTotals.get(cat).sales += sub;

      const key = cat + "||" + name;

      if (!productMap.has(key)) {
        productMap.set(key, {
          cat,
          name,
          qty: 0,
          sales: 0
        });
      }

      productMap.get(key).qty += qty;
      productMap.get(key).sales += sub;

      itemRows.push([
        shortId(orderNumber(o)),
        dateValue(createdOf(o)),
        customerName(o),
        cat,
        name,
        qty,
        itemPrice(i),
        sub
      ]);
    }));

    const catOrder = [...PRODUCT_CATEGORIES, "Other"];

    const productRows = [...productMap.values()]
      .sort((a, b) =>
        (catOrder.indexOf(a.cat) - catOrder.indexOf(b.cat)) ||
        (b.qty - a.qty)
      )
      .map(p => [p.cat, p.name, p.qty, p.sales]);

    const wb = new ExcelJS.Workbook();
    wb.creator = "Fleurs Kiosk";
    wb.created = new Date();

    // Sheet 1: Summary
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

    kpis.forEach(([label, value, fmt], idx) => {
      const row = sm.getRow(7 + idx);

      row.getCell(1).value = label;
      row.getCell(2).value = value;
      row.getCell(2).numFmt = fmt;
      row.getCell(2).alignment = { horizontal: "right" };
      row.getCell(1).font = { bold: true };

      [1, 2].forEach(n => {
        row.getCell(n).border = borders;
        if (idx % 2) row.getCell(n).fill = zebra;
      });
    });

    let r = 7 + kpis.length + 2;

    sectionTitle(sm, r, "What was sold (by type)");

    const catRows = [...catTotals.entries()]
      .filter(([name, v]) =>
        PRODUCT_CATEGORIES.includes(name) || v.qty > 0
      )
      .map(([name, v]) => [name, v.qty, v.sales]);

    r = writeTable(
      sm,
      r + 1,
      ["Type", "Items sold", "Sales"],
      catRows,
      [null, "#,##0", PESO],
      [null, "right", "right"]
    );

    const tr = sm.getRow(r);
    tr.getCell(1).value = "Total";
    tr.getCell(2).value = catRows.reduce((s, x) => s + x[1], 0);
    tr.getCell(3).value = catRows.reduce((s, x) => s + x[2], 0);
    tr.getCell(2).numFmt = "#,##0";
    tr.getCell(3).numFmt = PESO;
    tr.getCell(2).alignment = { horizontal: "right" };
    tr.getCell(3).alignment = { horizontal: "right" };
    styleTotal(tr);

    r += 2;
    sectionTitle(sm, r, "How customers paid");

    const payMap = new Map([
      ["GCash", { n: 0, sales: 0 }],
      ["Cash", { n: 0, sales: 0 }]
    ]);

    list.forEach(o => {
      const label = paymentMethod(o);

      if (!payMap.has(label)) {
        payMap.set(label, { n: 0, sales: 0 });
      }

      payMap.get(label).n += 1;
      payMap.get(label).sales += totalOf(o);
    });

    const payRows = [...payMap.entries()].map(([label, v]) => [
      label, v.n, v.sales
    ]);

    r = writeTable(
      sm,
      r + 1,
      ["Payment method", "Orders", "Sales"],
      payRows,
      [null, "#,##0", PESO],
      [null, "right", "right"]
    );

    r += 1;
    sm.mergeCells(`A${r}:D${r}`);
    sm.getCell(`A${r}`).value =
      "Order status is shown as Completed in this admin view. Sales total adds up the total of every order in the period.";
    sm.getCell(`A${r}`).font = {
      italic: true,
      size: 9,
      color: { argb: MUTED }
    };

    // Sheet 2: Products Sold
    const ps = wb.addWorksheet("Products Sold");

    setWidths(ps, [14, 38, 12, 18]);

    let nr = writeTable(
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
      const t = ps.getRow(nr);

      t.getCell(1).value = "Total";
      t.getCell(3).value = productRows.reduce((s, x) => s + x[2], 0);
      t.getCell(4).value = productRows.reduce((s, x) => s + x[3], 0);
      t.getCell(3).numFmt = "#,##0";
      t.getCell(4).numFmt = PESO;
      t.getCell(3).alignment = { horizontal: "right" };
      t.getCell(4).alignment = { horizontal: "right" };

      styleTotal(t);
    }

    ps.views = [{ state: "frozen", ySplit: 1 }];
    ps.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 4 }
    };

    // Sheet 3: Sales Breakdown
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

    const bRows = buckets.map(b => [
      b.tip,
      b.orders || 0,
      b.units,
      b.value,
      levelText[unitLevel(b.units)]
    ]);

    nr = writeTable(
      bd,
      1,
      [
        range.type === "daily" ? "Hour" : "Date",
        "Orders",
        "Items sold",
        "Sales",
        "Level"
      ],
      bRows,
      [null, "#,##0", "#,##0", PESO, null],
      [null, "right", "right", "right", "center"]
    );

    buckets.forEach((b, idx) => {
      const c = bd.getRow(2 + idx).getCell(5);
      const st = levelStyle[unitLevel(b.units)];

      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: st.fill }
      };

      c.font = {
        bold: true,
        color: { argb: st.font }
      };
    });

    const bt = bd.getRow(nr);
    bt.getCell(1).value = "Total";
    bt.getCell(2).value = list.length;
    bt.getCell(3).value = unitsSold;
    bt.getCell(4).value = total;
    bt.getCell(2).numFmt = "#,##0";
    bt.getCell(3).numFmt = "#,##0";
    bt.getCell(4).numFmt = PESO;

    [2, 3, 4].forEach(n => {
      bt.getCell(n).alignment = { horizontal: "right" };
    });

    styleTotal(bt);
    bd.views = [{ state: "frozen", ySplit: 1 }];

    // Sheet 4: Transactions
    const tx = wb.addWorksheet("Transactions");

    setWidths(tx, [
      14, 22, 24, 28, 16, 18, 44, 16, 16, 16, 16, 38
    ]);

    const txRows = list.map(o => [
      shortId(orderNumber(o)),
      dateValue(createdOf(o)),
      customerName(o),
      customerEmail(o),
      customerPhone(o),
      paymentMethod(o),
      itemList(o).map(i => `${itemName(i)} ×${itemQty(i)}`).join(", ") || "—",
      paymentStatus(o),
      totalOf(o),
      paymentKind(o) === "cash" ? (cashInfo(o).tendered ?? "") : "",
      paymentKind(o) === "cash" ? (cashInfo(o).change ?? "") : "",
      o.id ?? ""
    ]);

    nr = writeTable(
      tx,
      1,
      [
        "Order #", "Date", "Customer", "Email", "Phone",
        "Payment", "Items ordered", "Payment status", "Total",
        "Cash received", "Change", "Order ID"
      ],
      txRows,
      [null, DATE_FMT, null, null, null, null, null, null, PESO, PESO, PESO, null],
      [null, null, null, null, null, null, null, null, "right", "right", "right", null]
    );

    if (txRows.length) {
      const t = tx.getRow(nr);

      t.getCell(1).value = "Total";
      t.getCell(9).value = total;
      t.getCell(9).numFmt = PESO;
      t.getCell(9).alignment = { horizontal: "right" };

      for (let n = 1; n <= 12; n++) {
        t.getCell(n).border = borders;
      }

      styleTotal(t);
    }

    tx.views = [{ state: "frozen", ySplit: 1 }];
    tx.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 12 }
    };

    // Sheet 5: Order Items
    const oi = wb.addWorksheet("Order Items");

    setWidths(oi, [14, 22, 24, 12, 34, 10, 16, 16]);

    writeTable(
      oi,
      1,
      ["Order #", "Date", "Customer", "Type", "Product", "Qty", "Unit price", "Subtotal"],
      itemRows,
      [null, DATE_FMT, null, null, null, "#,##0", PESO, PESO],
      [null, null, null, null, null, "right", "right", "right"]
    );

    oi.views = [{ state: "frozen", ySplit: 1 }];
    oi.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 8 }
    };

    // Download Excel file
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

  // Login
  $("loginForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!validConfig()) {
      $("loginMessage").textContent =
        "Please configure your Supabase URL and anon/publishable key in the code first.";
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

  // Navigation
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

  // Profile dropdown and logout confirmation
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

      showPage("dashboard");
    } finally {
      $("confirmLogout").disabled = false;
      $("confirmLogout").textContent = "Yes, log out";
    }
  });

  // Order filters
  $("orderSearch").addEventListener("input", renderOrders);
  $("orderDateFilter").addEventListener("change", renderOrders);

  $("clearOrderFilters").addEventListener("click", () => {
    $("orderSearch").value = "";
    $("orderDateFilter").value = "";
    renderOrders();
  });

  // Customer and feedback filters
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

  // Reports and dashboard controls
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

  // Order detail modal
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

  // View Details buttons work for both Orders and Customers tables.
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-view-order]");

    if (button) {
      openOrderDetails(button.dataset.viewOrder);
    }
  });

  // Today's date
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

  // Initialize Supabase
  if (!validConfig()) {
    $("loginMessage").textContent =
      "Set SUPABASE_URL and SUPABASE_ANON_KEY in the configuration section of this HTML.";
  } else if (!window.supabase) {
    $("loginMessage").textContent =
      "Supabase library did not load. Check the Supabase script in admin.html.";
  } else {
    sb = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

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
