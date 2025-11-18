document.addEventListener("DOMContentLoaded", function() {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // --- Routing ---
  const tabs = ['dashboard','accounts','instruments','trades','fills','calendar','signin'];
  const routeTo = (name) => {
    tabs.forEach(t => {
      $('#tab-' + t)?.classList.remove('active');
      const item = [...$$('.menu .item')].find(i => i.dataset.tab === t);
      if (item) item.classList.remove('active');
    });
    $('#tab-' + name)?.classList.add('active');
    const activeItem = [...$$('.menu .item')].find(i => i.dataset.tab === name);
    if (activeItem) activeItem.classList.add('active');
    $('#crumbs').textContent = name[0].toUpperCase() + name.slice(1);
  };
  $$('.menu .item').forEach(a => a.addEventListener('click', () => routeTo(a.dataset.tab)));

  // --- Modal helpers ---
  $$('[data-open]').forEach(el => el.addEventListener('click', () => {
    const id = el.getAttribute('data-open');
    $('#' + id)?.classList.add('show');
    if (id === 'modal-account') resetAccountModal();
    if (id === 'modal-instrument') resetInstrumentModal();
    if (id === 'modal-trade') resetTradeModal();
  }));
  $$('[data-close]').forEach(el => el.addEventListener('click', () => {
    el.closest('.modal')?.classList.remove('show');
  }));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal.show').forEach(m => m.classList.remove('show')); });

  // --- State ---
  const state = { user: null, accounts: [], instruments: [], trades: [] };
  $('#year').textContent = new Date().getFullYear();

  // --- Sign in/out UI ---
  function disableSignInTab() {
    const signInTab = [...$$('.menu .item')].find(i => i.dataset.tab === 'signin');
    if (signInTab) signInTab.style.display = 'none';
    $('#btnLogout').style.display = '';
  }
  function enableSignInTab() {
    const signInTab = [...$$('.menu .item')].find(i => i.dataset.tab === 'signin');
    if (signInTab) signInTab.style.display = '';
    $('#btnLogout').style.display = 'none';
  }

  // --- API ---
  const API = (path, opts={}) => fetch(path, { credentials:'include', ...opts });
  const j = (r) => r.json().catch(() => ({}));

  // --- Table Renderers ---
  function renderAccountsTable(accounts){
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Broker</th>
          <th>Base Currency</th>
          <th>Cost Basis</th>
          <th>Timezone</th>
          <th>Status</th>
          <th class="actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${accounts.map(acc => `
          <tr>
            <td>${acc.name}</td>
            <td>${acc.broker || ''}</td>
            <td>${acc.baseCurrency || 'USD'}</td>
            <td>${acc.costBasisMethod || ''}</td>
            <td>${acc.timezone || ''}</td>
            <td>${acc.isActive ? "Active" : "Inactive"}</td>
            <td class="actions">
              <button class="btn-action edit" title="Edit" data-id="${acc.id}">&#9998;</button>
              <button class="btn-action delete" title="Delete" data-id="${acc.id}">&#128465;</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;
    $('#listAccountsTable').innerHTML = '';
    $('#listAccountsTable').appendChild(table);

    table.querySelectorAll('.btn-action.edit').forEach(btn => {
      btn.onclick = () => editAccountModal(btn.dataset.id);
    });
    table.querySelectorAll('.btn-action.delete').forEach(btn => {
      btn.onclick = () => deleteAccount(btn.dataset.id);
    });
  }

  function renderInstrumentsTable(instruments){
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Type</th>
          <th>Symbol</th>
          <th>Underlying</th>
          <th>Right</th>
          <th>Strike</th>
          <th>Expiration</th>
          <th class="actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${instruments.map(ins => `
          <tr>
            <td>${ins.type}</td>
            <td>${ins.symbol || ''}</td>
            <td>${ins.underlyingSymbol || ''}</td>
            <td>${ins.optionRight || ''}</td>
            <td>${ins.strike ?? ''}</td>
            <td>${ins.expiration ? (ins.expiration.slice(0,10)) : ''}</td>
            <td class="actions">
              <button class="btn-action edit" title="Edit" data-id="${ins.id}">&#9998;</button>
              <button class="btn-action delete" title="Delete" data-id="${ins.id}">&#128465;</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;
    $('#listInstrumentsTable').innerHTML = '';
    $('#listInstrumentsTable').appendChild(table);

    table.querySelectorAll('.btn-action.edit').forEach(btn => {
      btn.onclick = () => editInstrumentModal(btn.dataset.id);
    });
    table.querySelectorAll('.btn-action.delete').forEach(btn => {
      btn.onclick = () => deleteInstrument(btn.dataset.id);
    });
  }

  function renderTradesTable(trades){
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Instrument</th>
          <th>Status</th>
          <th>Qty</th>
          <th>Entry Price</th>
          <th>Entry Date</th>
          <th>Notes</th>
          <th class="actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${trades.map(tr => {
          const ins = state.instruments.find(i => i.id === tr.instrumentId);
          const pretty = ins
            ? (ins.type==="EQUITY" ? ins.symbol : [ins.underlyingSymbol, ins.expiration?.slice(0,10), ins.optionRight, ins.strike].filter(Boolean).join(" · "))
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
          `
        }).join('')}
      </tbody>
    `;
    $('#listTradesTable').innerHTML = '';
    $('#listTradesTable').appendChild(table);

    table.querySelectorAll('.btn-action.edit').forEach(btn => {
      btn.onclick = () => editTradeModal(btn.dataset.id);
    });
    table.querySelectorAll('.btn-action.delete').forEach(btn => {
      btn.onclick = () => deleteTrade(btn.dataset.id);
    });
  }

  // --- UI helpers ---
  const fillSelect = (sel, arr, map) => {
    if (!sel) return;
    sel.innerHTML = '';
    arr.forEach(x => {
      const o = document.createElement('option');
      const { value, label } = map(x);
      o.value = value; o.textContent = label;
      sel.appendChild(o);
    });
  };
//  const prettyInstrument = (i) => (i.type === 'EQUITY') ? i.symbol : [i.underlyingSymbol, i.expiration, i.optionRight, i.strike].filter(Boolean).join(' · ');
  const addRow = (el, left, right='') => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div>${left}</div><div class="meta">${right}</div>`;
    el.appendChild(row);
  };

  // --- Loaders ---
  async function loadAccounts() {
    if (!state.user) return;
    const r = await API(`/api/accounts/by-user/${state.user.id}`);
    if (!r.ok) {
      $('#listAccountsTable').innerHTML = '<div class="row">Could not load accounts</div>';
      return;
    }
    state.accounts = await j(r);
    renderAccountsTable(state.accounts);
    $('#statAccounts').textContent = state.accounts.length;
    fillSelect($('#tradeAccount'), state.accounts, a => ({ value: a.id, label: a.name }));
  }

  async function loadInstrumentsAll() {
    let r = await API('/api/instruments/all');
    if (!r.ok) r = await API('/api/instruments');
    if (!r.ok) { $('#listInstrumentsTable').innerHTML = '<div class="row">Could not load instruments</div>'; return; }
    state.instruments = await j(r);
    renderInstrumentsTable(state.instruments);
    fillSelect($('#tradeInstrument'), state.instruments, i => ({ value: i.id, label: tradeLabel(i) }));
  }

  async function loadTrades() {
    if (!state.user) return;
    const r = await API(`/api/trades/by-user/${state.user.id}`);
    if (!r.ok) { $('#listTradesTable').innerHTML = '<div class="row">Could not load trades</div>'; return; }
    state.trades = await j(r);
    renderTradesTable(state.trades);
    $('#statOpenTrades').textContent = state.trades.filter(t => (t.status || '').toUpperCase() !== 'CLOSED').length;
    $('#dashTrades').innerHTML = '';
    state.trades.slice(0, 6).forEach(t => {
      const ins = state.instruments.find(i => i.id === t.instrumentId);
      addRow($('#dashTrades'), `${ins ? tradeLabel(ins) : 'Instrument'}`, `${t.status || ''}`);
    });
//    fillSelect($('#fillTrade'), state.trades, t => ({ value: t.id, label: `Trade • ${t.status || ''}` }));
//    fillSelect($('#ddlFillsTrade'), state.trades, t => ({ value: t.id, label: `Trade • ${t.status || ''}` }));
//    changing them to view trades properly on UI.
    fillSelect($('#fillTrade'), state.trades, t => ({ value: t.id, label: tradeLabel(t) }));
    fillSelect($('#ddlFillsTrade'), state.trades, t => ({ value: t.id, label: tradeLabel(t) }));

  }

  function buildCalendar() {
    const now = new Date(); const y = now.getFullYear(), m = now.getMonth();
    const first = new Date(y, m, 1), startDow = first.getDay();
    const days = new Date(y, m+1, 0).getDate();
    const grid = $('#calendar'); grid.innerHTML = '';
    for (let i=0;i<startDow;i++) grid.appendChild(document.createElement('div')).className='day';
    for (let d=1; d<=days; d++){
      const cell = document.createElement('div'); cell.className='day';
      cell.innerHTML = `<div class="date">${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}</div>
                        <div class="pnl muted">—</div>`;
      grid.appendChild(cell);
    }
  }

  // --- Modal Reset & Edit Help
  function resetAccountModal(){
    $('#modalAccountTitle').textContent = "New Account";
    $('#accIdEdit').value = '';
    $('#accName').value = '';
    $('#accBroker').value = '';
    $('#accCurrency').value = 'USD';
    $('#accCbm').value = '';
    $('#accTz').value = '';
    $('#accActive').checked = true;
  }
  function editAccountModal(id){
    const a = state.accounts.find(x => String(x.id) === String(id));
    if (!a) return;
    $('#modalAccountTitle').textContent = "Edit Account";
    $('#accIdEdit').value = a.id;
    $('#accName').value = a.name;
    $('#accBroker').value = a.broker || '';
    $('#accCurrency').value = a.baseCurrency || 'USD';
    $('#accCbm').value = a.costBasisMethod || '';
    $('#accTz').value = a.timezone || '';
    $('#accActive').checked = !!a.isActive;
    $('#modal-account').classList.add('show');
  }
  async function deleteAccount(id){
    if (!confirm('Delete this account?')) return;
    const r = await API(`/api/accounts/${id}`, {method:'DELETE'});
    if (r.ok) {
      await loadAccounts();
    }
  }

  function resetInstrumentModal(){
    $('#modalInstrumentTitle').textContent = "Add Instrument";
    $('#insIdEdit').value = '';
    $('#insType').value = 'EQUITY';
    $('#insSymbol').value = '';
    $('#insUnderlying').value = '';
    $('#insRight').value = '';
    $('#insStrike').value = '';
    $('#insExp').value = '';
  }
  function editInstrumentModal(id){
    const i = state.instruments.find(x => String(x.id) === String(id));
    if (!i) return;
    $('#modalInstrumentTitle').textContent = "Edit Instrument";
    $('#insIdEdit').value = i.id;
    $('#insType').value = i.type;
    $('#insSymbol').value = i.symbol || '';
    $('#insUnderlying').value = i.underlyingSymbol || '';
    $('#insRight').value = i.optionRight || '';
    $('#insStrike').value = i.strike ?? '';
    $('#insExp').value = i.expiration ? i.expiration.slice(0,10) : '';
    $('#modal-instrument').classList.add('show');
  }
  async function deleteInstrument(id){
    if (!confirm('Delete this instrument?')) return;
    const r = await API(`/api/instruments/${id}`, {method:'DELETE'});
    if (r.ok) {
      await loadInstrumentsAll();
    }
  }

  function resetTradeModal(){
    $('#modalTradeTitle').textContent = "New Trade";
    $('#tradeIdEdit').value = '';
    $('#tradeAccount').value = '';
    $('#tradeInstrument').value = '';
    $('#tradeQty').value = '';
    $('#tradePrice').value = '';
    $('#tradeEntryDate').value = '';
    $('#tradeEntryTime').value = '';
    $('#tradeNotes').value = '';
  }
  function editTradeModal(id){
    const t = state.trades.find(x => String(x.id) === String(id));
    if (!t) return;
    $('#modalTradeTitle').textContent = "Edit Trade";
    $('#tradeIdEdit').value = t.id;
    $('#tradeAccount').value = t.accountId;
    $('#tradeInstrument').value = t.instrumentId;
    $('#tradeQty').value = t.entryQty || '';
    $('#tradePrice').value = t.entryPrice || '';
    if (t.entryAt) {
      const d = new Date(t.entryAt);
      $('#tradeEntryDate').value = d.toISOString().slice(0,10);
      $('#tradeEntryTime').value = d.toISOString().slice(11,16);
    } else {
      $('#tradeEntryDate').value = '';
      $('#tradeEntryTime').value = '';
    }
    $('#tradeNotes').value = t.notes || '';
    $('#modal-trade').classList.add('show');
  }
  async function deleteTrade(id){
    if (!confirm('Delete this trade?')) return;
    const r = await API(`/api/trades/${id}`, {method:'DELETE'});
    if (r.ok) {
      await loadTrades();
    }
  }

  // --- Form Handlers
  $('#formAccount')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEdit = !!$('#accIdEdit').value;
    const body = {
      userId: state.user.id,
      name: $('#accName').value.trim(),
      broker: $('#accBroker').value.trim() || null,
      baseCurrency: $('#accCurrency').value.trim() || 'USD',
      costBasisMethod: $('#accCbm').value.trim() || null,
      timezone: $('#accTz').value.trim() || null,
      isActive: $('#accActive').checked
    };
    if (isEdit) {
      const id = $('#accIdEdit').value;
      const r = await API(`/api/accounts/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (r.ok) {
        $('.modal.show')?.classList.remove('show');
        await loadAccounts();
      }
    } else {
      const r = await API('/api/accounts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (r.ok) {
        $('.modal.show')?.classList.remove('show');
        await loadAccounts();
      }
    }
    e.target.reset();
  });

  $('#formInstrument')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEdit = !!$('#insIdEdit').value;
    const body = {
      type: $('#insType').value,
      symbol: $('#insSymbol').value || null,
      underlyingSymbol: $('#insUnderlying').value || null,
      optionRight: $('#insRight').value || null,
      strike: $('#insStrike').value ? Number($('#insStrike').value) : null,
      expiration: $('#insExp').value || null
    };
    if (isEdit) {
      const id = $('#insIdEdit').value;
      const r = await API(`/api/instruments/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (r.ok) {
        $('.modal.show')?.classList.remove('show');
        await loadInstrumentsAll();
      }
    } else {
      const r = await API('/api/instruments', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (r.ok) {
        $('.modal.show')?.classList.remove('show');
        await loadInstrumentsAll();
      }
    }
    e.target.reset();
  });

function tradeLabel(obj) {
  // If input is a trade, get instrument
  let ins = obj;
  // Detect trade by presence of instrumentId
  if ('instrumentId' in obj) {
    ins = state.instruments.find(i => i.id === obj.instrumentId);
    if (!ins) return 'Unknown';
  }
  if (ins.type === "EQUITY") {
    return ins.symbol;
  }
  if (ins.type === "OPTION") {
    const d = ins.expiration ? new Date(ins.expiration) : null;
    let dateString = d ? d.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}) : '';
    let strikeStr = ins.strike ? `$${ins.strike}` : '';
    let right = ins.optionRight === "CALL" ? "C" : ins.optionRight === "PUT" ? "P" : '';
    return [
      ins.underlyingSymbol,
      strikeStr,
      right,
      dateString
    ].filter(Boolean).join(' ');
  }
  return "";
}



  $('#formTrade')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEdit = !!$('#tradeIdEdit').value;
    let dateValue = $('#tradeEntryDate').value;   // required
    let timeValue = $('#tradeEntryTime').value;   // optional
    let entryAt = null;
    if (dateValue) {
      let combined = timeValue ? `${dateValue}T${timeValue}` : `${dateValue}T00:00`;
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(combined)) {
        combined += ':00';
      }
      let dt = new Date(combined);
      entryAt = dt.toISOString().replace(/\.\d{3}Z$/, 'Z');
    }

    const body = {
      userId: state.user.id,
      accountId: Number($('#tradeAccount').value),
      instrumentId: Number($('#tradeInstrument').value),
      entryQty: $('#tradeQty').value ? Number($('#tradeQty').value) : null,
      entryPrice: $('#tradePrice').value ? Number($('#tradePrice').value) : null,
      entryAt: entryAt || null,
      notes: $('#tradeNotes').value || null
    };

    if (isEdit) {
      const id = $('#tradeIdEdit').value;
      const r = await API(`/api/trades/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (r.ok) {
        $('.modal.show')?.classList.remove('show');
        await loadTrades();
      }
    } else {
      const r = await API('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (r.ok) {
        $('.modal.show')?.classList.remove('show');
        await loadTrades();
      }
    }
    e.target.reset();
  });

  $('#formFill')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tradeId = Number($('#fillTrade').value);
    const side = $('#fillSide').value;
    const qtyRaw = Number($('#fillQty').value || 0);
    const qty = Math.abs(qtyRaw);  // always positive

      let dateValue = $('#tradeExitDate').value;   // required
      let timeValue = $('#tradeExitTime').value;   // optional

      let exitAt = null;

      if (dateValue) {
        let combined = timeValue ? `${dateValue}T${timeValue}` : `${dateValue}T00:00`;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(combined)) {
          combined += ':00';
        }
        let dt = new Date(combined);
        exitAt = dt.toISOString().replace(/\.\d{3}Z$/, 'Z');
      }

    const body = {
      tradeId,
      side,
      qty,
      price: Number($('#fillPrice').value || 0),
      executedAt: exitAt || null,
      commission: Number($('#fillComm').value || 0)
    };
    const r = await API(`/api/trades/${tradeId}/fills`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (r.ok) { $('.modal.show')?.classList.remove('show'); }
  });

  $('#btnListFills')?.addEventListener('click', async () => {
    const id = Number($('#ddlFillsTrade').value);
    const r = await API(`/api/trades/${id}/fills`);
    const arr = r.ok ? await j(r) : [];
    $('#outFillsList').textContent = JSON.stringify(arr, null, 2);
  });

  $('#formLogin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#loginEmail').value.trim();
    const name = $('#loginName').value.trim();
    const r = await fetch('/api/auth/request-link', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, name })
    });
    const result = await r.json();
    $('#loginMsg').textContent = result.message || "If your email exists, you will receive a link!";
  });

  $('#btnLogout')?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    state.user = null;
    enableSignInTab();
    $('#sessionUser').textContent = 'Guest';
    routeTo('signin');
  });

  async function fetchUserFromSession() {
    const r = await fetch('/api/auth/me', { credentials: 'include' });
    if (!r.ok) return null;
    return await r.json();
  }

  async function bootstrapSession() {
    state.user = await fetchUserFromSession();
    if (state.user) {
      $('#sessionUser').textContent = state.user.name || state.user.email;
      disableSignInTab();
      routeTo('dashboard');
      await loadAccounts();
      await loadInstrumentsAll();
      await loadTrades();
      buildCalendar();
    } else {
      $('#sessionUser').textContent = 'Guest';
      enableSignInTab();
      routeTo('signin');
    }
  }

  bootstrapSession();
});
