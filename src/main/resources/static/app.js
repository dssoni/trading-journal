
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // Tabs / routing
  const tabs = ['dashboard','accounts','instruments','trades','fills','calendar','signin'];
  const routeTo = (name) => {
    tabs.forEach(t => {
      $('#tab-' + t).classList.remove('active');
      const item = [...$$('.menu .item')].find(i => i.dataset.tab === t);
      if (item) item.classList.remove('active');
    });
    $('#tab-' + name).classList.add('active');
    const activeItem = [...$$('.menu .item')].find(i => i.dataset.tab === name);
    if (activeItem) activeItem.classList.add('active');
    $('#crumbs').textContent = name[0].toUpperCase() + name.slice(1);
  };
  $$('.menu .item').forEach(a => a.addEventListener('click', () => routeTo(a.dataset.tab)));

  // Modal helpers
//  $$.forEach = function(cb){ this.forEach(cb); return this; }
  $$('[data-open]').forEach(el => el.addEventListener('click', () => {
    const id = el.getAttribute('data-open');
    $('#' + id).classList.add('show');
  }));
  $$('[data-close]').forEach(el => el.addEventListener('click', () => {
    el.closest('.modal').classList.remove('show');
  }));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal.show').forEach(m => m.classList.remove('show')); });

  // State
  const state = { user: null, accounts: [], instruments: [], trades: [] };
  $('#year').textContent = new Date().getFullYear();

  // Soft session (no server auth yet)
  const saved = localStorage.getItem('tj.session');
  if (saved) { try { state.user = JSON.parse(saved); } catch {} }
  $('#sessionUser').textContent = state.user?.name || state.user?.email || 'Guest';

  $('#btnLogout').addEventListener('click', () => {
    localStorage.removeItem('tj.session');
    state.user = null;
    $('#sessionUser').textContent = 'Guest';
    routeTo('signin');
  });

$('#formLogin').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#loginEmail').value.trim();
  const name = $('#loginName').value.trim();
  state.user = { email, name, userId: 1 }; // <-- add static userId for now
  if ($('#rememberMe').checked) localStorage.setItem('tj.session', JSON.stringify(state.user));
  $('#sessionUser').textContent = name || email;
  routeTo('dashboard');
});


  // API
  const API = (path, opts={}) => fetch(path, { credentials:'include', ...opts });
  const j = (r) => r.json().catch(() => ({}));

  // UI helpers
  const fillSelect = (sel, arr, map) => {
    sel.innerHTML = '';
    arr.forEach(x => {
      const o = document.createElement('option');
      const { value, label } = map(x);
      o.value = value; o.textContent = label;
      sel.appendChild(o);
    });
  };
  const prettyInstrument = (i) => {
    if (i.type === 'EQUITY') return i.symbol;
    const parts = [i.underlyingSymbol, i.expiration, i.optionRight, i.strike].filter(Boolean);
    return parts.join(' · ');
  };
  const addRow = (el, left, right='') => {
    const row = document.createElement('div');
    row.className = 'row'; row.innerHTML = `<div>${left}</div><div class="meta">${right}</div>`;
    el.appendChild(row);
  };

  // Loaders
async function loadAccounts() {
  const r = await API(`/api/accounts/by-user/${state.user.userId}`);
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
    const r = await API(`/api/trades/by-user/${state.user.userId}`);
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
    // dashboard tiles
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

  // Forms
$('#formAccount').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    userId: state.user.userId, // Add this line—must be present!
    name: $('#accName').value.trim(),
    broker: $('#accBroker').value.trim() || null,
    baseCurrency: $('#accCurrency').value.trim() || 'USD',
    costBasisMethod: $('#accCbm').value.trim() || null,
    timezone: $('#accTz').value.trim() || null,
    isActive: $('#accActive').checked
  };
  const r = await API('/api/accounts', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  if (r.ok) {
    $('.modal.show')?.classList.remove('show');
    await loadAccounts();
    e.target.reset();
  }
});


  $('#formInstrument').addEventListener('submit', async (e) => {
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

  $('#formTrade').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      accountId: Number($('#tradeAccount').value),
      instrumentId: Number($('#tradeInstrument').value),
      entryQty: $('#tradeQty').value ? Number($('#tradeQty').value) : null,
      entryPrice: $('#tradePrice').value ? Number($('#tradePrice').value) : null,
      entryAt: $('#tradeAt').value || null,
      notes: $('#tradeNotes').value || null
    };
    const r = await API('/api/trades', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (r.ok) { $('.modal.show')?.classList.remove('show'); await loadTrades(); e.target.reset(); }
  });

  $('#formFill').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tradeId = Number($('#fillTrade').value);
    const side = $('#fillSide').value;
    const qtyRaw = Number($('#fillQty').value || 0);
    const qty = side === 'SELL' ? -Math.abs(qtyRaw) : Math.abs(qtyRaw);
    const body = {
      qty,
      price: Number($('#fillPrice').value || 0),
      executedAt: $('#fillAt').value || null,
      commission: Number($('#fillComm').value || 0)
    };
    const r = await API(`/api/trades/${tradeId}/fills`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (r.ok) { $('.modal.show')?.classList.remove('show'); }
  });

  $('#btnListFills').addEventListener('click', async () => {
    const id = Number($('#ddlFillsTrade').value);
    const r = await API(`/api/trades/${id}/fills`);
    const arr = r.ok ? await j(r) : [];
    $('#outFillsList').textContent = JSON.stringify(arr, null, 2);
  });

  // Bootstrap
  async function bootstrap() {
    await loadAccounts();
    await loadInstrumentsAll();
    fillSelect($('#tradeAccount'), state.accounts, a => ({ value: a.id, label: a.name }));
    fillSelect($('#tradeInstrument'), state.instruments, i => ({ value: i.id, label: prettyInstrument(i) }));
    await loadTrades();
    fillSelect($('#fillTrade'), state.trades, t => ({ value: t.id, label: `Trade • ${t.status}` }));
    fillSelect($('#ddlFillsTrade'), state.trades, t => ({ value: t.id, label: `Trade • ${t.status}` }));
    buildCalendar();
  }

  bootstrap();
  // default route
  routeTo(state.user ? 'dashboard' : 'signin');
})();
