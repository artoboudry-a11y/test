import { computeScore, signalFromScore, volatility, riskLevel, explainFromMetrics, evaluateAlerts, valuePositions,
  filterAssets, pinFavorites, sanitizeImportedStore, buildTradePlan, measureProgress, positionStatus } from './indicators.js';

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

function assetCard(a, isFav = false) {
  const card = document.createElement('div');
  card.className = 'card asset';
  card.dataset.sym = a.symbol;
  const chgCls = (a.changePct ?? 0) >= 0 ? 'up' : 'down';
  card.innerHTML = `
    <div class="top">
      <span class="name">${a.name}</span><span class="sym">${a.symbol}</span>
      <button class="fav ${isFav ? 'on' : ''}" title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${isFav ? '★' : '☆'}</button>
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
      ${scorePartsHTML(a)}
      <button class="chip chart-open">📈 Graphique</button>
      <button class="chip plan-open">🧭 Plan d'action</button>
      <button class="chip invest-open">💰 Investir</button>
    </div>`;
  card.addEventListener('click', () => card.classList.toggle('open'));
  const btn = card.querySelector('.chart-open');
  if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); openChart(a); });
  const planBtn = card.querySelector('.plan-open');
  if (planBtn) planBtn.addEventListener('click', (e) => { e.stopPropagation(); openPlan(a); });
  const investBtn = card.querySelector('.invest-open');
  if (investBtn) investBtn.addEventListener('click', (e) => { e.stopPropagation(); openInvest(a); });
  const fav = card.querySelector('.fav');
  if (fav) fav.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(a.symbol); });
  if (a.spark && a.spark.length > 2) drawSpark(card.querySelector('canvas'), a.spark);
  else card.querySelector('canvas').remove();
  return card;
}

// Décomposition transparente de la note /100 : chaque composante mesurée
// (tendance, momentum, RSI, MACD, volume) avec ses points sur son maximum.
function scorePartsHTML(a) {
  if (!a.parts || !a.parts.length) return '';
  return `<div class="score-parts" title="Comment la note ${a.score}/100 est calculée">` +
    a.parts.map(p =>
      `<span>${p.label} <i><b style="width:${Math.round((p.pts / p.max) * 100)}%"></b></i> ${p.pts}/${p.max}</span>`
    ).join('') + '</div>';
}

function renderList(container, assets) {
  const favs = new Set(fullStore().favorites);
  container.innerHTML = '';
  for (const a of assets) container.appendChild(assetCard(a, favs.has(a.symbol)));
}

function toggleFavorite(symbol) {
  const s = fullStore();
  const i = s.favorites.indexOf(symbol);
  if (i >= 0) s.favorites.splice(i, 1);
  else s.favorites.push(symbol);
  saveStore(s);
  applyView('crypto');
  applyView('stocks');
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
      score: an.score, signal: signalFromScore(an.score), parts: an.parts,
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
      trades: null, score: an.score, signal: signalFromScore(an.score), parts: an.parts || null,
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
    renderPositions();
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
    renderPositions();
  } catch (e) {
    $('#stocks-list').innerHTML = '<div class="loader">Données actions pas encore générées — le robot GitHub les publiera à sa prochaine exécution.</div>';
  }
}

// ---------- Vues : tri & filtres ----------
const viewState = {
  crypto: { sort: 'score', buyOnly: false, favOnly: false, query: '' },
  stocks: { sort: 'score', buyOnly: false, favOnly: false, query: '' },
};
function applyView(kind) {
  const assets = (kind === 'crypto' ? state.cryptoAssets : state.stockAssets) || [];
  const vs = viewState[kind];
  const favorites = fullStore().favorites;
  let list = filterAssets(assets, vs.query);
  if (vs.buyOnly) list = list.filter(a => a.score >= 55);
  if (vs.favOnly) list = list.filter(a => favorites.includes(a.symbol));
  const sorters = {
    score: (a, b) => b.score - a.score,
    chg: (a, b) => (b.changePct ?? -1e9) - (a.changePct ?? -1e9),
    name: (a, b) => a.name.localeCompare(b.name, 'fr'),
  };
  list.sort(sorters[vs.sort] || sorters.score);
  list = pinFavorites(list, favorites);
  const el = $(kind === 'crypto' ? '#crypto-list' : '#stocks-list');
  if (!list.length) {
    el.innerHTML = assets.length
      ? '<div class="loader">Aucun actif ne correspond à cette recherche ou à ce filtre.</div>'
      : '<div class="loader">Aucun actif ne correspond à ce filtre pour le moment.</div>';
    return;
  }
  renderList(el, list);
}
function bindToolbars() {
  for (const kind of ['crypto', 'stocks']) {
    $(`#search-${kind}`).addEventListener('input', (e) => {
      viewState[kind].query = e.target.value;
      applyView(kind);
    });
    $(`#sort-${kind}`).addEventListener('change', (e) => {
      viewState[kind].sort = e.target.value;
      applyView(kind);
    });
    $(`#filter-${kind}`).addEventListener('click', (e) => {
      viewState[kind].buyOnly = !viewState[kind].buyOnly;
      e.target.classList.toggle('on', viewState[kind].buyOnly);
      applyView(kind);
    });
    $(`#fav-${kind}`).addEventListener('click', (e) => {
      viewState[kind].favOnly = !viewState[kind].favOnly;
      e.target.classList.toggle('on', viewState[kind].favOnly);
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

// ---------- Plan d'action : guide pas-à-pas par actif ----------
const ACTION_LABEL = {
  ENTER: { cls: 'STRONG_BUY', txt: 'Conditions réunies pour entrer' },
  WAIT_PULLBACK: { cls: 'WATCH', txt: 'Attendre un repli pour entrer' },
  WAIT_SIGNAL: { cls: 'WATCH', txt: 'Pas de signal — patienter' },
  AVOID: { cls: 'AVOID', txt: 'Ne pas entrer maintenant' },
};

function alertBtn(label, dir, price) {
  return `<button class="chip mk-alert" data-dir="${dir}" data-price="${price}">🔔 ${label}</button>`;
}

function planStepsHTML(a, plan, s) {
  const cur = a.currency;
  const isCrypto = a.momUnit === 'h';
  const unit = isCrypto ? 'jours' : 'séances';
  const steps = [];
  steps.push(isCrypto
    ? `<b>Où :</b> un courtier crypto sans dépôt minimum et aux frais &lt; 1 % par ordre. Avec un petit capital, les frais sont ton premier ennemi : ici, un aller-retour te coûte ${plan.breakevenPct} % (réglage dans l'onglet Objectif).`
    : `<b>Où :</b> un courtier bourse qui propose les <b>fractions d'actions</b> et des frais fixes faibles (0–1 € l'ordre). Avec un petit capital, fuis les courtiers à 5 € l'ordre : ils mangent des semaines de gains.`);
  steps.push(plan.action === 'WAIT_PULLBACK'
    ? `<b>Quand :</b> pas au cours actuel (${fmtPrice(a.price, cur)}) — l'actif est monté trop vite. Attends un repli dans la zone <b>${fmtPrice(plan.entryLow, cur)} – ${fmtPrice(plan.entryHigh, cur)}</b> (autour de sa moyenne 20 périodes), comme un soldeur attend les soldes.<br>${alertBtn("M'alerter quand la zone est atteinte", 'below', plan.entryHigh)}`
    : `<b>Quand :</b> maintenant, dans la zone <b>${fmtPrice(plan.entryLow, cur)} – ${fmtPrice(plan.entryHigh, cur)}</b>. Utilise un ordre limite plutôt qu'un ordre au marché pour maîtriser ton prix d'entrée.`);
  steps.push(plan.positionEur !== null
    ? `<b>Combien :</b> environ <b>${plan.positionEur.toLocaleString('fr-FR')} €</b> sur ton capital de ${s.capital.toLocaleString('fr-FR')} € — ainsi, si le stop est touché, tu ne perds que ≈ ${plan.riskEur.toLocaleString('fr-FR')} € (1 % du capital). Jamais plus de 25 % du capital sur une seule position.`
    : `<b>Combien :</b> dimensionne pour ne risquer que 1 % de ton capital si le stop est touché (renseigne ton capital dans l'onglet Objectif pour un montant précis).`);
  steps.push(`<b>Protection (obligatoire) :</b> stop à <b>${fmtPrice(plan.stop, cur)}</b> (−${plan.stopPct} %). Si le cours passe dessous, tu vends sans discuter — c'est la règle qui te garde en vie. Place un ordre stop chez ton courtier si possible.<br>${alertBtn("M'alerter si le stop est touché", 'below', plan.stop)}`);
  steps.push(`<b>Objectif de vente :</b> <b>${fmtPrice(plan.target, cur)}</b> (+${plan.targetPct} %), soit 2 € visés pour 1 € risqué, frais d'aller-retour inclus. Quand il est atteint : vends au moins la moitié, remonte le stop au prix d'achat pour le reste.<br>${alertBtn("M'alerter à l'objectif", 'above', plan.target)}`);
  steps.push(`<b>Durée estimée :</b> ${plan.horizonDays[0]} à ${plan.horizonDays[1]} ${unit} au rythme de volatilité actuel (≈ ${plan.dailyVol} %/jour) — si la tendance tient. Si le stop saute avant, le plan est terminé : on passe au suivant, sans rancune.`);
  if (plan.goalContribPctPerDay !== null) {
    steps.push(`<b>Et ton objectif de ${s.rate} %/jour ?</b> Si ce plan réussit, il rapporte ≈ <b>${plan.goalContribPctPerDay} %/jour</b> de ton capital sur la période. Atteindre ${s.rate} %/jour exige d'enchaîner les plans gagnants sans gros accident — même les professionnels n'y arrivent pas longtemps. Vise la régularité, pas le record.`);
  }
  return `<ol class="plan-steps">${steps.map(t => `<li><span>${t}</span></li>`).join('')}</ol>`;
}

function openPlan(a) {
  const s = fullStore();
  const plan = buildTradePlan(a, { feePct: s.feePct, capital: s.capital });
  $('#plan-title').textContent = `${a.name} (${a.symbol})`;
  const el = $('#plan-body');
  if (!plan) {
    el.innerHTML = '<p class="sub">Plan indisponible : données insuffisantes pour cet actif.</p>';
  } else {
    const head = `<div class="plan-head">
      <span class="badge ${ACTION_LABEL[plan.action].cls}">${ACTION_LABEL[plan.action].txt}</span>
      <span class="risk ${plan.risk.code}">${plan.risk.label}</span>
      <span class="sub">note ${plan.score}/100 · volatilité ≈ ${plan.dailyVol} %/jour</span>
    </div>`;
    const reasons = explainFromMetrics(a).slice(0, 4);
    const why = `<ul class="reasons">${reasons.map(r => `<li class="${r.plus ? 'plus' : 'minus'}">${r.text}</li>`).join('')}</ul>`;
    const body = (plan.action === 'AVOID' || plan.action === 'WAIT_SIGNAL')
      ? `<p class="plan-wait">${plan.action === 'AVOID'
          ? `La note est de <b>${plan.score}/100</b> : tendance non confirmée, le risque de perte dépasse l'espérance de gain. Règle n° 1 pour gagner sur la durée : <b>ne pas perdre</b>. N'achète pas, même si le prix « a l'air bas » — il peut baisser encore.`
          : `La note est de <b>${plan.score}/100</b> : pas assez de preuves pour engager de l'argent. Le bon geste rapporte ici : <b>attendre</b>.`}
          Ajoute l'actif en favori (★) et reviens quand sa note dépasse 55 — le plan d'achat complet apparaîtra alors ici.</p>`
      : planStepsHTML(a, plan, s);
    el.innerHTML = head + why + body +
      `<button class="btn" id="plan-invest" style="margin-top:14px">💰 J'ai acheté — suivre cette position</button>`;
    el.querySelectorAll('.mk-alert').forEach(b => b.addEventListener('click', () => {
      addAlertQuick(a.symbol, b.dataset.dir, parseFloat(b.dataset.price));
      b.textContent = '✓ Alerte créée (onglet Objectif)';
      b.disabled = true;
    }));
    const inv = $('#plan-invest');
    if (inv) inv.addEventListener('click', () => { $('#plan-modal').classList.add('hidden'); openInvest(a); });
  }
  $('#plan-modal').classList.remove('hidden');
}

function addAlertQuick(symbol, dir, price) {
  if (!Number.isFinite(price) || price <= 0) return;
  const s = fullStore();
  s.alerts.push({
    id: Date.now(),
    symbol,
    dir: dir === 'below' ? 'below' : 'above',
    price: Math.round(price * 10000) / 10000,
  });
  saveStore(s);
  renderPortfolio();
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

function bindPlan() {
  $('#plan-close').addEventListener('click', () => $('#plan-modal').classList.add('hidden'));
  $('#plan-modal').addEventListener('click', (e) => {
    if (e.target && e.target.id === 'plan-modal') $('#plan-modal').classList.add('hidden');
  });
}

// ---------- Investir : suivi d'une position réelle, jour après jour ----------
// Retrouve l'objet actif complet (avec ses indicateurs) pour calculer un plan.
function findAsset(symbol) {
  const c = state.assets.get(symbol);
  if (c) return c;
  return (state.stockAssets || []).find(a => a.symbol === symbol) || null;
}
// Nom + devise d'affichage pour un symbole (repli sur le symbole lui-même).
function assetMeta(symbol) {
  const a = findAsset(symbol);
  return a ? { name: a.name, currency: a.currency } : { name: symbol, currency: '€' };
}

// Plan FIGÉ calé sur le prix d'achat réel : stop et objectif en pourcentage du
// plan du jour, mais appliqués au prix auquel tu as vraiment acheté. Une fois
// créés, ces niveaux ne bougent plus — c'est ce qui rend le suivi stable.
function frozenPlanFor(a, buyPrice, s) {
  const plan = buildTradePlan(a, { feePct: s.feePct, capital: s.capital });
  if (!plan || !Number.isFinite(buyPrice) || buyPrice <= 0) return null;
  let stopPct = plan.stopPct, targetPct = plan.targetPct;
  if (!Number.isFinite(stopPct)) {
    stopPct = Math.round(Math.max(2, Math.min(12, 1.8 * plan.dailyVol)) * 100) / 100;
    targetPct = Math.round((2 * stopPct + (plan.breakevenPct || 0)) * 100) / 100;
  }
  const r4 = (x) => Math.round(x * 10000) / 10000;
  return {
    stop: r4(buyPrice * (1 - stopPct / 100)),
    target: r4(buyPrice * (1 + targetPct / 100)),
    stopPct, targetPct,
    entryLow: plan.entryLow ?? undefined, entryHigh: plan.entryHigh ?? undefined,
    dailyVol: plan.dailyVol,
  };
}

// Enregistre (au plus une fois par jour) le cours et la valeur de la position,
// pour bâtir un historique de suivi sur plusieurs jours.
function upsertPositionLog(pos, current) {
  if (!Number.isFinite(current) || !Number.isFinite(pos.buyPrice) || pos.buyPrice <= 0
    || !Number.isFinite(pos.amount)) return false;
  const today = new Date().toISOString().slice(0, 10);
  const value = pos.amount * (current / pos.buyPrice);
  pos.log = Array.isArray(pos.log) ? pos.log : [];
  const last = pos.log[pos.log.length - 1];
  if (last && last.date === today) {
    if (last.price === current && last.value === value) return false;
    last.price = current; last.value = value;
  } else {
    pos.log.push({ date: today, price: current, value });
  }
  while (pos.log.length > 400) pos.log.shift();
  return true;
}

// Crée et enregistre une position réelle. Accepte un montant en € OU une
// quantité ; l'autre est déduit du prix d'achat.
function addPosition({ symbol, amount, units, buyPrice }) {
  const s = fullStore();
  const a = findAsset(symbol);
  const meta = assetMeta(symbol);
  let price = Number.isFinite(buyPrice) && buyPrice > 0 ? buyPrice : currentPrice(symbol);
  if (!Number.isFinite(price) || price <= 0) price = undefined;
  if (!Number.isFinite(amount) && Number.isFinite(units) && price) amount = units * price;
  if (!Number.isFinite(units) && Number.isFinite(amount) && price) units = amount / price;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const now = new Date();
  const pos = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    asset: symbol, name: meta.name, currency: meta.currency,
    amount: Math.round(amount * 100) / 100,
    units: Number.isFinite(units) ? units : undefined,
    buyPrice: price,
    date: now.toLocaleDateString('fr-FR'),
    dateISO: now.toISOString().slice(0, 10),
    plan: (a && price) ? frozenPlanFor(a, price, s) : undefined,
    log: [], closed: null,
  };
  if (price) upsertPositionLog(pos, price);
  s.trades.push(pos);
  saveStore(s);
  renderPortfolio();
  return pos;
}

let investCtx = null;
function openInvest(a) {
  const s = fullStore();
  const cur = a.currency;
  const price = a.price;
  investCtx = { a };
  const fp = frozenPlanFor(a, price, s);
  $('#invest-title').textContent = `Investir — ${a.name} (${a.symbol})`;
  const planLine = fp
    ? `<p class="invest-plan">🛡️ Plan figé à l'achat : stop <b>${fmtPrice(fp.stop, cur)}</b> (−${fp.stopPct} %) · objectif <b>${fmtPrice(fp.target, cur)}</b> (+${fp.targetPct} %). Ces niveaux ne bougeront plus : c'est ta boussole pour les jours qui viennent.</p>`
    : '<p class="sub">Plan indisponible pour cet actif : la position sera suivie sans stop figé.</p>';
  $('#invest-body').innerHTML = `
    <p class="sub">Cours actuel : <b>${fmtPrice(price, cur)}</b>. Indique ce que tu as <b>réellement</b> acheté de ton côté — TradePilot suivra cette position jour après jour avec une consigne stable.</p>
    ${planLine}
    <form id="invest-form">
      <div class="invest-toggle">
        <label><input type="radio" name="invest-mode" value="amount" checked> Montant (€)</label>
        <label><input type="radio" name="invest-mode" value="units"> Quantité</label>
      </div>
      <div class="goal-row">
        <label class="invest-field" id="invest-qty-label">Montant investi (€)
          <input type="number" id="invest-qty" step="any" min="0" placeholder="ex : 50" required>
        </label>
        <label class="invest-field">Prix d'achat (${cur})
          <input type="number" id="invest-price" step="any" min="0" value="${price}">
        </label>
      </div>
      <p id="invest-preview" class="sub"></p>
      <button type="submit" class="btn">✅ Valider mon achat</button>
    </form>`;
  const qtyLabel = $('#invest-qty-label');
  const qtyInput = $('#invest-qty');
  const priceInput = $('#invest-price');
  const preview = $('#invest-preview');
  const mode = () => document.querySelector('input[name="invest-mode"]:checked').value;
  const refresh = () => {
    const m = mode();
    qtyLabel.childNodes[0].nodeValue = m === 'amount' ? 'Montant investi (€) ' : `Quantité (${a.symbol}) `;
    qtyInput.placeholder = m === 'amount' ? 'ex : 50' : 'ex : 0.25';
    const v = parseFloat(qtyInput.value);
    const p = parseFloat(priceInput.value) || price;
    if (Number.isFinite(v) && v > 0 && p > 0) {
      preview.innerHTML = m === 'amount'
        ? `≈ <b>${(v / p).toLocaleString('fr-FR', { maximumFractionDigits: 6 })} ${a.symbol}</b> au prix de ${fmtPrice(p, cur)}.`
        : `≈ <b>${(v * p).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</b> investis au prix de ${fmtPrice(p, cur)}.`;
    } else preview.textContent = '';
  };
  $('#invest-form').querySelectorAll('input').forEach(el => el.addEventListener('input', refresh));
  $('#invest-form').querySelectorAll('input[name="invest-mode"]').forEach(el => el.addEventListener('change', refresh));
  $('#invest-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const m = mode();
    const v = parseFloat(qtyInput.value);
    const p = parseFloat(priceInput.value);
    if (!Number.isFinite(v) || v <= 0) return;
    const created = addPosition({
      symbol: a.symbol,
      amount: m === 'amount' ? v : undefined,
      units: m === 'units' ? v : undefined,
      buyPrice: Number.isFinite(p) && p > 0 ? p : price,
    });
    $('#invest-modal').classList.add('hidden');
    if (created) {
      banner(`✅ Position ${a.symbol} enregistrée. Retrouve son suivi dans l'onglet Objectif → « Mes positions ».`, 'info');
    }
  });
  refresh();
  $('#invest-modal').classList.remove('hidden');
}

function bindInvest() {
  $('#invest-close').addEventListener('click', () => $('#invest-modal').classList.add('hidden'));
  $('#invest-modal').addEventListener('click', (e) => {
    if (e.target && e.target.id === 'invest-modal') $('#invest-modal').classList.add('hidden');
  });
}

// ---------- Fiabilité réelle des signaux (archive du robot) ----------
const HISTORY_SOURCES = [
  `${RAW}/main/data/history.json`,
  'data/history.json',
];
async function refreshHistory() {
  const el = $('#history-card');
  try {
    let h = null;
    for (const src of HISTORY_SOURCES) {
      try { h = await getJSON(src + '?t=' + Date.now()); break; } catch { /* source suivante */ }
    }
    if (!h || !h.performance || !Object.keys(h.performance).length) {
      el.innerHTML = '<b>📜 Fiabilité réelle des signaux</b><p class="sub">Le robot archive ses signaux depuis aujourd\'hui : les premières mesures de performance apparaîtront ici d\'elles-mêmes dans quelques jours.</p>';
      el.classList.remove('hidden');
      return;
    }
    const sigName = { STRONG_BUY: 'ACHAT FORT', BUY: 'ACHAT', WATCH: 'SURVEILLER', AVOID: 'ÉVITER' };
    let rows = '';
    for (const [hz, groups] of Object.entries(h.performance)) {
      for (const sig of ['STRONG_BUY', 'BUY', 'WATCH', 'AVOID']) {
        const st = groups[sig];
        if (!st) continue;
        rows += `<li class="${st.avg >= 0 ? 'plus' : 'minus'}">${sigName[sig]} à ${hz} : ` +
          `<b class="${st.avg >= 0 ? 'up' : 'down'}">${st.avg >= 0 ? '+' : ''}${st.avg} %</b> en moyenne · ` +
          `${st.winRate} % gagnants <small style="color:var(--faint)">(${st.n} signaux du ${groups.since})</small></li>`;
      }
    }
    el.innerHTML = '<b>📜 Fiabilité réelle des signaux (actions)</b>' +
      `<ul class="reasons" style="margin-top:8px">${rows}</ul>` +
      '<p class="sub" style="margin-top:8px">Le robot archive ses signaux chaque jour dans le dépôt public et mesure ce qu\'ils ont réellement donné — aucune triche possible.</p>';
    el.classList.remove('hidden');
  } catch { /* la carte reste masquée */ }
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
  return { capital: 10, goal: 10000, rate: 1, feePct: 0.5, trades: [], alerts: [], favorites: [], capitalLog: [], ...loadStore() };
}

// Journal quotidien du capital : une entrée par jour (la dernière valeur du
// jour écrase la précédente), pour mesurer la croissance réelle %/jour.
function recordCapital(s) {
  const today = new Date().toISOString().slice(0, 10);
  s.capitalLog = (s.capitalLog || []).filter(e => e && e.date !== today);
  s.capitalLog.push({ date: today, capital: s.capital });
  while (s.capitalLog.length > 366) s.capitalLog.shift();
}

// ---------- Sauvegarde / restauration des données locales ----------
function bindBackup() {
  $('#export-data').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(fullStore(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tradepilot-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('#import-file').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let clean = null;
      try { clean = sanitizeImportedStore(JSON.parse(reader.result)); } catch { /* JSON invalide */ }
      if (clean) {
        saveStore({ ...fullStore(), ...clean });
        renderPortfolio();
        applyView('crypto');
        applyView('stocks');
        banner('✅ Sauvegarde restaurée : capital, positions, alertes et favoris rechargés.', 'info');
      } else {
        banner('Fichier illisible — importe un fichier exporté par TradePilot (JSON).');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });
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
  $('#fee-pct').value = s.feePct;
  const prog = measureProgress(s.capitalLog);
  $('#real-progress').innerHTML = prog
    ? `📏 Croissance réelle mesurée : <b class="${prog.dailyPct >= 0 ? 'up' : 'down'}">${prog.dailyPct >= 0 ? '+' : ''}${prog.dailyPct} %/jour</b> en moyenne ` +
      `sur ${prog.days} jour(s) — ${prog.totalPct >= 0 ? '+' : ''}${prog.totalPct} % au total depuis le ${new Date(prog.from).toLocaleDateString('fr-FR')}. ` +
      `Objectif visé : ${s.rate} %/jour. ${prog.dailyPct >= s.rate ? 'Tu es au-dessus de ton objectif — reste discipliné, ne force pas.' : 'En dessous de l\'objectif : c\'est normal, la régularité bat la précipitation.'}`
    : `📏 Ta progression réelle sera mesurée jour après jour : mets ton capital à jour régulièrement, ta moyenne %/jour réelle s'affichera ici dès le deuxième jour.`;
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
  renderPositions();
}

// Consigne stable affichée par position (mappée depuis positionStatus).
const VERDICT = {
  STOP: { cls: 'AVOID', icon: '🛑', label: 'Stop touché — vends',
    advice: 'Le cours est passé sous ton stop de protection. Vends sans discuter : le plan est terminé, on protège le capital pour repartir ailleurs.' },
  TARGET: { cls: 'STRONG_BUY', icon: '🎯', label: 'Objectif atteint',
    advice: 'Bravo. Vends au moins la moitié pour sécuriser le gain, et remonte ton stop au prix d\'achat pour laisser courir le reste sans risque.' },
  HOLD_UP: { cls: 'BUY', icon: '✅', label: 'Garde',
    advice: 'Tu es en gain, entre ton prix d\'achat et l\'objectif. Le plan se déroule : ne touche à rien, laisse courir jusqu\'à l\'objectif ou le stop.' },
  HOLD_DOWN: { cls: 'WATCH', icon: '⏳', label: 'Garde, patiente',
    advice: 'Tu es sous ton prix d\'achat mais au-dessus du stop. Une position qui respire, c\'est normal : ne vends pas dans la panique, le stop fera son travail si nécessaire.' },
  UNKNOWN: { cls: 'WATCH', icon: '❔', label: 'Suivi indisponible',
    advice: 'Cours ou prix d\'achat manquant : la consigne se calculera dès que le cours sera connu.' },
};

function daysSince(dateISO) {
  if (!dateISO) return null;
  const start = Date.parse(dateISO + 'T00:00:00Z');
  if (!Number.isFinite(start)) return null;
  return Math.max(0, Math.floor((Date.now() - start) / 86400000));
}

function positionCard(pos) {
  const cur = pos.currency || '€';
  const current = currentPrice(pos.asset);
  const st = positionStatus(pos, current);
  const v = VERDICT[st.code] || VERDICT.UNKNOWN;
  const value = (Number.isFinite(current) && Number.isFinite(pos.buyPrice) && pos.buyPrice > 0 && Number.isFinite(pos.amount))
    ? pos.amount * (current / pos.buyPrice) : null;
  const plAbs = value !== null ? value - pos.amount : null;
  const li = document.createElement('li');
  li.className = 'position-card';
  const days = daysSince(pos.dateISO);
  const heldTxt = days === null ? '' : days === 0 ? "aujourd'hui" : `depuis ${days} j`;
  const qty = Number.isFinite(pos.units)
    ? `${pos.units.toLocaleString('fr-FR', { maximumFractionDigits: 6 })} ${pos.asset}`
    : `${pos.amount.toLocaleString('fr-FR')} €`;

  // Barre stop → objectif avec le repère du cours actuel.
  let bar = '';
  if (st.progressPct !== null) {
    const buyMark = (st.target > st.stop)
      ? Math.max(0, Math.min(100, (pos.buyPrice - st.stop) / (st.target - st.stop) * 100)) : 50;
    bar = `<div class="pos-progress" title="Position du cours entre le stop et l'objectif">
        <div class="pos-progress-fill ${v.cls}" style="width:${st.progressPct}%"></div>
        <span class="pos-mark buy" style="left:${buyMark}%" title="Ton prix d'achat"></span>
      </div>
      <div class="pos-progress-legend"><span>🛑 ${fmtPrice(st.stop, cur)}</span><span>🎯 ${fmtPrice(st.target, cur)}</span></div>`;
  }

  // Mini-historique de la valeur (suivi multi-jours).
  const log = Array.isArray(pos.log) ? pos.log : [];
  const history = log.length >= 2
    ? '<canvas class="pos-spark"></canvas>'
    : '<small class="sub">📅 Le suivi s\'enrichit chaque jour : reviens demain pour voir la courbe.</small>';

  const valLine = value === null
    ? '<small class="sub">Valorisation indisponible (cours ou prix d\'achat manquant).</small>'
    : `<b class="${plAbs >= 0 ? 'up' : 'down'}">${value.toFixed(2)} €</b> ` +
      `<span class="${plAbs >= 0 ? 'up' : 'down'}">(${plAbs >= 0 ? '+' : ''}${plAbs.toFixed(2)} € · ${fmtPct(st.plPct)})</span>`;

  li.innerHTML = `
    <div class="pos-top">
      <div>
        <b>${pos.name || pos.asset}</b> <span class="sym">${pos.asset}</span>
        <small class="sub">${qty}${pos.buyPrice ? ` @ ${fmtPrice(pos.buyPrice, cur)}` : ''} · ${heldTxt}</small>
      </div>
      <button class="pos-del" title="Supprimer cette position">✕</button>
    </div>
    <div class="pos-valuation">${valLine}</div>
    <div class="pos-verdict ${v.cls}">
      <span class="badge ${v.cls}">${v.icon} ${v.label}</span>
      <p>${v.advice}</p>
    </div>
    ${bar}
    <div class="pos-history">${history}</div>
    <div class="pos-actions">
      <button class="chip pos-sell">💸 J'ai vendu</button>
    </div>`;

  li.querySelector('.pos-del').onclick = () => removePosition(pos.id);
  li.querySelector('.pos-sell').onclick = () => sellPosition(pos.id);
  if (log.length >= 2) {
    drawSpark(li.querySelector('.pos-spark'), log.map(e => e.value), 240, 46);
  }
  return li;
}

function removePosition(id) {
  const s = fullStore();
  const i = s.trades.findIndex(t => t.id === id);
  if (i >= 0) { s.trades.splice(i, 1); saveStore(s); renderPortfolio(); }
}

function sellPosition(id) {
  const s = fullStore();
  const pos = s.trades.find(t => t.id === id);
  if (!pos) return;
  const current = currentPrice(pos.asset);
  const st = positionStatus(pos, current);
  const now = new Date();
  pos.closed = {
    price: Number.isFinite(current) ? current : pos.buyPrice,
    plPct: st.plPct,
    date: now.toLocaleDateString('fr-FR'),
    dateISO: now.toISOString().slice(0, 10),
  };
  saveStore(s);
  renderPortfolio();
}

function renderPositions() {
  const s = fullStore();
  let changed = false;
  s.trades.forEach((p, i) => { if (!p.id) { p.id = Date.now() + i; changed = true; } });
  for (const pos of s.trades) {
    if (pos.closed) continue;
    const cur = currentPrice(pos.asset);
    if (cur !== null && upsertPositionLog(pos, cur)) changed = true;
  }
  if (changed) saveStore(s);

  const open = s.trades.filter(p => !p.closed);
  const ul = $('#trade-list');
  ul.innerHTML = '';
  open.forEach(pos => ul.appendChild(positionCard(pos)));

  const { totals } = valuePositions(open, currentPrice);
  const tot = $('#positions-total');
  if (totals.valuedCount > 0) {
    tot.innerHTML = `Valeur totale des positions ouvertes : <b>${totals.value.toFixed(2)} €</b> pour ` +
      `${totals.invested.toFixed(2)} € investis — <b class="${totals.plAbs >= 0 ? 'up' : 'down'}">` +
      `${totals.plAbs >= 0 ? '+' : ''}${totals.plAbs.toFixed(2)} € (${fmtPct(totals.plPct)})</b>. ` +
      `Actualisée en direct avec les cours.`;
  } else {
    tot.textContent = open.length ? '' : 'Clique sur 💰 Investir depuis un actif (ou ajoute une position ci-dessous) pour lancer le suivi jour après jour.';
  }
  renderClosedPositions(s);
}

function renderClosedPositions(s) {
  const box = $('#closed-positions');
  if (!box) return;
  const closed = s.trades.filter(p => p.closed);
  if (!closed.length) { box.innerHTML = ''; return; }
  const rows = closed.map(p => {
    const pl = p.closed.plPct;
    const cls = Number.isFinite(pl) ? (pl >= 0 ? 'up' : 'down') : 'sub';
    const plTxt = Number.isFinite(pl) ? `${pl >= 0 ? '+' : ''}${fmtPct(pl)}` : '—';
    const i = s.trades.indexOf(p);
    return `<li><span>${p.name || p.asset} <small class="sub">${p.asset} · acheté ${p.date}, vendu ${p.closed.date}</small></span>` +
      `<span class="${cls}">${plTxt}</span>` +
      `<button class="pos-del" data-i="${i}" title="Retirer de l'historique">✕</button></li>`;
  }).join('');
  box.innerHTML = `<h3>📒 Positions clôturées</h3><ul id="closed-list">${rows}</ul>`;
  box.querySelectorAll('.pos-del').forEach(b => b.onclick = () => {
    const st = fullStore();
    st.trades.splice(parseInt(b.dataset.i, 10), 1);
    saveStore(st); renderPortfolio();
  });
}

function bindPortfolio() {
  for (const [id, key] of [['#capital', 'capital'], ['#goal', 'goal'], ['#daily-rate', 'rate'], ['#fee-pct', 'feePct']]) {
    $(id).addEventListener('change', (e) => {
      const s = fullStore();
      const v = parseFloat(e.target.value);
      if (Number.isFinite(v) && (key === 'feePct' ? v >= 0 : v > 0)) s[key] = v;
      if (key === 'capital') recordCapital(s);
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
  $('#trade-asset').addEventListener('change', () => {
    const p = currentPrice($('#trade-asset').value.trim().toUpperCase());
    if (p !== null && !$('#trade-buy').value) $('#trade-buy').value = p;
  });
  $('#trade-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const buyPrice = parseFloat($('#trade-buy').value);
    addPosition({
      symbol: $('#trade-asset').value.trim().toUpperCase(),
      amount: parseFloat($('#trade-amount').value),
      buyPrice: Number.isFinite(buyPrice) && buyPrice > 0 ? buyPrice : undefined,
    });
    e.target.reset();
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

{ // Premier point du journal de capital (mesure de la progression réelle).
  const s = fullStore();
  recordCapital(s);
  saveStore(s);
}
refreshCrypto();
refreshStocks();
refreshHistory();
refreshTrends();
refreshFearGreed();
renderPortfolio();
bindPortfolio();
bindBackup();
bindToolbars();
bindChart();
bindPlan();
bindInvest();
setInterval(refreshCrypto, REFRESH_MS);
setInterval(refreshStocks, REFRESH_MS * 3);
setInterval(refreshHistory, REFRESH_MS * 6);
setInterval(refreshTrends, REFRESH_MS * 2);
