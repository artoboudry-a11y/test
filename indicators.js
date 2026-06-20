// Bibliothèque d'indicateurs techniques — module partagé navigateur / Node.
// Toutes les fonctions prennent des tableaux de nombres (du plus ancien au plus récent).

export function sma(values, period) {
  if (values.length < period) return null;
  let sum = 0;
  for (let i = values.length - period; i < values.length; i++) sum += values[i];
  return sum / period;
}

export function emaSeries(values, period) {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const out = [];
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out.push(prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export function ema(values, period) {
  const s = emaSeries(values, period);
  return s.length ? s[s.length - 1] : null;
}

// RSI de Wilder sur `period` périodes (classique : 14).
export function rsi(values, period = 14) {
  if (values.length < period + 1) return null;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgGain = gain / period, avgLoss = loss / period;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

// MACD (12/26/9) : retourne { macd, signal, histogram } ou null.
export function macd(values, fast = 12, slow = 26, signalP = 9) {
  if (values.length < slow + signalP) return null;
  const fastS = emaSeries(values, fast);
  const slowS = emaSeries(values, slow);
  const offset = fastS.length - slowS.length;
  const macdLine = slowS.map((v, i) => fastS[i + offset] - v);
  const signalS = emaSeries(macdLine, signalP);
  const m = macdLine[macdLine.length - 1];
  const s = signalS[signalS.length - 1];
  return { macd: m, signal: s, histogram: m - s };
}

// Variation en % entre la dernière valeur et celle d'il y a `lookback` périodes.
export function momentum(values, lookback) {
  if (values.length <= lookback) return null;
  const past = values[values.length - 1 - lookback];
  if (!past) return null;
  return ((values[values.length - 1] - past) / past) * 100;
}

// Ratio volume récent / volume moyen (signal d'intérêt de la foule).
export function volumeRatio(volumes, recent = 5, base = 20) {
  if (volumes.length < base + recent) return null;
  const r = volumes.slice(-recent).reduce((a, b) => a + b, 0) / recent;
  const b = volumes.slice(-(base + recent), -recent).reduce((a, b2) => a + b2, 0) / base;
  if (!b) return null;
  return r / b;
}

// Score composite 0–100 combinant tendance, momentum, RSI, MACD et volume.
// Philosophie : suivre la tendance confirmée, éviter le surachat extrême.
export function computeScore({ closes, volumes }) {
  const parts = [];
  const r = rsi(closes, 14);
  const m = macd(closes);
  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50);
  const mom7 = momentum(closes, Math.min(7, closes.length - 1));
  const mom30 = momentum(closes, Math.min(30, closes.length - 1));
  const vr = volumes ? volumeRatio(volumes) : null;
  const last = closes[closes.length - 1];

  // Tendance (30 pts) : prix au-dessus des moyennes mobiles, EMA20 > EMA50.
  let trend = 0;
  if (e20 !== null && e50 !== null) {
    if (last > e20) trend += 10;
    if (last > e50) trend += 8;
    if (e20 > e50) trend += 12;
  }
  parts.push({ label: 'Tendance', pts: trend, max: 30 });

  // Momentum (25 pts) : progression récente sans excès.
  let momPts = 0;
  if (mom7 !== null) momPts += Math.max(0, Math.min(13, mom7 * 1.6 + 5));
  if (mom30 !== null) momPts += Math.max(0, Math.min(12, mom30 * 0.5 + 4));
  parts.push({ label: 'Momentum', pts: Math.round(momPts), max: 25 });

  // RSI (20 pts) : zone saine 45–65 = max ; surachat/survente pénalisés.
  let rsiPts = 0;
  if (r !== null) {
    if (r >= 45 && r <= 65) rsiPts = 20;
    else if (r > 65 && r <= 75) rsiPts = 12;
    else if (r >= 35 && r < 45) rsiPts = 10;
    else if (r > 75) rsiPts = 3;
    else rsiPts = 5;
  }
  parts.push({ label: 'RSI', pts: rsiPts, max: 20 });

  // MACD (15 pts) : histogramme positif et croissant = signal haussier.
  let macdPts = 0;
  if (m !== null) {
    if (m.histogram > 0) macdPts += 9;
    if (m.macd > 0) macdPts += 6;
  }
  parts.push({ label: 'MACD', pts: macdPts, max: 15 });

  // Volume (10 pts) : la foule entre sur le titre.
  let volPts = 0;
  if (vr !== null) volPts = Math.max(0, Math.min(10, (vr - 0.8) * 12));
  parts.push({ label: 'Volume', pts: Math.round(volPts), max: 10 });

  const score = Math.round(Math.max(0, Math.min(100,
    trend + momPts + rsiPts + macdPts + volPts)));

  return {
    score,
    rsi: r === null ? null : Math.round(r * 10) / 10,
    macdHist: m === null ? null : m.histogram,
    ema20: e20, ema50: e50,
    mom7: mom7 === null ? null : Math.round(mom7 * 100) / 100,
    mom30: mom30 === null ? null : Math.round(mom30 * 100) / 100,
    volRatio: vr === null ? null : Math.round(vr * 100) / 100,
    parts,
  };
}

// Variante de computeScore quand les indicateurs sont déjà calculés par la
// source (ex : scanner TradingView). Mêmes pondérations que computeScore.
export function computeScoreFromMetrics({ price, ema20, ema50, rsi: r, macd: m, macdSignal,
  perfW, perf1M, volume, avgVol10, avgVol30 }) {
  let trend = 0;
  if (Number.isFinite(ema20) && Number.isFinite(ema50) && Number.isFinite(price)) {
    if (price > ema20) trend += 10;
    if (price > ema50) trend += 8;
    if (ema20 > ema50) trend += 12;
  }
  let momPts = 0;
  if (Number.isFinite(perfW)) momPts += Math.max(0, Math.min(13, perfW * 1.6 + 5));
  if (Number.isFinite(perf1M)) momPts += Math.max(0, Math.min(12, perf1M * 0.5 + 4));
  let rsiPts = 0;
  if (Number.isFinite(r)) {
    if (r >= 45 && r <= 65) rsiPts = 20;
    else if (r > 65 && r <= 75) rsiPts = 12;
    else if (r >= 35 && r < 45) rsiPts = 10;
    else if (r > 75) rsiPts = 3;
    else rsiPts = 5;
  }
  let macdHist = null, macdPts = 0;
  if (Number.isFinite(m) && Number.isFinite(macdSignal)) {
    macdHist = m - macdSignal;
    if (macdHist > 0) macdPts += 9;
    if (m > 0) macdPts += 6;
  }
  let vr = null, volPts = 0;
  if (Number.isFinite(avgVol10) && Number.isFinite(avgVol30) && avgVol30 > 0) vr = avgVol10 / avgVol30;
  else if (Number.isFinite(volume) && Number.isFinite(avgVol30) && avgVol30 > 0) vr = volume / avgVol30;
  if (vr !== null) volPts = Math.max(0, Math.min(10, (vr - 0.8) * 12));

  const score = Math.round(Math.max(0, Math.min(100, trend + momPts + rsiPts + macdPts + volPts)));
  return {
    score,
    rsi: Number.isFinite(r) ? Math.round(r * 10) / 10 : null,
    macdHist,
    ema20: Number.isFinite(ema20) ? ema20 : null,
    ema50: Number.isFinite(ema50) ? ema50 : null,
    mom7: Number.isFinite(perfW) ? Math.round(perfW * 100) / 100 : null,
    mom30: Number.isFinite(perf1M) ? Math.round(perf1M * 100) / 100 : null,
    volRatio: vr === null ? null : Math.round(vr * 100) / 100,
    parts: [
      { label: 'Tendance', pts: trend, max: 30 },
      { label: 'Momentum', pts: Math.round(momPts), max: 25 },
      { label: 'RSI', pts: rsiPts, max: 20 },
      { label: 'MACD', pts: macdPts, max: 15 },
      { label: 'Volume', pts: Math.round(volPts), max: 10 },
    ],
  };
}

// Volatilité : écart-type des rendements (%) sur la fenêtre fournie.
export function volatility(values, lookback = 30) {
  const v = values.slice(-lookback - 1);
  if (v.length < 8) return null;
  const rets = [];
  for (let i = 1; i < v.length; i++) {
    if (v[i - 1]) rets.push((v[i] - v[i - 1]) / v[i - 1] * 100);
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
  return Math.sqrt(variance);
}

// Niveau de risque à partir de la volatilité par période (%) ou, à défaut,
// de l'amplitude du momentum.
export function riskLevel({ vol, mom30 }) {
  let v = vol;
  if (v === null || v === undefined) {
    v = mom30 === null || mom30 === undefined ? 2 : Math.abs(mom30) / 8;
  }
  if (v < 1.2) return { code: 'LOW', label: 'Risque faible' };
  if (v < 3) return { code: 'MED', label: 'Risque moyen' };
  return { code: 'HIGH', label: 'Risque élevé' };
}

// Explications lisibles d'un signal, à partir des métriques disponibles.
// Retourne une liste de { plus: bool, text } triée du plus important au moins.
export function explainFromMetrics({ rsi: r, macdHist, mom7, mom30, volRatio, price, ema20, ema50, momUnit = 'j' }) {
  const out = [];
  const has = (x) => x !== null && x !== undefined && Number.isFinite(x);
  if (has(price) && has(ema20) && has(ema50)) {
    if (price > ema20 && ema20 > ema50) out.push({ plus: true, text: 'Tendance haussière confirmée : prix au-dessus de ses moyennes 20 et 50 périodes.' });
    else if (price < ema20 && ema20 < ema50) out.push({ plus: false, text: 'Tendance baissière : prix sous ses moyennes 20 et 50 périodes.' });
    else out.push({ plus: false, text: 'Tendance indécise : moyennes mobiles entremêlées.' });
  }
  if (has(macdHist)) {
    out.push(macdHist > 0
      ? { plus: true, text: 'MACD haussier : la dynamique accélère.' }
      : { plus: false, text: 'MACD baissier : la dynamique faiblit.' });
  }
  if (has(r)) {
    if (r >= 45 && r <= 65) out.push({ plus: true, text: `RSI sain à ${Math.round(r)} : ni surchauffe ni faiblesse.` });
    else if (r > 75) out.push({ plus: false, text: `Surachat (RSI ${Math.round(r)}) : risque de repli à court terme.` });
    else if (r > 65) out.push({ plus: false, text: `RSI élevé (${Math.round(r)}) : déjà bien monté, prudence.` });
    else if (r < 30) out.push({ plus: false, text: `Survente (RSI ${Math.round(r)}) : chute brutale récente.` });
    else out.push({ plus: false, text: `RSI mou (${Math.round(r)}) : peu d'élan acheteur.` });
  }
  if (has(mom7)) {
    if (mom7 > 1.5) out.push({ plus: true, text: `Momentum court terme : +${mom7.toFixed(1)} % sur 7 ${momUnit}.` });
    else if (mom7 < -1.5) out.push({ plus: false, text: `Repli court terme : ${mom7.toFixed(1)} % sur 7 ${momUnit}.` });
  }
  if (has(mom30)) {
    if (mom30 > 4) out.push({ plus: true, text: `Fond de tendance positif : +${mom30.toFixed(1)} % sur 30 ${momUnit}.` });
    else if (mom30 < -4) out.push({ plus: false, text: `Fond de tendance négatif : ${mom30.toFixed(1)} % sur 30 ${momUnit}.` });
  }
  if (has(volRatio)) {
    if (volRatio >= 1.3) out.push({ plus: true, text: `Volume ×${volRatio.toFixed(1)} : la foule entre sur l'actif.` });
    else if (volRatio <= 0.7) out.push({ plus: false, text: 'Volume en retrait : peu de conviction.' });
  }
  return out;
}

// Évalue des alertes de prix. `getPrice(symbol)` retourne le cours actuel
// ou null. Retourne les alertes déclenchées (avec le cours constaté).
export function evaluateAlerts(alerts, getPrice) {
  const triggered = [];
  const waiting = [];
  for (const al of alerts) {
    const p = getPrice(al.symbol);
    const hit = Number.isFinite(p) &&
      ((al.dir === 'above' && p >= al.price) || (al.dir === 'below' && p <= al.price));
    if (hit) triggered.push({ ...al, hitPrice: p });
    else waiting.push(al);
  }
  return { triggered, waiting };
}

// Valorise des positions { asset, amount (montant investi), buyPrice }.
// La valeur actuelle = montant × (cours actuel / prix d'achat), ce qui évite
// toute conversion de devise. Les positions sans prix d'achat restent non valorisées.
export function valuePositions(trades, getPrice) {
  const rows = trades.map(t => {
    const current = getPrice(t.asset);
    if (!Number.isFinite(current) || !Number.isFinite(t.buyPrice) || t.buyPrice <= 0 || !Number.isFinite(t.amount)) {
      return { ...t, current: null, value: null, plPct: null };
    }
    const value = t.amount * (current / t.buyPrice);
    return { ...t, current, value, plPct: (current / t.buyPrice - 1) * 100 };
  });
  const valued = rows.filter(r => r.value !== null);
  const invested = valued.reduce((a, r) => a + r.amount, 0);
  const value = valued.reduce((a, r) => a + r.value, 0);
  return {
    rows,
    totals: {
      invested, value, plAbs: value - invested,
      plPct: invested > 0 ? (value / invested - 1) * 100 : null,
      valuedCount: valued.length,
    },
  };
}

// Consigne STABLE d'une position ouverte, dérivée du plan FIGÉ au moment de
// l'achat (prix d'achat, stop, objectif) — elle ne dépend pas du signal du jour.
// Tant que le cours reste entre le stop et l'objectif, la consigne ne change
// pas : c'est ce qui permet un vrai suivi sur plusieurs jours sans zapper.
// Codes :
//   STOP       cours ≤ stop → sortir pour protéger le capital
//   TARGET     cours ≥ objectif → vendre au moins la moitié, remonter le stop
//   HOLD_UP    en gain, sous l'objectif → garder, laisser courir
//   HOLD_DOWN  sous le prix d'achat mais au-dessus du stop → garder, patienter
//   UNKNOWN    cours ou prix d'achat manquant
export function positionStatus(pos, current) {
  const buyPrice = pos && Number.isFinite(pos.buyPrice) && pos.buyPrice > 0 ? pos.buyPrice : null;
  if (!Number.isFinite(current) || buyPrice === null) {
    return { code: 'UNKNOWN', plPct: null, progressPct: null, stop: null, target: null, buyPrice };
  }
  const plan = (pos && pos.plan) || {};
  const stop = Number.isFinite(plan.stop) && plan.stop > 0 ? plan.stop : null;
  const target = Number.isFinite(plan.target) && plan.target > 0 ? plan.target : null;
  const plPct = Math.round((current / buyPrice - 1) * 100 * 100) / 100;
  let progressPct = null;
  if (stop !== null && target !== null && target > stop) {
    progressPct = Math.round(Math.max(0, Math.min(100, (current - stop) / (target - stop) * 100)) * 10) / 10;
  }
  let code;
  if (stop !== null && current <= stop) code = 'STOP';
  else if (target !== null && current >= target) code = 'TARGET';
  else if (current >= buyPrice) code = 'HOLD_UP';
  else code = 'HOLD_DOWN';
  return { code, plPct, progressPct, stop, target, buyPrice };
}

// Plan d'action concret pour un actif : faut-il entrer, à quel prix, où placer
// le stop de protection, quel objectif de vente viser, sur quel horizon et avec
// quelle taille de position. Tout est dérivé mécaniquement des indicateurs et
// de la volatilité mesurée — aucune prédiction, des règles de discipline.
// Options : feePct = frais de courtage par ordre (%), capital = capital (€).
export function buildTradePlan(a, { feePct = 0, capital = null } = {}) {
  const price = a.price;
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(a.score)) return null;
  const fee = Number.isFinite(feePct) && feePct >= 0 ? feePct : 0;
  const breakevenPct = Math.round(2 * fee * 100) / 100; // aller-retour à amortir

  // Volatilité quotidienne estimée : spark horaire (crypto) → ×√24,
  // spark quotidien (actions) → tel quel, sinon estimation via momentum 30.
  const volPeriod = a.spark && a.spark.length > 8 ? volatility(a.spark) : null;
  let dailyVol;
  if (volPeriod !== null) dailyVol = a.momUnit === 'h' ? volPeriod * Math.sqrt(24) : volPeriod;
  else dailyVol = a.mom30 !== null && a.mom30 !== undefined ? Math.max(0.8, Math.abs(a.mom30) / 8) : 2;
  dailyVol = Math.round(dailyVol * 100) / 100;
  const risk = riskLevel({ vol: volPeriod, mom30: a.mom30 });

  // Décision d'entrée : signal d'achat requis ; si le cours est très étiré
  // au-dessus de l'EMA20 ou en surachat, on attend un repli vers l'EMA20.
  const stretchPct = Number.isFinite(a.ema20) ? ((price - a.ema20) / a.ema20) * 100 : null;
  let action;
  if (a.score < 40) action = 'AVOID';
  else if (a.score < 55) action = 'WAIT_SIGNAL';
  else if ((a.rsi !== null && a.rsi !== undefined && a.rsi > 72) || (stretchPct !== null && stretchPct > 4)) action = 'WAIT_PULLBACK';
  else action = 'ENTER';

  const base = { action, score: a.score, dailyVol, risk, feePct: fee, breakevenPct };
  if (action === 'AVOID' || action === 'WAIT_SIGNAL') return base;

  // Zone d'entrée : au cours actuel (ENTER) ou autour de l'EMA20 (repli).
  const r4 = (x) => Math.round(x * 10000) / 10000;
  let entryLow, entryHigh;
  if (action === 'WAIT_PULLBACK') {
    entryLow = a.ema20 * 0.995;
    entryHigh = a.ema20 * 1.01;
  } else {
    entryLow = Number.isFinite(a.ema20) && a.ema20 < price ? a.ema20 : price * (1 - dailyVol / 100);
    entryHigh = price;
  }
  const entryMid = (entryLow + entryHigh) / 2;

  // Stop : ~1,8× la volatilité quotidienne sous l'entrée (borné 2–12 %),
  // jamais plus serré que les frais aller-retour + 1 %.
  const stopPct = Math.round(Math.max(2, Math.min(12, 1.8 * dailyVol), breakevenPct + 1) * 100) / 100;
  // Objectif de vente : 2× le risque pris, frais d'aller-retour inclus.
  const targetPct = Math.round((2 * stopPct + breakevenPct) * 100) / 100;
  const stop = r4(entryMid * (1 - stopPct / 100));
  const target = r4(entryMid * (1 + targetPct / 100));

  // Horizon : temps typique pour parcourir l'objectif au rythme de la
  // volatilité quotidienne (fourchette honnête, pas une promesse).
  const dailyProgress = Math.max(dailyVol * 0.5, 0.15);
  const mid = targetPct / dailyProgress;
  const horizonDays = [Math.max(1, Math.ceil(mid * 0.6)), Math.max(2, Math.ceil(mid * 1.6))];

  // Taille de position : on ne risque que 1 % du capital sur le stop,
  // et jamais plus de 25 % du capital sur une seule position.
  let positionEur = null, riskEur = null, goalContribPctPerDay = null;
  if (Number.isFinite(capital) && capital > 0) {
    riskEur = Math.round(capital * 0.01 * 100) / 100;
    positionEur = Math.round(Math.min(capital * 0.25, riskEur / (stopPct / 100)) * 100) / 100;
    const netGain = positionEur * 2 * stopPct / 100; // objectif − frais = 2× risque
    goalContribPctPerDay = Math.round(netGain / mid / capital * 100 * 1000) / 1000;
  }

  return { ...base, entryLow: r4(entryLow), entryHigh: r4(entryHigh), stop, stopPct,
    target, targetPct, rr: 2, horizonDays, positionEur, riskEur, goalContribPctPerDay };
}

// Mesure la progression réelle du capital à partir du journal quotidien
// [{ date: 'YYYY-MM-DD', capital }]. Retourne le taux de croissance moyen par
// jour (géométrique), la variation totale et la période couverte, ou null si
// moins de deux jours distincts sont disponibles.
export function measureProgress(log) {
  if (!Array.isArray(log)) return null;
  const entries = log
    .filter(e => e && typeof e.date === 'string' && Number.isFinite(e.capital) && e.capital > 0)
    .sort((x, y) => x.date.localeCompare(y.date));
  if (entries.length < 2) return null;
  const first = entries[0], last = entries[entries.length - 1];
  const days = Math.round((new Date(last.date) - new Date(first.date)) / 86400e3);
  if (!Number.isFinite(days) || days < 1) return null;
  const ratio = last.capital / first.capital;
  return {
    days,
    totalPct: Math.round((ratio - 1) * 10000) / 100,
    dailyPct: Math.round((Math.pow(ratio, 1 / days) - 1) * 100000) / 1000,
    from: first.date, to: last.date,
  };
}

// Filtre une liste d'actifs par texte libre (nom ou symbole), insensible
// à la casse et aux accents. Requête vide → liste inchangée (copie).
export function filterAssets(assets, query) {
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const q = norm(query).trim();
  if (!q) return assets.slice();
  return assets.filter(a => norm(a.symbol).includes(q) || norm(a.name).includes(q));
}

// Remonte les favoris en tête de liste sans changer l'ordre relatif
// (tri stable : les favoris restent triés entre eux, idem pour les autres).
export function pinFavorites(assets, favorites) {
  if (!favorites || !favorites.length) return assets;
  const fav = new Set(favorites);
  return [...assets.filter(a => fav.has(a.symbol)), ...assets.filter(a => !fav.has(a.symbol))];
}

// Nettoie une sauvegarde importée (fichier JSON fourni par l'utilisateur) :
// ne conserve que les champs connus avec des types valides, ignore le reste.
// Retourne null si rien d'exploitable (fichier étranger ou corrompu).
export function sanitizeImportedStore(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out = {};
  for (const k of ['capital', 'goal', 'rate']) {
    if (Number.isFinite(raw[k]) && raw[k] > 0) out[k] = raw[k];
  }
  if (Number.isFinite(raw.feePct) && raw.feePct >= 0 && raw.feePct <= 20) out.feePct = raw.feePct;
  if (Array.isArray(raw.capitalLog)) {
    out.capitalLog = raw.capitalLog
      .filter(e => e && typeof e.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date)
        && Number.isFinite(e.capital) && e.capital > 0)
      .map(e => ({ date: e.date, capital: e.capital }));
  }
  if (Array.isArray(raw.trades)) {
    const numOrU = (x, min = -Infinity) => (Number.isFinite(x) && x > min ? x : undefined);
    out.trades = raw.trades
      .filter(t => t && typeof t.asset === 'string' && t.asset.trim() && Number.isFinite(t.amount) && t.amount > 0)
      .map((t, i) => {
        const plan = t.plan && typeof t.plan === 'object' ? {
          stop: numOrU(t.plan.stop, 0), target: numOrU(t.plan.target, 0),
          stopPct: numOrU(t.plan.stopPct, 0), targetPct: numOrU(t.plan.targetPct, 0),
          entryLow: numOrU(t.plan.entryLow, 0), entryHigh: numOrU(t.plan.entryHigh, 0),
          dailyVol: numOrU(t.plan.dailyVol, 0),
        } : undefined;
        const log = Array.isArray(t.log) ? t.log
          .filter(e => e && typeof e.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date)
            && Number.isFinite(e.price) && Number.isFinite(e.value))
          .map(e => ({ date: e.date, price: e.price, value: e.value })) : undefined;
        const closed = t.closed && typeof t.closed === 'object' && Number.isFinite(t.closed.price) ? {
          price: t.closed.price,
          plPct: numOrU(t.closed.plPct),
          pl: Number.isFinite(t.closed.pl) ? t.closed.pl : undefined,
          date: typeof t.closed.date === 'string' ? t.closed.date : '',
          dateISO: typeof t.closed.dateISO === 'string' ? t.closed.dateISO : '',
        } : null;
        return {
          id: numOrU(t.id, 0) || Date.now() + i,
          asset: t.asset.trim().toUpperCase(),
          name: typeof t.name === 'string' && t.name.trim() ? t.name.trim() : undefined,
          currency: typeof t.currency === 'string' ? t.currency : undefined,
          amount: t.amount,
          units: numOrU(t.units, 0),
          buyPrice: numOrU(t.buyPrice, 0),
          date: typeof t.date === 'string' ? t.date : '',
          dateISO: typeof t.dateISO === 'string' ? t.dateISO : '',
          plan, log, closed,
        };
      });
  }
  if (Array.isArray(raw.alerts)) {
    out.alerts = raw.alerts
      .filter(a => a && typeof a.symbol === 'string' && a.symbol.trim() && Number.isFinite(a.price) && a.price > 0)
      .map((a, i) => ({
        id: Number.isFinite(a.id) ? a.id : Date.now() + i,
        symbol: a.symbol.trim().toUpperCase(),
        dir: a.dir === 'below' ? 'below' : 'above',
        price: a.price,
        ...(a.hit && typeof a.hit === 'object' ? { hit: a.hit } : {}),
      }));
  }
  if (Array.isArray(raw.favorites)) {
    out.favorites = [...new Set(raw.favorites
      .filter(f => typeof f === 'string' && f.trim())
      .map(f => f.trim().toUpperCase()))];
  }
  return Object.keys(out).length ? out : null;
}

export function signalFromScore(score) {
  if (score >= 70) return { code: 'STRONG_BUY', label: 'ACHAT FORT' };
  if (score >= 55) return { code: 'BUY', label: 'ACHAT' };
  if (score >= 40) return { code: 'WATCH', label: 'SURVEILLER' };
  return { code: 'AVOID', label: 'ÉVITER' };
}
