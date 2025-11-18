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

  // --- UI helpers ---
  const fillSelect = (sel, arr, map) => {
    sel.innerHTML = '';
    arr.forEach(x => {
      const o = document.createElement('option');
      const { value, label } = map(x);
      o.value = value; o.textContent = label;
      sel.appendChild(o);
    });
  };
  const prettyInstrument = (i) => (i.type === 'EQUITY') ? i.symbol : [i.underlyingSymbol, i.expiration, i.optionRight, i.strike].filter(Boolean).join(' · ');
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
      $('#listAccounts').innerHTML = '<div class="row">Could not load accounts</div>';
      return;
    }
    state.accounts = await j(r);
    const el = $('#listAccounts');
    el.innerHTML = '';
    state.accounts.forEach(a => addRow(el, `<strong>${a.name}</strong> · ${a.broker || ''} · ${a.baseCurrency || 'USD'}`));
    $('#statAccounts').textContent = state.accounts.length;
  }

  async function loadInstrumentsAll() {
    let r = await API('/api/instruments/all');
    if (!r.ok) r = await API('/api/instruments');
    if (!r.ok) { $('#listInstruments').innerHTML = '<div class="row">Could not load instruments</div>'; return; }
    state.instruments = await j(r);
    const el = $('#listInstruments'); el.innerHTML = '';
    state.instruments.forEach(i => addRow(el, prettyInstrument(i)));
  }

  async function loadTrades() {
    if (!state.user) return;
    const r = await API(`/api/trades/by-user/${state.user.id}`);
    if (!r.ok) { $('#listTrades').innerHTML = '<div class="row">Could not load trades</div>'; return; }
    state.trades = await j(r);
    const el = $('#listTrades'); el.innerHTML = '';
    state.trades.forEach(t => {
      const acc = state.accounts.find(a => a.id === t.accountId);
      const ins = state.instruments.find(i => i.id === t.instrumentId);
      const left = `${ins ? prettyInstrument(ins) : 'Instrument'} · ${t.status || ''}`;
      const right = (t.entryQty ?? '') && (t.entryPrice ?? '') ? `qty ${t.entryQty} @ ${t.entryPrice}` : '';
      addRow(el, left, right);
    });
    $('#statOpenTrades').textContent = state.trades.filter(t => (t.status || '').toUpperCase() !== 'CLOSED').length;
    $('#dashTrades').innerHTML = '';
    state.trades.slice(0, 6).forEach(t => {
      const ins = state.instruments.find(i => i.id === t.instrumentId);
      addRow($('#dashTrades'), `${ins ? prettyInstrument(ins) : 'Instrument'}`, `${t.status || ''}`);
    });
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

  // --- Handlers only attach if element exists! ---
  $('#formAccount')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      userId: state.user.id,
      name: $('#accName').value.trim(),
      broker: $('#accBroker').value.trim() || null,
      baseCurrency: $('#accCurrency').value.trim() || 'USD',
      costBasisMethod: $('#accCbm').value.trim() || null,
      timezone: $('#accTz').value.trim() || null,
      isActive: $('#accActive').checked
    };
    const r = await API('/api/accounts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (r.ok) {
      $('.modal.show')?.classList.remove('show');
      await loadAccounts();
      e.target.reset();
    }
  });

  $('#formInstrument')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      type: $('#insType').value,
      symbol: $('#insSymbol').value || null,
      underlyingSymbol: $('#insUnderlying').value || null,
      optionRight: $('#insRight').value || null,
      strike: $('#insStrike').value ? Number($('#insStrike').value) : null,
      expiration: $('#insExp').value || null
    };
    const r = await API('/api/instruments', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (r.ok) { $('.modal.show')?.classList.remove('show'); await loadInstrumentsAll(); e.target.reset(); }
  });

$('#formTrade')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  let dateValue = $('#tradeEntryDate').value;   // required
  let timeValue = $('#tradeEntryTime').value;   // optional

  let entryAt = null;

  if (dateValue) {
    // Default time to midnight (00:00) if not provided
    let combined = timeValue ? `${dateValue}T${timeValue}` : `${dateValue}T00:00`;
    // If user enters hours/minutes only (no seconds), add ":00"
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(combined)) {
      combined += ':00';
    }
    // Construct JS Date object and convert to clean ISO string (no ms)
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

  const r = await API('/api/trades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (r.ok) {
    $('.modal.show')?.classList.remove('show');
    await loadTrades();
    e.target.reset();
  }
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
        // Default time to midnight (00:00) if not provided
        let combined = timeValue ? `${dateValue}T${timeValue}` : `${dateValue}T00:00`;
        // If user enters hours/minutes only (no seconds), add ":00"
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(combined)) {
          combined += ':00';
        }
        // Construct JS Date object and convert to clean ISO string (no ms)
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
      fillSelect($('#tradeAccount'), state.accounts, a => ({ value: a.id, label: a.name }));
      fillSelect($('#tradeInstrument'), state.instruments, i => ({ value: i.id, label: prettyInstrument(i) }));
      await loadTrades();
      fillSelect($('#fillTrade'), state.trades, t => ({ value: t.id, label: `Trade • ${t.status}` }));
      fillSelect($('#ddlFillsTrade'), state.trades, t => ({ value: t.id, label: `Trade • ${t.status}` }));
      buildCalendar();
    } else {
      $('#sessionUser').textContent = 'Guest';
      enableSignInTab();
      routeTo('signin');
    }
  }

  bootstrapSession();
});