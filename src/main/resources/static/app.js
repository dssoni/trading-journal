document.addEventListener("DOMContentLoaded", function () {
  // --- Shortcuts ---
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // --- App Tabs ---
  const TABS = [
    "dashboard",
    "accounts",
    "instruments",
    "trades",
    "fills",
    "calendar",
    "signin",
  ];
  const PROTECTED_TABS = [
    "dashboard",
    "accounts",
    "instruments",
    "trades",
    "fills",
    "calendar",
  ];

  // --- State ---
  const state = {
    user: null,
    accounts: [],
    instruments: [],
    trades: [],
  };

  // --- Routing ---
  function routeTo(name) {
    TABS.forEach((t) => {
      $("#tab-" + t)?.classList.remove("active");
      const item = $$(`.menu .item[data-tab="${t}"]`)[0];
      if (item) item.classList.remove("active");
    });
    $("#tab-" + name)?.classList.add("active");
    const activeItem = $$(`.menu .item[data-tab="${name}"]`)[0];
    if (activeItem) activeItem.classList.add("active");
    $("#crumbs").textContent =
      name.charAt(0).toUpperCase() + name.slice(1);
  }
  $$(".menu .item").forEach((a) =>
    a.addEventListener("click", () => routeTo(a.dataset.tab)),
  );

  // --- Tab Access Control ---
  function hideProtectedTabs() {
    PROTECTED_TABS.forEach((name) => {
      const tab = $$(`.menu .item[data-tab="${name}"]`)[0];
      if (tab) tab.style.display = "none";
    });
  }
  function showProtectedTabs() {
    PROTECTED_TABS.forEach((name) => {
      const tab = $$(`.menu .item[data-tab="${name}"]`)[0];
      if (tab) tab.style.display = "";
    });
  }

  // --- Signin/Logout UI ---
  function disableSignInTab() {
    $$(`.menu .item[data-tab="signin"]`).forEach((tab) => (tab.style.display = "none"));
    $("#btnLogout").style.display = "";
  }
  function enableSignInTab() {
    $$(`.menu .item[data-tab="signin"]`).forEach((tab) => (tab.style.display = ""));
    $("#btnLogout").style.display = "none";
  }

  // --- Modal helpers ---
  $$("[data-open]").forEach((el) =>
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-open");
      $("#" + id)?.classList.add("show");
      if (id === "modal-account") resetAccountModal();
      if (id === "modal-instrument") resetInstrumentModal();
      if (id === "modal-trade") resetTradeModal();
    }),
  );
  $$("[data-close]").forEach((el) =>
    el.addEventListener("click", () => {
      el.closest(".modal")?.classList.remove("show");
    }),
  );
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape")
      $$(".modal.show").forEach((m) => m.classList.remove("show"));
  });

  // --- API ---
  const API = (path, opts = {}) => fetch(path, { credentials: "include", ...opts });
  const j = (r) => r.json().catch(() => ({}));

  // --- Utility ---
  function renderTable(selector, rowsHtml, headersHtml) {
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>${headersHtml}</thead>
      <tbody>${rowsHtml}</tbody>
    `;
    $(selector).innerHTML = "";
    $(selector).appendChild(table);
  }
  function fillSelect(sel, arr, map) {
    if (!sel) return;
    sel.innerHTML = "";
    arr.forEach((x) => {
      const o = document.createElement("option");
      const { value, label } = map(x);
      o.value = value;
      o.textContent = label;
      sel.appendChild(o);
    });
  }
  function addRow(el, left, right = "") {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<div>${left}</div><div class="meta">${right}</div>`;
    el.appendChild(row);
  }

  // --- Table Renderers ---
  function renderAccountsTable(accounts) {
    if (!$("#listAccountsTable")) return;
    renderTable(
      "#listAccountsTable",
      accounts
        .map(
          (acc) => `
          <tr>
            <td>${acc.name}</td>
            <td>${acc.broker || ""}</td>
            <td>${acc.baseCurrency || "USD"}</td>
            <td>${acc.costBasisMethod || ""}</td>
            <td>${acc.timezone || ""}</td>
            <td>${acc.isActive ? "Active" : "Inactive"}</td>
            <td class="actions">
              <button class="btn-action edit" title="Edit" data-id="${acc.id}">&#9998;</button>
              <button class="btn-action delete" title="Delete" data-id="${acc.id}">&#128465;</button>
            </td>
          </tr>
        `,
        )
        .join(""),
      `<tr>
        <th>Name</th>
        <th>Broker</th>
        <th>Base Currency</th>
        <th>Cost Basis</th>
        <th>Timezone</th>
        <th>Status</th>
        <th class="actions">Actions</th>
      </tr>`,
    );
    $$("#listAccountsTable .btn-action.edit").forEach(
      (btn) => (btn.onclick = () => editAccountModal(btn.dataset.id)),
    );
    $$("#listAccountsTable .btn-action.delete").forEach(
      (btn) => (btn.onclick = () => deleteAccount(btn.dataset.id)),
    );
  }

  function renderInstrumentsTable(instruments) {
    if (!$("#listInstrumentsTable")) return;
    renderTable(
      "#listInstrumentsTable",
      instruments
        .map(
          (ins) => `
          <tr>
            <td>${ins.type}</td>
            <td>${ins.symbol || ""}</td>
            <td>${ins.underlyingSymbol || ""}</td>
            <td>${ins.optionRight || ""}</td>
            <td>${ins.strike ?? ""}</td>
            <td>${ins.expiration ? ins.expiration.slice(0, 10) : ""}</td>
            <td class="actions">
              <button class="btn-action edit" title="Edit" data-id="${ins.id}">&#9998;</button>
              <button class="btn-action delete" title="Delete" data-id="${ins.id}">&#128465;</button>
            </td>
          </tr>
        `,
        )
        .join(""),
      `<tr>
        <th>Type</th>
        <th>Symbol</th>
        <th>Underlying</th>
        <th>Right</th>
        <th>Strike</th>
        <th>Expiration</th>
        <th class="actions">Actions</th>
      </tr>`,
    );
    $$("#listInstrumentsTable .btn-action.edit").forEach(
      (btn) => (btn.onclick = () => editInstrumentModal(btn.dataset.id)),
    );
    $$("#listInstrumentsTable .btn-action.delete").forEach(
      (btn) => (btn.onclick = () => deleteInstrument(btn.dataset.id)),
    );
  }

  function renderTradesTable(trades) {
    if (!$("#listTradesTable")) return;
    renderTable(
      "#listTradesTable",
      trades
        .map((tr) => {
          const ins = state.instruments.find((i) => i.id === tr.instrumentId);
          const pretty = ins
            ? tradeLabel(ins)
            : "";
          return `
            <tr>
              <td>${pretty}</td>
              <td>${tr.status ?? ""}</td>
              <td>${tr.entryQty ?? ""}</td>
              <td>${tr.entryPrice ?? ""}</td>
              <td>${tr.entryAt ? new Date(tr.entryAt).toLocaleString() : ""}</td>
              <td>${tr.notes ?? ""}</td>
              <td class="actions">
                <button class="btn-action edit" title="Edit" data-id="${tr.id}">&#9998;</button>
                <button class="btn-action delete" title="Delete" data-id="${tr.id}">&#128465;</button>
              </td>
            </tr>
          `;
        })
        .join(""),
      `<tr>
        <th>Instrument</th>
        <th>Status</th>
        <th>Qty</th>
        <th>Entry Price</th>
        <th>Entry Date</th>
        <th>Notes</th>
        <th class="actions">Actions</th>
      </tr>`,
    );
    $$("#listTradesTable .btn-action.edit").forEach(
      (btn) => (btn.onclick = () => editTradeModal(btn.dataset.id)),
    );
    $$("#listTradesTable .btn-action.delete").forEach(
      (btn) => (btn.onclick = () => deleteTrade(btn.dataset.id)),
    );
  }

  // --- Label Helpers ---
  function tradeLabel(obj) {
    let ins = obj;
    if ("instrumentId" in obj) {
      ins = state.instruments.find((i) => i.id === obj.instrumentId);
      if (!ins) return "Unknown";
    }
    if (ins.type === "EQUITY") {
      return ins.symbol;
    }
    if (ins.type === "OPTION") {
      const d = ins.expiration ? new Date(ins.expiration) : null;
      let dateString = d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
      let strikeStr = ins.strike ? `$${ins.strike}` : "";
      let right = ins.optionRight === "CALL" ? "C" : ins.optionRight === "PUT" ? "P" : "";
      return [ins.underlyingSymbol, strikeStr, right, dateString].filter(Boolean).join(" ");
    }
    return "";
  }

  // --- Modal Reset & Form Handlers ---
  function resetAccountModal() {
    $("#modalAccountTitle").textContent = "New Account";
    $("#accIdEdit").value = "";
    $("#accName").value = "";
    $("#accBroker").value = "";
    $("#accCurrency").value = "USD";
    $("#accCbm").value = "";
    $("#accTz").value = "";
    $("#accActive").checked = true;
  }
  function editAccountModal(id) {
    const a = state.accounts.find((x) => String(x.id) === String(id));
    if (!a) return;
    $("#modalAccountTitle").textContent = "Edit Account";
    $("#accIdEdit").value = a.id;
    $("#accName").value = a.name;
    $("#accBroker").value = a.broker || "";
    $("#accCurrency").value = a.baseCurrency || "USD";
    $("#accCbm").value = a.costBasisMethod || "";
    $("#accTz").value = a.timezone || "";
    $("#accActive").checked = !!a.isActive;
    $("#modal-account").classList.add("show");
  }
  async function deleteAccount(id) {
    if (!confirm("Delete this account?")) return;
    const r = await API(`/api/accounts/${id}`, { method: "DELETE" });
    if (r.ok) await loadAccounts();
  }

  function resetInstrumentModal() {
    $("#modalInstrumentTitle").textContent = "Add Instrument";
    $("#insIdEdit").value = "";
    $("#insType").value = "EQUITY";
    $("#insSymbol").value = "";
    $("#insUnderlying").value = "";
    $("#insRight").value = "";
    $("#insStrike").value = "";
    $("#insExp").value = "";
  }
  function editInstrumentModal(id) {
    const i = state.instruments.find((x) => String(x.id) === String(id));
    if (!i) return;
    $("#modalInstrumentTitle").textContent = "Edit Instrument";
    $("#insIdEdit").value = i.id;
    $("#insType").value = i.type;
    $("#insSymbol").value = i.symbol || "";
    $("#insUnderlying").value = i.underlyingSymbol || "";
    $("#insRight").value = i.optionRight || "";
    $("#insStrike").value = i.strike ?? "";
    $("#insExp").value = i.expiration ? i.expiration.slice(0, 10) : "";
    $("#modal-instrument").classList.add("show");
  }
  async function deleteInstrument(id) {
    if (!confirm("Delete this instrument?")) return;
    const r = await API(`/api/instruments/${id}`, { method: "DELETE" });
    if (r.ok) await loadInstrumentsAll();
  }

  function resetTradeModal() {
    $("#modalTradeTitle").textContent = "New Trade";
    $("#tradeIdEdit").value = "";
    $("#tradeAccount").value = "";
    $("#tradeInstrument").value = "";
    $("#tradeQty").value = "";
    $("#tradePrice").value = "";
    $("#tradeEntryDate").value = "";
    $("#tradeEntryTime").value = "";
    $("#tradeNotes").value = "";
  }
  function editTradeModal(id) {
    const t = state.trades.find((x) => String(x.id) === String(id));
    if (!t) return;
    $("#modalTradeTitle").textContent = "Edit Trade";
    $("#tradeIdEdit").value = t.id;
    $("#tradeAccount").value = t.accountId;
    $("#tradeInstrument").value = t.instrumentId;
    $("#tradeQty").value = t.entryQty || "";
    $("#tradePrice").value = t.entryPrice || "";
    if (t.entryAt) {
      const d = new Date(t.entryAt);
      $("#tradeEntryDate").value = d.toISOString().slice(0, 10);
      $("#tradeEntryTime").value = d.toISOString().slice(11, 16);
    } else {
      $("#tradeEntryDate").value = "";
      $("#tradeEntryTime").value = "";
    }
    $("#tradeNotes").value = t.notes || "";
    $("#modal-trade").classList.add("show");
  }
  async function deleteTrade(id) {
    if (!confirm("Delete this trade?")) return;
    const r = await API(`/api/trades/${id}`, { method: "DELETE" });
    if (r.ok) await loadTrades();
  }

  // --- Data Loaders ---
  async function loadAccounts() {
    if (!state.user || !$("#listAccountsTable")) return;
    const r = await API(`/api/accounts/by-user/${state.user.id}`);
    if (!r.ok) {
      $("#listAccountsTable").innerHTML = '<div class="row">Could not load accounts</div>';
      state.accounts = [];
      $("#statAccounts").textContent = "0";
      fillSelect($("#tradeAccount"), [], () => ({}));
      return;
    }
    state.accounts = await j(r);
    renderAccountsTable(state.accounts);
    $("#statAccounts").textContent = state.accounts.length;
    fillSelect($("#tradeAccount"), state.accounts, (a) => ({ value: a.id, label: a.name }));
  }

  async function loadInstrumentsAll() {
    if (!$("#listInstrumentsTable")) return;
    let r = await API("/api/instruments/all");
    if (!r.ok) r = await API("/api/instruments");
    if (!r.ok) {
      $("#listInstrumentsTable").innerHTML = '<div class="row">Could not load instruments</div>';
      state.instruments = [];
      fillSelect($("#tradeInstrument"), [], () => ({}));
      return;
    }
    state.instruments = await j(r);
    renderInstrumentsTable(state.instruments);
    fillSelect($("#tradeInstrument"), state.instruments, (i) => ({ value: i.id, label: tradeLabel(i) }));
  }

  async function loadTrades() {
    if (!state.user || !$("#listTradesTable")) return;
    const r = await API(`/api/trades/by-user/${state.user.id}`);
    if (!r.ok) {
      $("#listTradesTable").innerHTML = '<div class="row">Could not load trades</div>';
      state.trades = [];
      $("#statOpenTrades").textContent = "0";
      fillSelect($("#fillTrade"), [], () => ({}));
      fillSelect($("#ddlFillsTrade"), [], () => ({}));
      return;
    }
    state.trades = await j(r);
    renderTradesTable(state.trades);
    $("#statOpenTrades").textContent = state.trades.filter((t) => (t.status || "").toUpperCase() !== "CLOSED").length;
    $("#dashTrades").innerHTML = "";
    state.trades.slice(0, 6).forEach((t) => {
      const ins = state.instruments.find((i) => i.id === t.instrumentId);
      addRow($("#dashTrades"), `${ins ? tradeLabel(ins) : "Instrument"}`, `${t.status || ""}`);
    });
    fillSelect($("#fillTrade"), state.trades, (t) => ({ value: t.id, label: tradeLabel(t) }));
    fillSelect($("#ddlFillsTrade"), state.trades, (t) => ({ value: t.id, label: tradeLabel(t) }));
  }

  function buildCalendar() {
    const grid = $("#calendar");
    if (!grid) return;
    const now = new Date(), y = now.getFullYear(), m = now.getMonth();
    const first = new Date(y, m, 1), startDow = first.getDay();
    const days = new Date(y, m + 1, 0).getDate();
    grid.innerHTML = "";
    for (let i = 0; i < startDow; i++) grid.appendChild(document.createElement("div")).className = "day";
    for (let d = 1; d <= days; d++) {
      const cell = document.createElement("div");
      cell.className = "day";
      cell.innerHTML = `<div class="date">${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}</div>
                        <div class="pnl muted">—</div>`;
      grid.appendChild(cell);
    }
  }

  // --- Form Handlers ---
  $("#formAccount")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const isEdit = !!$("#accIdEdit").value;
    const body = {
      userId: state.user.id,
      name: $("#accName").value.trim(),
      broker: $("#accBroker").value.trim() || null,
      baseCurrency: $("#accCurrency").value.trim() || "USD",
      costBasisMethod: $("#accCbm").value.trim() || null,
      timezone: $("#accTz").value.trim() || null,
      isActive: $("#accActive").checked,
    };
    const url = isEdit
      ? `/api/accounts/${$("#accIdEdit").value}`
      : "/api/accounts";
    const method = isEdit ? "PUT" : "POST";
    const r = await API(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      $(".modal.show")?.classList.remove("show");
      await loadAccounts();
    }
    e.target.reset();
  });

  $("#formInstrument")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const isEdit = !!$("#insIdEdit").value;
    const body = {
      type: $("#insType").value,
      symbol: $("#insSymbol").value || null,
      underlyingSymbol: $("#insUnderlying").value || null,
      optionRight: $("#insRight").value || null,
      strike: $("#insStrike").value ? Number($("#insStrike").value) : null,
      expiration: $("#insExp").value || null,
    };
    const url = isEdit
      ? `/api/instruments/${$("#insIdEdit").value}`
      : "/api/instruments";
    const method = isEdit ? "PUT" : "POST";
    const r = await API(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      $(".modal.show")?.classList.remove("show");
      await loadInstrumentsAll();
    }
    e.target.reset();
  });

  $("#formTrade")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const isEdit = !!$("#tradeIdEdit").value;
    let dateValue = $("#tradeEntryDate").value;
    let timeValue = $("#tradeEntryTime").value;
    let entryAt = null;
    if (dateValue) {
      let combined = timeValue
        ? `${dateValue}T${timeValue}`
        : `${dateValue}T00:00`;
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(combined)) {
        combined += ":00";
      }
      let dt = new Date(combined);
      entryAt = dt.toISOString().replace(/\.\d{3}Z$/, "Z");
    }
    const body = {
      userId: state.user.id,
      accountId: Number($("#tradeAccount").value),
      instrumentId: Number($("#tradeInstrument").value),
      entryQty: $("#tradeQty").value ? Number($("#tradeQty").value) : null,
      entryPrice: $("#tradePrice").value ? Number($("#tradePrice").value) : null,
      entryAt: entryAt || null,
      notes: $("#tradeNotes").value || null,
    };
    const url = isEdit
      ? `/api/trades/${$("#tradeIdEdit").value}`
      : "/api/trades";
    const method = isEdit ? "PUT" : "POST";
    const r = await API(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      $(".modal.show")?.classList.remove("show");
      await loadTrades();
    }
    e.target.reset();
  });

  $("#formFill")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tradeId = Number($("#fillTrade").value);
    const side = $("#fillSide").value;
    const qtyRaw = Number($("#fillQty").value || 0);
    const qty = Math.abs(qtyRaw);
    let dateValue = $("#tradeExitDate").value;
    let timeValue = $("#tradeExitTime").value;
    let exitAt = null;
    if (dateValue) {
      let combined = timeValue
        ? `${dateValue}T${timeValue}`
        : `${dateValue}T00:00`;
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(combined)) {
        combined += ":00";
      }
      let dt = new Date(combined);
      exitAt = dt.toISOString().replace(/\.\d{3}Z$/, "Z");
    }
    const body = {
      tradeId,
      side,
      qty,
      price: Number($("#fillPrice").value || 0),
      executedAt: exitAt || null,
      commission: Number($("#fillComm").value || 0),
    };
    const r = await API(`/api/trades/${tradeId}/fills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) $(".modal.show")?.classList.remove("show");
  });

  $("#btnListFills")?.addEventListener("click", async () => {
    const id = Number($("#ddlFillsTrade").value);
    const r = await API(`/api/trades/${id}/fills`);
    const arr = r.ok ? await j(r) : [];
    $("#outFillsList").textContent = JSON.stringify(arr, null, 2);
  });

  $("#formLogin")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#loginEmail").value.trim();
    const name = $("#loginName").value.trim();
    const r = await fetch("/api/auth/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    const result = await r.json();
    $("#loginMsg").textContent =
      result.message || "If your email exists, you will receive a link!";
  });

  // --- LOGOUT ---
  function clearAllStateAndUI() {
    Object.assign(state, {
      user: null,
      accounts: [],
      instruments: [],
      trades: [],
    });
    // Clear all UI: tables, dashboards, stats, selects, calendar, output
    if ($("#listAccountsTable")) $("#listAccountsTable").innerHTML = "";
    if ($("#listInstrumentsTable")) $("#listInstrumentsTable").innerHTML = "";
    if ($("#listTradesTable")) $("#listTradesTable").innerHTML = "";
    if ($("#statAccounts")) $("#statAccounts").textContent = "0";
    if ($("#statOpenTrades")) $("#statOpenTrades").textContent = "0";
    if ($("#dashTrades")) $("#dashTrades").innerHTML = "";
    if ($("#tradeAccount")) fillSelect($("#tradeAccount"), [], () => ({}));
    if ($("#tradeInstrument")) fillSelect($("#tradeInstrument"), [], () => ({}));
    if ($("#fillTrade")) fillSelect($("#fillTrade"), [], () => ({}));
    if ($("#ddlFillsTrade")) fillSelect($("#ddlFillsTrade"), [], () => ({}));
    if ($("#calendar")) $("#calendar").innerHTML = "";
    if ($("#outFillsList")) $("#outFillsList").textContent = "";
    // Dismiss all modals
    $$(".modal.show")
      .forEach((m) => m.classList.remove("show"));
  }

  $("#btnLogout")?.addEventListener("click", async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    clearAllStateAndUI();
    enableSignInTab();
    hideProtectedTabs();
    $("#sessionUser").textContent = "Guest";
    routeTo("signin");
  });

  // --- Auth & Session Bootstrap ---
  async function fetchUserFromSession() {
    const r = await fetch("/api/auth/me", { credentials: "include" });
    if (!r.ok) return null;
    return await r.json();
  }

  async function bootstrapSession() {
    state.user = await fetchUserFromSession();
    if (state.user) {
      $("#sessionUser").textContent = state.user.name || state.user.email;
      disableSignInTab();
      showProtectedTabs();
      routeTo("dashboard");
      await loadAccounts();
      await loadInstrumentsAll();
      await loadTrades();
      buildCalendar();
    } else {
      clearAllStateAndUI();
      $("#sessionUser").textContent = "Guest";
      enableSignInTab();
      hideProtectedTabs();
      routeTo("signin");
    }
  }

  // --- Init ---
  $("#year").textContent = new Date().getFullYear();
  bootstrapSession();
});
