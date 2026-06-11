import { computeScore, signalFromScore, volatility, riskLevel, explainFromMetrics, evaluateAlerts } from './indicators.js';

// ---------- Configuration ----------
const CRYPTOS = [
  ['BTC', 'Bitcoin', 'bitcoin'], ['ETH', 'Ethereum', 'ethereum'], ['BNB', 'BNB', 'binancecoin'],
  ['SOL', 'Solana', 'solana'], ['XRP', 'XRP', 'ripple'], ['ADA', 'Cardano', 'cardano'],
  ['DOGE', 'Dogecoin', 'dogecoin'], ['AVAX', 'Avalanche', 'avalanche-2'], ['DOT', 'Polkadot', 'polkadot'],
  ['LINK', 'Chainlink', 'chainlink'], ['TON', 'Toncoin', 'the-open-network'], ['TRX', 'Tron', 'tron'],
  ['LTC', 'Litecoin', 'litecoin'], ['UNI', 'Uniswap', 'uniswap'], ['ATOM', 'Cosmos', 'cosmos'],
  ['NEAR', 'NEAR', 'near'], ['APT', 'Aptos', 'aptos'], ['ARB', 'Arbitrum', 'arbitrum'],
  ['OP', 'Optimism', 'optimism'], ['INJ', 'Injective', 'injective-protocol'],
  ['SUI', 'Sui', 'sui'], ['PEPE', 'Pepe', 'pepe'], ['SHIB', 'Shiba Inu', 'shiba-inu'],
  ['FIL', 'Filecoin', 'filecoin'],
];
const BINANCE = 'https://api.binance.com';
const GECKO = 'https://api.coingecko.com/api/v3';
const REFRESH_MS = 5 * 60 * 1000;

const $ = (s) => document.querySelector(s);
const state = { assets: new Map(), ws: null, dataSource: null };

// ---------- Utilitaires ----------
function fmtPrice(p, cur = '$') {
  if (p === null || !Number.isFinite(p)) return '—';
  const d = p >= 1000 ? 0 : p >= 1 ? 2 : p >= 0.01 ? 4 : 8;
  return cur + p.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtPct(v) {
  if (v === null || !Number.isFinite(v)) return '—';
  return (v >= 0 ? '+' : '') + v.toFixed(2) + ' %';
}
function banner(msg, type = 'error') {
  const el = $('#banner');
  if (!msg) { el.classList.add('hidden'); return; }
  el.textContent = msg;
  el.className = `banner ${type === 'info' ? 'info' : ''}`;
}
async function getJSON(url, timeout = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(t); }
}

function drawSpark(canvas, values, w = 110, h = 34) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const up = values[values.length - 1] >= values[0];
  ctx.strokeStyle = up ? '#2bd576' : '#ff5a6a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 3 - ((v - min) / range) * (h - 6);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.stroke();
}

function assetCard(a) {
  const card = document.createElement('div');
  card.className = 'card asset';
  card.dataset.sym = a.symbol;
  const chgCls = (a.changePct ?? 0) >= 0 ? 'up' : 'down';
  card.innerHTML = `
    <div class="top">
      <span class="name">${a.name}</span><span class="sym">${a.symbol}</span>
    </div>
    <span class="badge ${a.signal.code}">${a.signal.label} · ${a.score}</span>
    <div class="top">
      <span class="price">${fmtPrice(a.price, a.currency)}</span>
      <span class="chg ${chgCls}">${fmtPct(a.changePct)}</span>
    </div>
    <canvas class="spark"></canvas>
    <div class="scorebar"><i style="width:${a.score}%"></i></div>
    <div class="metrics">
      <span>RSI <b>${a.rsi ?? '—'}</b></span>
      <span>MACD <b class="${(a.macdHist ?? 0) >= 0 ? 'up' : 'down'}">${(a.macdHist ?? 0) >= 0 ? 'haussier' : 'baissier'}</b></span>
      <span>7 ${a.momUnit || 'j'} <b>${fmtPct(a.mom7)}</b></span>
      <span>30 ${a.momUnit || 'j'} <b>${fmtPct(a.mom30)}</b></span>
      <span>Volume <b>${a.volRatio ? '×' + a.volRatio : '—'}</b></span>
      ${a.trades ? `<span>Foule <b>${a.trades.toLocaleString('fr-FR')} trades/24 h</b></span>` : ''}
      <button class="chip chart-open">📈 Graphique</button>
    </div>`;
  card.addEventListener('click', () => card.classList.toggle('open'));
  const btn = card.querySelector('.chart-open');
  if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); openChart(a); });
  if (a.spark && a.spark.length > 2) drawSpark(card.querySelector('canvas'), a.spark);
  else card.querySelector('canvas').remove();
  return card;
}

function renderList(container, assets) {
  container.innerHTML = '';
  for (const a of assets) container.appendChild(assetCard(a));
}

// ---------- Crypto : Binance (temps réel) avec repli CoinGecko ----------
async function loadCryptoBinance() {
  const symbols = CRYPTOS.map(([s]) => s + 'USDT');
  const tickers = await getJSON(`${BINANCE}/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`);
  const tickerMap = new Map(tickers.map(t => [t.symbol, t]));
  const results = await Promise.allSettled(CRYPTOS.map(async ([sym, name]) => {
    const kl = await getJSON(`${BINANCE}/api/v3/klines?symbol=${sym}USDT&interval=1h&limit=120`);
    const closes = kl.map(k => parseFloat(k[4]));
    const volumes = kl.map(k => parseFloat(k[7]));
    const an = computeScore({ closes, volumes });
    const t = tickerMap.get(sym + 'USDT') || {};
    return {
      symbol: sym, name, currency: '$',
      price: parseFloat(t.lastPrice) || closes[closes.length - 1],
      changePct: parseFloat(t.priceChangePercent),
      trades: parseInt(t.count, 10) || null,
      score: an.score, signal: signalFromScore(an.score),
      rsi: an.rsi, macdHist: an.macdHist, mom7: an.mom7, mom30: an.mom30,
      ema20: an.ema20, ema50: an.ema50,
      volRatio: an.volRatio, spark: closes.slice(-48), momUnit: 'h',
    };
  }));
  const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value);
  if (ok.length < 5) throw new Error('Binance indisponible');
  return ok;
}

async function loadCryptoGecko() {
  const ids = CRYPTOS.map(([, , id]) => id).join(',');
  const data = await getJSON(`${GECKO}/coins/markets?vs_currency=usd&ids=${ids}&sparkline=true&price_change_percentage=24h`);
  return data.map(c => {
    const closes = c.sparkline_in_7d?.price?.filter(Number.isFinite) || [];
    const an = closes.length > 40 ? computeScore({ closes, volumes: null })
      : { score: 40, rsi: null, macdHist: null, mom7: null, mom30: null, volRatio: null };
    const meta = CRYPTOS.find(([, , id]) => id === c.id) || [c.symbol.toUpperCase(), c.name];
    return {
      symbol: meta[0], name: meta[1], currency: '$',
      price: c.current_price, changePct: c.price_change_percentage_24h,
      trades: null, score: an.score, signal: signalFromScore(an.score),
      rsi: an.rsi, macdHist: an.macdHist, mom7: an.mom7, mom30: an.mom30,
      ema20: an.ema20, ema50: an.ema50,
      volRatio: an.volRatio, spark: closes.slice(-48), momUnit: 'h',
    };
  });
}

let wsRetries = 0;
function openLiveStream() {
  if (state.dataSource !== 'binance' || state.ws) return;
  const streams = CRYPTOS.map(([s]) => s.toLowerCase() + 'usdt@miniTicker').join('/');
  try {
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    state.ws = ws;
    ws.onmessage = (ev) => {
      const { data } = JSON.parse(ev.data);
      if (!data) return;
      const sym = data.s.replace('USDT', '');
      const card = document.querySelector(`.asset[data-sym="${sym}"]`);
      if (!card) return;
      const price = parseFloat(data.c);
      const open = parseFloat(data.o);
      const chg = ((price - open) / open) * 100;
      const tracked = state.assets.get(sym);
      if (tracked) tracked.price = price;
      maybeCheckAlerts();
      card.querySelector('.price').textContent = fmtPrice(price, '$');
      const chgEl = card.querySelector('.chg');
      chgEl.textContent = fmtPct(chg);
      chgEl.className = `chg ${chg >= 0 ? 'up' : 'down'}`;
      wsRetries = 0;
    };
    ws.onopen = () => { $('#status-line').textContent = 'Marchés en direct'; $('#status-line').classList.add('live'); };
    ws.onclose = () => {
      state.ws = null;
      $('#status-line').classList.remove('live');
      if (document.visibilityState === 'visible' && wsRetries < 8) {
        wsRetries++;
        setTimeout(openLiveStream, Math.min(30000, 1000 * 2 ** wsRetries));
      }
    };
    ws.onerror = () => ws.close();
  } catch { /* WebSocket indisponible : les rafraîchissements périodiques prennent le relais */ }
}

async function refreshCrypto() {
  try {
    let assets;
    try {
      assets = await loadCryptoBinance();
      state.dataSource = 'binance';
    } catch (e) {
      console.warn('Binance KO, repli CoinGecko :', e.message);
      assets = await loadCryptoGecko();
      state.dataSource = 'gecko';
      $('#status-line').textContent = 'Source : CoinGecko (repli)';
      banner('Binance est inaccessible depuis ton réseau — repli automatique sur CoinGecko (données un peu moins fraîches).', 'info');
    }
    assets.sort((a, b) => b.score - a.score);
    assets.forEach(a => state.assets.set(a.symbol, a));
    state.cryptoAssets = assets;
    applyView('crypto');
    renderRadar();
    if (state.dataSource === 'binance') { banner(null); openLiveStream(); }
    checkAlerts();
  } catch (e) {
    console.error(e);
    $('#crypto-list').innerHTML = '<div class="loader">Impossible de joindre les marchés. Vérifie ta connexion — nouvelle tentative dans 1 min.</div>';
    setTimeout(refreshCrypto, 60000);
  }
}

// ---------- Actions (données du robot GitHub) ----------
const RAW = 'https://raw.githubusercontent.com/artoboudry-a11y/test';
const STOCK_SOURCES = [
  `${RAW}/main/data/stocks.json`,
  `${RAW}/claude/trading-market-analyzer-oy02w6/data/stocks.json`,
  'data/stocks.json',
];
async function refreshStocks() {
  try {
    let data = null;
    for (const src of STOCK_SOURCES) {
      try { data = await getJSON(src + '?t=' + Date.now()); break; } catch { /* source suivante */ }
    }
    if (!data) throw new Error('aucune source disponible');
    const when = new Date(data.updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    $('#stocks-meta').textContent = `Dernière analyse du robot : ${when} · source ${data.source} · cours de clôture (les actions ne cotent pas en continu).`;
    const assets = data.stocks.map(s => ({
      ...s,
      currency: s.cur || ((s.market === 'FR' || s.market === 'EU') ? '€' : '$'),
      momUnit: 'j',
      trades: null,
    }));
    state.stockAssets = assets;
    applyView('stocks');
    renderRadar();
    checkAlerts();
  } catch (e) {
    $('#stocks-list').innerHTML = '<div class="loader">Données actions pas encore générées — le robot GitHub les publiera à sa prochaine exécution.</div>';
  }
}

// ---------- Vues : tri & filtres ----------
const viewState = {
  crypto: { sort: 'score', buyOnly: false },
  stocks: { sort: 'score', buyOnly: false },
};
function applyView(kind) {
  const assets = (kind === 'crypto' ? state.cryptoAssets : state.stockAssets) || [];
  const vs = viewState[kind];
  let list = assets.slice();
  if (vs.buyOnly) list = list.filter(a => a.score >= 55);
  const sorters = {
    score: (a, b) => b.score - a.score,
    chg: (a, b) => (b.changePct ?? -1e9) - (a.changePct ?? -1e9),
    name: (a, b) => a.name.localeCompare(b.name, 'fr'),
  };
  list.sort(sorters[vs.sort] || sorters.score);
  const el = $(kind === 'crypto' ? '#crypto-list' : '#stocks-list');
  if (!list.length) {
    el.innerHTML = '<div class="loader">Aucun actif ne correspond à ce filtre pour le moment.</div>';
    return;
  }
  renderList(el, list);
}
function bindToolbars() {
  for (const kind of ['crypto', 'stocks']) {
    $(`#sort-${kind}`).addEventListener('change', (e) => {
      viewState[kind].sort = e.target.value;
      applyView(kind);
    });
    $(`#filter-${kind}`).addEventListener('click', (e) => {
      viewState[kind].buyOnly = !viewState[kind].buyOnly;
      e.target.classList.toggle('on', viewState[kind].buyOnly);
      applyView(kind);
    });
  }
}

// ---------- Radar : meilleures opportunités tous marchés ----------
function renderRadar() {
  const crypto = (state.cryptoAssets || []).map(a => ({ ...a, where: 'CRYPTO' }));
  const stocks = (state.stockAssets || []).map(a => ({ ...a, where: a.market === 'ETF' ? 'ETF' : 'ACTIONS' }));
  const all = [...crypto, ...stocks];
  if (!all.length) return;
  all.sort((a, b) => b.score - a.score);
  const list = $('#radar-list');
  list.innerHTML = '';
  for (const a of all.slice(0, 6)) {
    const vol = a.spark && a.spark.length > 8 ? volatility(a.spark) : null;
    const risk = riskLevel({ vol, mom30: a.mom30 });
    const reasons = explainFromMetrics(a).slice(0, 4);
    const chgCls = (a.changePct ?? 0) >= 0 ? 'up' : 'down';
    const div = document.createElement('div');
    div.className = 'card radar-card';
    div.innerHTML = `
      <div class="radar-head">
        <span class="name">${a.name}</span>
        <span class="where">${a.where}</span>
        <span class="badge ${a.signal.code}">${a.signal.label} · ${a.score}</span>
      </div>
      <ul class="reasons">${reasons.map(r => `<li class="${r.plus ? 'plus' : 'minus'}">${r.text}</li>`).join('')}</ul>
      <div class="radar-foot">
        <span class="risk ${risk.code}">${risk.label}</span>
        <span class="chg ${chgCls}">${fmtPct(a.changePct)}</span>
        <span class="price">${fmtPrice(a.price, a.currency)}</span>
      </div>`;
    list.appendChild(div);
  }
}

// ---------- Graphique interactif ----------
const PERIODS = { '24h': ['15m', 96], '7j': ['1h', 168], '1M': ['4h', 180], '1A': ['1d', 365] };
const chart = { asset: null, period: '7j' };

function drawChart(values) {
  const canvas = $('#chart-canvas');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 600, h = 260;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  if (!values || values.length < 2) return;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pad = 18;
  const X = (i) => pad + (i / (values.length - 1)) * (w - pad * 2);
  const Y = (v) => h - pad - ((v - min) / range) * (h - pad * 2.4);
  const up = values[values.length - 1] >= values[0];
  const col = up ? '#34d399' : '#fb7185';
  // Lignes de repère min / max
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.fillStyle = 'rgba(147,160,196,0.9)';
  ctx.font = '10px Inter, sans-serif';
  for (const v of [min, max]) {
    ctx.beginPath(); ctx.moveTo(pad, Y(v)); ctx.lineTo(w - pad, Y(v)); ctx.stroke();
    ctx.fillText(fmtPrice(v, ''), pad + 2, Y(v) - 4);
  }
  // Aplat dégradé sous la courbe
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, up ? 'rgba(52,211,153,0.28)' : 'rgba(251,113,133,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  values.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)));
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
  ctx.lineTo(X(values.length - 1), h); ctx.lineTo(X(0), h); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
}

async function loadChart() {
  const a = chart.asset;
  if (!a) return;
  $('#chart-title').textContent = `${a.name} (${a.symbol})`;
  $('#chart-sub').textContent = `Cours actuel : ${fmtPrice(a.price, a.currency)}`;
  $('#chart-stats').textContent = 'Chargement…';
  let values = null, label = chart.period;
  if (a.momUnit === 'h') { // crypto : historique Binance à la demande
    try {
      const [interval, limit] = PERIODS[chart.period];
      const kl = await getJSON(`${BINANCE}/api/v3/klines?symbol=${a.symbol}USDT&interval=${interval}&limit=${limit}`);
      values = kl.map(k => parseFloat(k[4]));
    } catch { values = a.spark; label = 'dernières heures'; }
  } else {
    values = a.spark; label = a.spark ? `${a.spark.length} dernières séances` : '';
    $('#chart-periods').style.display = 'none';
  }
  if (!values || values.length < 2) {
    $('#chart-stats').textContent = 'Graphique indisponible pour cet actif (historique non fourni par la source).';
    drawChart(null);
    return;
  }
  drawChart(values);
  const chg = ((values[values.length - 1] - values[0]) / values[0]) * 100;
  $('#chart-stats').innerHTML =
    `Période ${label} : <b class="${chg >= 0 ? 'up' : 'down'}">${fmtPct(chg)}</b> · ` +
    `plus bas ${fmtPrice(Math.min(...values), a.currency)} · plus haut ${fmtPrice(Math.max(...values), a.currency)}`;
}

function openChart(a) {
  chart.asset = a;
  chart.period = '7j';
  $('#chart-periods').style.display = a.momUnit === 'h' ? '' : 'none';
  document.querySelectorAll('.period').forEach(b => b.classList.toggle('on', b.dataset.p === '7j'));
  $('#chart-modal').classList.remove('hidden');
  loadChart();
}
function bindChart() {
  $('#chart-close').addEventListener('click', () => $('#chart-modal').classList.add('hidden'));
  $('#chart-modal').addEventListener('click', (e) => {
    if (e.target && e.target.id === 'chart-modal') $('#chart-modal').classList.add('hidden');
  });
  document.querySelectorAll('.period').forEach(b => b.addEventListener('click', () => {
    chart.period = b.dataset.p;
    document.querySelectorAll('.period').forEach(x => x.classList.toggle('on', x === b));
    loadChart();
  }));
}

// ---------- Tendances de la foule ----------
async function refreshTrends() {
  try {
    const data = await getJSON(`${GECKO}/search/trending`);
    const list = $('#trends-list');
    list.innerHTML = '';
    data.coins.slice(0, 10).forEach((c, i) => {
      const it = c.item;
      const known = state.assets.get(it.symbol.toUpperCase());
      const div = document.createElement('div');
      div.className = 'card trend-item';
      div.innerHTML = `
        <span class="rank">#${i + 1}</span>
        <img src="${it.small}" alt="" loading="lazy">
        <div class="info">
          <b>${it.name}</b> <span class="sym">${it.symbol.toUpperCase()}</span>
          <small>Rang capitalisation : ${it.market_cap_rank ?? '—'} · ${it.data?.price ? 'Prix ' + fmtPrice(parseFloat(it.data.price), '$') : ''}</small>
        </div>
        ${known ? `<span class="badge ${known.signal.code}">${known.signal.label}</span>` : ''}`;
      list.appendChild(div);
    });
  } catch {
    $('#trends-list').innerHTML = '<div class="loader">Tendances momentanément indisponibles.</div>';
  }
}

async function refreshFearGreed() {
  try {
    const d = await getJSON('https://api.alternative.me/fng/?limit=1');
    const v = d.data[0];
    const labels = { 'Extreme Fear': 'Peur extrême', Fear: 'Peur', Neutral: 'Neutre', Greed: 'Avidité', 'Extreme Greed': 'Avidité extrême' };
    $('#fng').innerHTML = `<b>${v.value}</b>${labels[v.value_classification] || v.value_classification}<br>Peur &amp; Avidité`;
  } catch { /* facultatif */ }
}

// ---------- Portefeuille / objectif ----------
const STORE_KEY = 'tradepilot_v1';
function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
}
function saveStore(s) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }
function fullStore() {
  return { capital: 10, goal: 10000, rate: 1, trades: [], alerts: [], ...loadStore() };
}

// ---------- Alertes de prix ----------
function currentPrice(symbol) {
  const c = state.assets.get(symbol);
  if (c && Number.isFinite(c.price)) return c.price;
  const st = (state.stockAssets || []).find(a => a.symbol === symbol);
  return st && Number.isFinite(st.price) ? st.price : null;
}
function notifyAlert(al) {
  const msg = `🔔 Alerte : ${al.symbol} ${al.dir === 'above' ? 'a dépassé' : 'est passé sous'} ${al.price} — cours actuel ${al.hit.price}.`;
  banner(msg, 'info');
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch { /* non supporté */ }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try { new Notification('TradePilot', { body: msg, icon: 'icons/icon-192.png' }); } catch { /* contexte sans notifications */ }
  }
}
function checkAlerts() {
  const s = fullStore();
  const active = s.alerts.filter(a => !a.hit);
  if (!active.length) return;
  const { triggered } = evaluateAlerts(active, currentPrice);
  if (!triggered.length) return;
  for (const t of triggered) {
    const al = s.alerts.find(a => a.id === t.id);
    al.hit = {
      price: Math.round(t.hitPrice * 10000) / 10000,
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
    };
    notifyAlert(al);
  }
  saveStore(s);
  renderPortfolio();
}
let lastAlertTick = 0;
function maybeCheckAlerts() {
  const now = Date.now();
  if (now - lastAlertTick > 5000) { lastAlertTick = now; checkAlerts(); }
}

function renderPortfolio() {
  const s = fullStore();
  $('#capital').value = s.capital;
  $('#goal').value = s.goal;
  $('#daily-rate').value = s.rate;
  const pct = Math.min(100, (s.capital / s.goal) * 100);
  $('#progress-fill').style.width = pct + '%';
  $('#progress-label').textContent =
    `${s.capital.toLocaleString('fr-FR')} € sur ${s.goal.toLocaleString('fr-FR')} € — ${pct.toFixed(2)} % du chemin. Multiplication restante : ×${(s.goal / Math.max(s.capital, 0.01)).toFixed(0)}.`;
  const r = s.rate / 100;
  const days = r > 0 ? Math.ceil(Math.log(s.goal / Math.max(s.capital, 0.01)) / Math.log(1 + r)) : Infinity;
  const years = (days / 365).toFixed(1);
  $('#goal-projection').innerHTML =
    `À <b>${s.rate} % par jour</b> composés, il faudrait <b>${Number.isFinite(days) ? days.toLocaleString('fr-FR') + ' jours' : '∞'}</b> (≈ ${years} ans) pour atteindre l'objectif. ` +
    `Pour comparaison, les meilleurs fonds du monde font ~0,08 %/jour en moyenne. ` +
    `Sois patient, réinvestis régulièrement, et méfie-toi de tout ce qui promet plus vite.`;
  const aul = $('#alert-list');
  aul.innerHTML = '';
  s.alerts.forEach((a, i) => {
    const li = document.createElement('li');
    const status = a.hit
      ? `<small class="up">✅ déclenchée le ${a.hit.date} à ${a.hit.price}</small>`
      : '<small style="color:var(--muted)">⏳ en attente</small>';
    li.innerHTML = `<span>${a.symbol} ${a.dir === 'above' ? '≥' : '≤'} ${a.price} ${status}</span><button title="Supprimer">✕</button>`;
    li.querySelector('button').onclick = () => { s.alerts.splice(i, 1); saveStore(s); renderPortfolio(); };
    aul.appendChild(li);
  });
  const ul = $('#trade-list');
  ul.innerHTML = '';
  s.trades.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${t.asset} — ${t.amount.toLocaleString('fr-FR')} € <small style="color:var(--muted)">(${t.date})</small></span><button title="Supprimer">✕</button>`;
    li.querySelector('button').onclick = () => { s.trades.splice(i, 1); saveStore(s); renderPortfolio(); };
    ul.appendChild(li);
  });
}

function bindPortfolio() {
  for (const [id, key] of [['#capital', 'capital'], ['#goal', 'goal'], ['#daily-rate', 'rate']]) {
    $(id).addEventListener('change', (e) => {
      const s = fullStore();
      s[key] = parseFloat(e.target.value) || s[key];
      saveStore(s); renderPortfolio();
    });
  }
  $('#alert-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const s = fullStore();
    const price = parseFloat($('#alert-price').value);
    if (!Number.isFinite(price) || price <= 0) return;
    s.alerts.push({
      id: Date.now(),
      symbol: $('#alert-symbol').value.trim().toUpperCase(),
      dir: $('#alert-dir').value === 'below' ? 'below' : 'above',
      price,
    });
    saveStore(s);
    e.target.reset();
    renderPortfolio();
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    checkAlerts();
  });
  $('#trade-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const s = fullStore();
    s.trades.push({
      asset: $('#trade-asset').value.trim().toUpperCase(),
      amount: parseFloat($('#trade-amount').value),
      date: new Date().toLocaleDateString('fr-FR'),
    });
    saveStore(s);
    e.target.reset();
    renderPortfolio();
  });
}

// ---------- Navigation & démarrage ----------
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.panel').forEach(p =>
      p.classList.toggle('active', p.id === 'panel-' + btn.dataset.tab));
  });
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { wsRetries = 0; openLiveStream(); }
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

refreshCrypto();
refreshStocks();
refreshTrends();
refreshFearGreed();
renderPortfolio();
bindPortfolio();
bindToolbars();
bindChart();
setInterval(refreshCrypto, REFRESH_MS);
setInterval(refreshStocks, REFRESH_MS * 3);
setInterval(refreshTrends, REFRESH_MS * 2);
