
/* ==========================================
   FLEURS ADMIN REALTIME NOTIFICATIONS
   File: src/pages/adminlogin/admin-realtime.js
   ========================================== */

(() => {
  "use strict";

  const ROOT_ID = "adminRealtimeRoot";
  const CHANNEL_NAME = "fleurs-admin-realtime";
  const MAX_NOTIFICATIONS = 30;

  let client = null;
  let channel = null;
  let activeUserId = null;
  let knownOrderIds = new Set();
  let notifications = [];
  let unreadCount = 0;
  let isOpen = false;

  const $ = (selector) => document.querySelector(selector);

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function addStyles() {
    if ($("#adminRealtimeStyles")) return;

    const style = document.createElement("style");
    style.id = "adminRealtimeStyles";

    style.textContent = `
      #${ROOT_ID} {
        position: relative;
        display: inline-flex;
        align-items: center;
        margin-right: 8px;
        z-index: 1000;
      }

      #${ROOT_ID} .art-bell {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: #fff;
        color: #302a2b;
        cursor: pointer;
        font-size: 20px;
      }

      #${ROOT_ID} .art-count {
        position: absolute;
        top: -5px;
        right: -5px;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        border-radius: 999px;
        background: #dc2626;
        color: #fff;
        font: 700 11px/18px system-ui, sans-serif;
        text-align: center;
        box-sizing: border-box;
      }

      #${ROOT_ID} .art-count[hidden],
      #${ROOT_ID} .art-panel[hidden] {
        display: none !important;
      }

      #${ROOT_ID} .art-panel {
        position: absolute;
        right: 0;
        top: calc(100% + 10px);
        width: min(360px, calc(100vw - 32px));
        max-height: 420px;
        overflow: auto;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        background: #fff;
        color: #302a2b;
        box-shadow: 0 14px 40px rgba(0,0,0,.16);
        padding: 12px;
      }

      #${ROOT_ID} .art-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 2px 2px 10px;
        border-bottom: 1px solid #e5e7eb;
        font-weight: 700;
      }

      #${ROOT_ID} .art-clear {
        border: 0;
        background: transparent;
        color: inherit;
        text-decoration: underline;
        cursor: pointer;
        font-size: 12px;
      }

      #${ROOT_ID} .art-item {
        display: block;
        width: 100%;
        text-align: left;
        padding: 11px 8px;
        border: 0;
        border-bottom: 1px solid #e5e7eb;
        background: transparent;
        color: inherit;
        cursor: pointer;
        border-radius: 8px;
      }

      #${ROOT_ID} .art-item:hover {
        background: #f8f5f6;
      }

      #${ROOT_ID} .art-item strong,
      #${ROOT_ID} .art-item span {
        display: block;
      }

      #${ROOT_ID} .art-item strong {
        font-size: 13px;
        margin-bottom: 3px;
      }

      #${ROOT_ID} .art-item span {
        font-size: 12px;
        opacity: .75;
        line-height: 1.4;
      }

      #${ROOT_ID} .art-empty,
      #${ROOT_ID} .art-status {
        padding: 12px 6px;
        font-size: 12px;
        opacity: .7;
      }

      #${ROOT_ID} .art-empty {
        text-align: center;
      }
    `;

    document.head.appendChild(style);
  }

  function formatTime(value) {
    if (!value) return "Just now";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Just now";

    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function orderLabel(order) {
    return order?.order_number ||
      order?.order_no ||
      order?.id ||
      "New order";
  }

  function refreshAdmin() {
    const refreshButton = $("#topRefresh");

    if (refreshButton) {
      refreshButton.click();
    } else {
      window.dispatchEvent(
        new CustomEvent("fleurs:admin-refresh")
      );
    }
  }

  function renderNotifications() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    const count = root.querySelector(".art-count");
    const panel = root.querySelector(".art-panel");
    const list = root.querySelector(".art-list");
    const status = root.querySelector(".art-status");
    const bell = root.querySelector(".art-bell");

    count.textContent = unreadCount > 99
      ? "99+"
      : String(unreadCount);

    count.hidden = unreadCount < 1;
    panel.hidden = !isOpen;

    bell.setAttribute("aria-expanded", String(isOpen));

    if (!notifications.length) {
      list.innerHTML =
        '<div class="art-empty">No new order notifications yet.</div>';
    } else {
      list.innerHTML = notifications.map((item) => `
        <button
          type="button"
          class="art-item"
          data-order-id="${escapeHtml(item.id)}"
        >
          <strong>🛍️ New order ${escapeHtml(item.label)}</strong>
          <span>
            ${escapeHtml(item.customer)} ·
            ${escapeHtml(formatTime(item.createdAt))}
          </span>
        </button>
      `).join("");
    }

    status.textContent = !activeUserId
      ? "Waiting for admin session…"
      : !channel
        ? "Connecting to Realtime…"
        : "Realtime subscription started";
  }

  function createBell() {
    if (document.getElementById(ROOT_ID)) return;

    addStyles();

    const root = document.createElement("div");
    root.id = ROOT_ID;

    root.innerHTML = `
      <button
        type="button"
        class="art-bell"
        aria-label="Order notifications"
        aria-expanded="false"
        title="Order notifications"
      >
        <span aria-hidden="true">🔔</span>
        <span class="art-count" hidden>0</span>
      </button>

      <section class="art-panel" hidden>
        <div class="art-head">
          <span>Order notifications</span>
          <button type="button" class="art-clear">
            Mark all read
          </button>
        </div>

        <div class="art-list"></div>
        <div class="art-status">Waiting for admin session…</div>
      </section>
    `;

    const refreshButton = $("#topRefresh");

    if (refreshButton?.parentElement) {
      refreshButton.parentElement.insertBefore(root, refreshButton);
    } else {
      const topbar = $(".topbar, .top-bar, header");
      (topbar || document.body).appendChild(root);
    }

    root.querySelector(".art-bell").addEventListener("click", () => {
      isOpen = !isOpen;
      renderNotifications();
    });

    root.querySelector(".art-clear").addEventListener("click", () => {
      notifications = notifications.map((item) => ({
        ...item,
        read: true
      }));

      unreadCount = 0;
      renderNotifications();
    });

    root.querySelector(".art-list").addEventListener("click", (event) => {
      const button = event.target.closest("[data-order-id]");
      if (!button) return;

      const id = button.getAttribute("data-order-id");

      notifications = notifications.map((item) =>
        String(item.id) === String(id)
          ? { ...item, read: true }
          : item
      );

      unreadCount = notifications.filter(
        (item) => !item.read
      ).length;

      renderNotifications();

      const orderButton = Array.from(
        document.querySelectorAll("[data-view-order]")
      ).find((element) =>
        String(element.dataset.viewOrder) === String(id)
      );

      if (orderButton) {
        orderButton.click();
      } else {
        refreshAdmin();
      }
    });

    document.addEventListener("click", (event) => {
      if (!root.contains(event.target) && isOpen) {
        isOpen = false;
        renderNotifications();
      }
    });

    renderNotifications();
  }

  function pushOrderNotification(order) {
    if (order?.id == null) return;

    // Never notify before a proof path is saved.
    if (!order.proof_photo_path) return;

    const id = String(order.id);

    if (knownOrderIds.has(id)) return;

    knownOrderIds.add(id);

    notifications.unshift({
      id,
      label: orderLabel(order),
      customer:
        order?.customer_name ||
        order?.customer ||
        order?.name ||
        "Customer",
      createdAt: order?.created_at || new Date().toISOString(),
      read: false
    });

    notifications = notifications.slice(0, MAX_NOTIFICATIONS);

    unreadCount = notifications.filter(
      (item) => !item.read
    ).length;

    renderNotifications();

    window.dispatchEvent(
      new CustomEvent("fleurs:new-order", {
        detail: { order }
      })
    );

    refreshAdmin();

    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("Fleurs: New order", {
          body: `Order ${orderLabel(order)} received.`,
          tag: `fleurs-order-${id}`
        });
      } catch (error) {
        console.warn("Browser notification failed:", error);
      }
    }
  }

  async function stopRealtime() {
    if (channel && client) {
      try {
        await client.removeChannel(channel);
      } catch (error) {
        console.warn(
          "[Fleurs realtime] Could not remove channel:",
          error
        );
      }
    }

    channel = null;
    activeUserId = null;
    knownOrderIds.clear();
    notifications = [];
    unreadCount = 0;

    renderNotifications();
  }

  async function startRealtime(supabaseClient, userId) {
    if (!supabaseClient || !userId) return;

    if (channel && activeUserId === userId) return;

    await stopRealtime();

    client = supabaseClient;
    activeUserId = userId;

    // Existing orders should not trigger new notifications at startup.
    try {
      const { data, error } = await client
        .from("orders")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (!error && Array.isArray(data)) {
        knownOrderIds = new Set(
          data.map((order) => String(order.id))
        );
      } else if (error) {
        console.warn(
          "[Fleurs realtime] Could not load existing order IDs:",
          error.message
        );
      }
    } catch (error) {
      console.warn(
        "[Fleurs realtime] Could not load existing orders:",
        error
      );
    }

    channel = client
      .channel(CHANNEL_NAME)

      // INSERT: notify only if proof already exists.
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders"
        },
        (payload) => {
          const order = payload.new || {};

          if (!order.proof_photo_path) return;

          pushOrderNotification(order);
        }
      )

      // UPDATE: notify when a saved proof becomes available.
      // This does not depend on payload.old containing the old path.
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders"
        },
        (payload) => {
          const order = payload.new || {};

          if (!order.proof_photo_path) return;

          pushOrderNotification(order);
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products"
        },
        () => {
          refreshAdmin();
        }
      )

      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.info(
            "[Fleurs realtime] Connected to orders and products."
          );
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          console.warn(
            "[Fleurs realtime] Subscription status:",
            status
          );
        }

        renderNotifications();
      });

    renderNotifications();
  }

  async function checkSession() {
    const supabaseClient = window.adminSupabase;

    if (!supabaseClient?.auth?.getSession) return;

    client = supabaseClient;

    const { data, error } = await client.auth.getSession();

    if (error) {
      console.warn(
        "[Fleurs realtime] Session check failed:",
        error.message
      );
      return;
    }

    const user = data?.session?.user;

    if (user?.id) {
      await startRealtime(client, user.id);
    } else {
      await stopRealtime();
    }
  }

  async function boot() {
    createBell();

    let attempts = 0;

    const waitForClient = window.setInterval(async () => {
      attempts += 1;

      if (window.adminSupabase?.auth?.getSession) {
        window.clearInterval(waitForClient);

        await checkSession();

        window.adminSupabase.auth.onAuthStateChange(
          (_event, session) => {
            if (session?.user?.id) {
              startRealtime(
                window.adminSupabase,
                session.user.id
              );
            } else {
              stopRealtime();
            }
          }
        );
      } else if (attempts >= 120) {
        window.clearInterval(waitForClient);

        console.warn(
          "[Fleurs realtime] Supabase client not found. " +
          "Add window.adminSupabase = sb; after createClient() in admen.js."
        );
      }
    }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, {
      once: true
    });
  } else {
    boot();
  }
})();
