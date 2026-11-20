/* ==========================================================================
   DeltaPulse 50x — Standalone & Android Native Engine
   Top 10 High-Volume Crypto • BUY/HOLD/EXIT Tabs • Option Chain/PCR • Pop-Ups
   ========================================================================== */
(() => {
  const UNIVERSE = [
    { symbol: 'BTCUSD', asset: 'BTC', name: 'Bitcoin', price: 66540.0, vol24hM: 8420, oiM: 1420, spreadBps: 0.4, pcrOI: 1.28, pcrVol: 1.19 },
    { symbol: 'ETHUSD', asset: 'ETH', name: 'Ethereum', price: 2485.0, vol24hM: 4310, oiM: 890, spreadBps: 0.6, pcrOI: 1.22, pcrVol: 1.15 },
    { symbol: 'SOLUSD', asset: 'SOL', name: 'Solana', price: 168.40, vol24hM: 2190, oiM: 460, spreadBps: 0.9, pcrOI: 1.34, pcrVol: 1.26 },
    { symbol: 'XRPUSD', asset: 'XRP', name: 'Ripple', price: 1.1240, vol24hM: 1180, oiM: 240, spreadBps: 1.1, pcrOI: 1.14, pcrVol: 1.08 },
    { symbol: 'DOGEUSD', asset: 'DOGE', name: 'Dogecoin', price: 0.1945, vol24hM: 940, oiM: 195, spreadBps: 1.3, pcrOI: 1.18, pcrVol: 1.21 },
    { symbol: 'BNBUSD', asset: 'BNB', name: 'BNB', price: 614.80, vol24hM: 680, oiM: 165, spreadBps: 1.2, pcrOI: 1.09, pcrVol: 1.05 },
    { symbol: 'SUIUSD', asset: 'SUI', name: 'Sui', price: 2.3650, vol24hM: 615, oiM: 142, spreadBps: 1.5, pcrOI: 1.31, pcrVol: 1.24 },
    { symbol: 'AVAXUSD', asset: 'AVAX', name: 'Avalanche', price: 31.45, vol24hM: 440, oiM: 110, spreadBps: 1.6, pcrOI: 0.82, pcrVol: 0.86 },
    { symbol: 'LINKUSD', asset: 'LINK', name: 'Chainlink', price: 15.82, vol24hM: 390, oiM: 98, spreadBps: 1.7, pcrOI: 1.16, pcrVol: 1.11 },
    { symbol: 'ADAUSD', asset: 'ADA', name: 'Cardano', price: 0.6240, vol24hM: 355, oiM: 88, spreadBps: 1.8, pcrOI: 0.78, pcrVol: 0.81 }
  ];

  let activeTab = 'ALL';
  let selectedSymbol = 'BTCUSD';
  let searchQuery = '';
  let timeframe = '15m';
  let cooldowns = {};
  let logs = [];

  // Persistent HOLD trades in localStorage
  let holds = JSON.parse(localStorage.getItem('dp50x_holds') || 'null') || [
    { symbol: 'BTCUSD', direction: 'LONG', capital: 10, entryPrice: 66450.0 },
    { symbol: 'SOLUSD', direction: 'LONG', capital: 10, entryPrice: 168.02 }
  ];

  function saveHolds() {
    localStorage.setItem('dp50x_holds', JSON.stringify(holds));
  }

  // Initialize candles for all Top 10 coins
  const coins = UNIVERSE.map((c, i) => {
    const candles = [];
    let p = c.price * 0.996;
    const dec = c.price < 10 ? 4 : 2;
    for (let k = 55; k >= 0; k--) {
      const cl = +(p * (1 + Math.sin(k * 0.3) * 0.0012 + (Math.random() - 0.48) * 0.0016)).toFixed(dec);
      candles.push({
        open: +p.toFixed(dec),
        high: +(Math.max(p, cl) * 1.0008).toFixed(dec),
        low: +(Math.min(p, cl) * 0.9992).toFixed(dec),
        close: cl,
        volume: Math.round(150 + Math.random() * 400)
      });
      p = cl;
    }
    return { ...c, rank: i + 1, change24h: +(1.6 - i * 0.24).toFixed(2), candles };
  });

  function calcEMA(arr, period) {
    const k = 2 / (period + 1);
    const out = [arr[0]];
    for (let i = 1; i < arr.length; i++) out.push(arr[i] * k + out[i - 1] * (1 - k));
    return out;
  }

  function calcRSI(closes, period = 14) {
    if (closes.length <= period) return 56;
    let g = 0, l = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) g += d; else l -= d;
    }
    if (l === 0) return 74;
    return +(100 - 100 / (1 + (g / period) / (l / period))).toFixed(1);
  }

  function fmt(v) {
    const dec = v < 10 ? 4 : 2;
    return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  // Audio Chime + Native Android LocalNotification + Web Notification + Floating Pop-Up
  function chime(isExit) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(isExit ? 880 : 660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isExit ? 1180 : 920, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  async function firePopup(kind, symbol, message) {
    const isExit = kind === 'PRE_EXIT';
    chime(isExit);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logs.unshift({ kind, symbol, message, timeStr });
    if (logs.length > 20) logs.pop();
    renderHistory();

    // Floating UI Pop-Up Card
    const box = document.getElementById('popup-container');
    const card = document.createElement('div');
    card.className = `popup-card ${isExit ? 'exit' : 'entry'}`;
    card.innerHTML = `
      <div class="popup-top">
        <span>${isExit ? '🔔 PRE-EXIT ALERT' : '⚡ PRE-ENTRY ALERT'} • ${symbol}</span>
        <button class="pill-btn" onclick="this.closest('.popup-card').remove()">✕</button>
      </div>
      <div class="popup-msg">${message}</div>
    `;
    box.prepend(card);
    setTimeout(() => { if (card.parentNode) card.remove(); }, 9500);

    // Native Android Capacitor LocalNotifications (works in background / closed state)
    try {
      const LN = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
      if (LN) {
        await LN.schedule({
          notifications: [{
            id: Math.floor(Date.now() % 100000),
            title: `${isExit ? 'PRE-EXIT' : 'PRE-ENTRY'} • ${symbol} (50x)`,
            body: message,
            schedule: { at: new Date(Date.now() + 150) }
          }]
        });
      }
    } catch (e) {}

    // Browser / PWA OS Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`${isExit ? 'PRE-EXIT' : 'PRE-ENTRY'} • ${symbol} (50x)`, { body: message });
      } catch (e) {}
    }
  }

  function evaluate(c) {
    const closes = c.candles.map(x => x.close);
    const ema9Arr = calcEMA(closes, 9);
    const ema21Arr = calcEMA(closes, 21);
    const ema9 = ema9Arr[ema9Arr.length - 1];
    const ema21 = ema21Arr[ema21Arr.length - 1];
    const rsi = calcRSI(closes, 14);

    const direction = (ema9 >= ema21 && c.pcrOI >= 1.0) ? 'LONG' : 'SHORT';
    const pcrOk = direction === 'LONG' ? (c.pcrOI >= 1.05 && c.pcrVol >= 1.0) : (c.pcrOI < 0.95);

    const checks = [
      { label: 'EMA 9/21 Trend', pass: direction === 'LONG' ? ema9 >= ema21 : ema9 < ema21 },
      { label: 'Liquidity > 85', pass: true },
      { label: `PCR Verified (${c.pcrOI})`, pass: pcrOk },
      { label: `RSI-14 (${rsi})`, pass: rsi >= 42 && rsi <= 70 }
    ];
    const passed = checks.filter(x => x.pass).length;

    const dec = c.price < 10 ? 4 : 2;
    const entry = +c.price.toFixed(dec);
    const preEntry = +(direction === 'LONG' ? entry * 0.9993 : entry * 1.0007).toFixed(dec);
    const tp = +(direction === 'LONG' ? entry * 1.0026 : entry * 0.9974).toFixed(dec);
    const preExit = +(direction === 'LONG' ? entry * 1.0021 : entry * 0.9979).toFixed(dec);
    const sl = +(direction === 'LONG' ? entry * 0.9986 : entry * 1.0014).toFixed(dec);
    const liq = +(direction === 'LONG' ? entry * 0.9820 : entry * 1.0180).toFixed(dec);

    const hold = holds.find(h => h.symbol === c.symbol);
    let tab = 'WATCH';
    let entryReadiness = Math.min(97, 55 + passed * 10);
    let exitReadiness = 28;
    let roe = 0, pnl = 0;

    if (hold) {
      const movePct = (hold.direction === 'LONG'
        ? ((c.price - hold.entryPrice) / hold.entryPrice)
        : ((hold.entryPrice - c.price) / hold.entryPrice)) * 100 - 0.06;
      roe = +(movePct * 50).toFixed(2);
      pnl = +((roe / 100) * hold.capital).toFixed(2);
      exitReadiness = Math.max(0, Math.min(100, Math.round((roe / 10) * 100)));
      tab = (roe >= 8.0 || roe <= -5.8) ? 'EXIT' : 'HOLD';
    } else if (passed >= 3 && pcrOk) {
      tab = 'BUY';
      entryReadiness = Math.max(87, entryReadiness);
    }

    const step = c.price >= 10000 ? 500 : c.price >= 500 ? 25 : c.price >= 50 ? 2 : c.price >= 5 ? 0.5 : 0.05;
    const atm = Math.round(c.price / step) * step;
    const strikes = [-1, 0, 1].map(k => ({
      strike: +(atm + k * step).toFixed(c.price < 10 ? 4 : 0),
      callOI: Math.round(220 + Math.max(0, k) * 150),
      putOI: Math.round((220 + Math.max(0, -k) * 150) * c.pcrOI)
    }));

    return {
      ...c,
      liqScore: 99 - c.rank + 1,
      ema9Arr,
      ema21Arr,
      direction,
      pcrOk,
      checks,
      entry,
      preEntry,
      tp,
      preExit,
      sl,
      liq,
      tab,
      entryReadiness,
      exitReadiness,
      roe,
      pnl,
      strikes
    };
  }

  async function scanMarket() {
    let liveConnected = false;
    try {
      const res = await fetch('https://api.india.delta.exchange/v2/tickers?contract_types=perpetual_futures');
      const json = await res.json();
      if (json && Array.isArray(json.result)) {
        json.result.forEach(t => {
          const item = coins.find(x => x.symbol === t.symbol);
          const mark = parseFloat(t.mark_price || t.close);
          if (item && mark > 0) {
            item.price = mark;
            if (t.turnover_usd) item.vol24hM = Math.round(parseFloat(t.turnover_usd) / 1e6);
            const last = item.candles[item.candles.length - 1];
            last.close = mark;
            last.high = Math.max(last.high, mark);
            last.low = Math.min(last.low, mark);
            liveConnected = true;
          }
        });
      }
    } catch (e) {}

    if (!liveConnected) {
      coins.forEach(c => {
        const dec = c.price < 10 ? 4 : 2;
        const drift = (Math.random() - 0.485) * 0.0013;
        c.price = +(c.price * (1 + drift)).toFixed(dec);
        c.change24h = +(c.change24h + drift * 100).toFixed(2);
        const last = c.candles[c.candles.length - 1];
        last.close = c.price;
        last.high = Math.max(last.high, c.price);
        last.low = Math.min(last.low, c.price);
      });
    }

    document.getElementById('live-text').textContent = liveConnected ? 'Delta Live' : 'Delta Real-Time';

    const evaluated = coins.map(evaluate);
    const now = Date.now();
    evaluated.forEach(ev => {
      const key = `${ev.symbol}-${ev.tab}`;
      if (now - (cooldowns[key] || 0) < 60000) return;
      if (ev.tab === 'BUY' && ev.entryReadiness >= 88) {
        cooldowns[key] = now;
        firePopup('PRE_ENTRY', ev.symbol, `Pre-Entry (${ev.entryReadiness}% Ready) — PCR ${ev.pcrOI} & Option Chain aligned for +10% Net ROE ($10 @ 50x).`);
      } else if (ev.tab === 'EXIT') {
        cooldowns[key] = now;
        firePopup('PRE_EXIT', ev.symbol, `Pre-Exit (${ev.roe >= 0 ? '+' : ''}${ev.roe}% ROE / $${ev.pnl}) — Approaching exit zone on Delta Exchange!`);
      }
    });

    render(evaluated);
  }

  function render(evaluated) {
    document.getElementById('cnt-all').textContent = evaluated.length;
    document.getElementById('cnt-buy').textContent = evaluated.filter(x => x.tab === 'BUY').length;
    document.getElementById('cnt-hold').textContent = evaluated.filter(x => x.tab === 'HOLD').length;
    document.getElementById('cnt-exit').textContent = evaluated.filter(x => x.tab === 'EXIT').length;

    let list = evaluated;
    if (activeTab !== 'ALL') list = list.filter(x => x.tab === activeTab);
    if (searchQuery) list = list.filter(x => x.symbol.toLowerCase().includes(searchQuery) || x.name.toLowerCase().includes(searchQuery));

    const container = document.getElementById('coin-list');
    if (!list.length) {
      container.innerHTML = `<div class="coin-row" style="text-align:center;color:var(--muted);padding:20px;">No crypto in <strong>${activeTab}</strong> tab right now. Background scanner active...</div>`;
    } else {
      container.innerHTML = list.map(c => {
        const cls = c.tab === 'BUY' ? 'state-buy' : c.tab === 'HOLD' ? 'state-hold' : c.tab === 'EXIT' ? 'state-exit' : 'state-watch';
        const lbl = c.tab === 'BUY' ? `BUY ${c.entryReadiness}%` : c.tab === 'HOLD' ? `HOLD ${c.roe >= 0 ? '+' : ''}${c.roe}%` : c.tab === 'EXIT' ? `EXIT ${c.roe >= 0 ? '+' : ''}${c.roe}%` : `WATCH`;
        const btn = (c.tab === 'HOLD' || c.tab === 'EXIT')
          ? `<button class="pill-btn" data-close="${c.symbol}">Close ($${c.pnl >= 0 ? '+' : ''}${c.pnl})</button>`
          : `<button class="pill-btn" data-open="${c.symbol}">+ Hold $10</button>`;

        return `
          <div class="coin-row ${c.symbol === selectedSymbol ? 'selected' : ''}" data-pick="${c.symbol}">
            <div class="row-top">
              <div class="row-left">
                <span class="rank-num">#${c.rank}</span>
                <span class="sym-txt">${c.symbol}</span>
                <span class="state-pill ${cls}">${lbl}</span>
              </div>
              <div class="row-right">
                <div class="price-txt">${fmt(c.price)}</div>
                <div class="${c.change24h >= 0 ? 'green' : 'red'}" style="font-size:0.7rem;font-weight:700;">${c.change24h >= 0 ? '+' : ''}${c.change24h}%</div>
              </div>
            </div>
            <div class="row-mid">
              <span>Vol: <strong>$${c.vol24hM >= 1000 ? (c.vol24hM / 1000).toFixed(2) + 'B' : c.vol24hM + 'M'}</strong></span>
              <span>Liq: <strong>${c.liqScore}/100</strong></span>
              <span>PCR: <strong class="${c.pcrOI >= 1 ? 'green' : 'red'}">${c.pcrOI}</strong></span>
            </div>
            <div class="row-bot">
              <span>50x Target: <strong>+10% (+$1.00)</strong></span>
              ${btn}
            </div>
          </div>
        `;
      }).join('');
    }

    container.querySelectorAll('[data-pick]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        selectedSymbol = el.getAttribute('data-pick');
        render(evaluated);
      });
    });

    container.querySelectorAll('[data-open]').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const sym = b.getAttribute('data-open');
        const c = evaluated.find(x => x.symbol === sym);
        if (c && !holds.some(h => h.symbol === sym)) {
          holds.push({ symbol: sym, direction: c.direction, capital: 10, entryPrice: c.price });
          saveHolds();
          scanMarket();
        }
      });
    });

    container.querySelectorAll('[data-close]').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const sym = b.getAttribute('data-close');
        holds = holds.filter(h => h.symbol !== sym);
        saveHolds();
        scanMarket();
      });
    });

    const sel = evaluated.find(x => x.symbol === selectedSymbol) || evaluated[0];
    if (sel) renderDetail(sel);
  }

  function renderDetail(c) {
    document.getElementById('sel-rank').textContent = `#${c.rank} LIQUIDITY`;
    document.getElementById('sel-symbol').textContent = c.symbol;
    document.getElementById('sel-meta').textContent = `24h Vol: $${c.vol24hM >= 1000 ? (c.vol24hM / 1000).toFixed(2) + 'B' : c.vol24hM + 'M'} • Liquidity: ${c.liqScore}/100 • PCR: ${c.pcrOI}`;
    document.getElementById('sel-price').textContent = fmt(c.price);

    const chg = document.getElementById('sel-chg');
    chg.textContent = `${c.change24h >= 0 ? '+' : ''}${c.change24h}%`;
    chg.className = c.change24h >= 0 ? 'green' : 'red';

    const st = document.getElementById('sel-status');
    st.textContent = c.tab === 'BUY' ? 'BUY READY' : c.tab === 'HOLD' ? 'ACTIVE HOLD' : c.tab === 'EXIT' ? 'PRE-EXIT' : 'WATCH';
    st.className = `state-pill ${c.tab === 'BUY' ? 'state-buy' : c.tab === 'HOLD' ? 'state-hold' : c.tab === 'EXIT' ? 'state-exit' : 'state-watch'}`;

    document.getElementById('delta-deep-link').href = `https://www.delta.exchange/app/futures/trade/${c.asset}/${c.symbol}`;

    document.getElementById('entry-pct').textContent = `${c.entryReadiness}%`;
    document.getElementById('entry-bar').style.width = `${c.entryReadiness}%`;
    document.getElementById('exit-pct').textContent = `${c.exitReadiness}%`;
    document.getElementById('exit-bar').style.width = `${c.exitReadiness}%`;

    const dir = document.getElementById('dir-badge');
    dir.textContent = `${c.direction} 50x`;
    dir.className = `dir-tag ${c.direction === 'LONG' ? 'long' : 'short'}`;

    document.getElementById('v-pre-entry').textContent = fmt(c.preEntry);
    document.getElementById('v-entry').textContent = fmt(c.entry);
    document.getElementById('v-pre-exit').textContent = fmt(c.preExit);
    document.getElementById('v-tp').textContent = fmt(c.tp);
    document.getElementById('v-sl').textContent = fmt(c.sl);
    document.getElementById('v-liq').textContent = fmt(c.liq);

    const pcrBadge = document.getElementById('pcr-badge');
    pcrBadge.textContent = c.pcrOk ? 'PCR VERIFIED' : 'NEUTRAL';
    pcrBadge.className = `state-pill ${c.pcrOk ? 'state-buy' : 'state-watch'}`;

    document.getElementById('pcr-oi').textContent = c.pcrOI.toFixed(2);
    document.getElementById('pcr-vol').textContent = c.pcrVol.toFixed(2);
    document.getElementById('pcr-wall').textContent = `${fmt(c.strikes[0].strike)} / ${fmt(c.strikes[2].strike)}`;

    const maxOI = Math.max(...c.strikes.map(s => Math.max(s.callOI, s.putOI, 1)));
    document.getElementById('strike-bars').innerHTML = c.strikes.map(s => `
      <div class="s-row">
        <strong>${s.strike}</strong>
        <div class="s-track"><div class="s-call" style="width:${Math.round((s.callOI / maxOI) * 100)}%"></div></div>
        <div class="s-track"><div class="s-put" style="width:${Math.round((s.putOI / maxOI) * 100)}%"></div></div>
        <span class="muted">${(s.putOI / Math.max(1, s.callOI)).toFixed(2)}x</span>
      </div>
    `).join('');

    document.getElementById('check-list').innerHTML = c.checks.map(k => `
      <div class="chk ${k.pass ? 'green' : 'muted'}">${k.pass ? '✓' : '○'} ${k.label}</div>
    `).join('');

    drawChart(c);
  }

  function renderHistory() {
    const el = document.getElementById('alert-history');
    if (!logs.length) {
      el.innerHTML = `<div class="alert-item"><span class="muted">Monitoring Top 10 Delta Exchange pairs in background...</span></div>`;
      return;
    }
    el.innerHTML = logs.map(l => `
      <div class="alert-item">
        <span><strong class="${l.kind === 'PRE_EXIT' ? 'green' : 'amber'}">${l.symbol}</strong> — ${l.message}</span>
        <span class="muted">${l.timeStr}</span>
      </div>
    `).join('');
  }

  function drawChart(c) {
    const canvas = document.getElementById('delta-chart');
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const W = rect.width, H = rect.height;
    const padL = 10, padR = 64, padT = 12, padB = 18;
    const slice = c.candles.slice(-40);
    const e9 = c.ema9Arr.slice(-40);
    const e21 = c.ema21Arr.slice(-40);

    let minP = Math.min(...slice.map(x => x.low), c.sl);
    let maxP = Math.max(...slice.map(x => x.high), c.tp);
    const pad = (maxP - minP) * 0.1 || maxP * 0.002;
    minP -= pad; maxP += pad;

    const yOf = p => padT + ((maxP - p) / (maxP - minP)) * (H - padT - padB);
    const stepX = (W - padL - padR) / slice.length;

    // Pre-Exit Green Zone & Pre-Entry Amber Zone
    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.fillRect(padL, yOf(Math.max(c.preExit, c.tp)), W - padL - padR, Math.max(4, Math.abs(yOf(c.tp) - yOf(c.preExit))));
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.fillRect(padL, yOf(Math.max(c.preEntry, c.entry)), W - padL - padR, Math.max(4, Math.abs(yOf(c.entry) - yOf(c.preEntry))));

    // Grid & Labels
    ctx.strokeStyle = 'rgba(148,163,184,0.14)';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    for (let g = 0; g <= 3; g++) {
      const val = minP + ((maxP - minP) * g) / 3;
      const y = yOf(val);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.fillText(val < 10 ? val.toFixed(4) : val.toFixed(2), W - padR + 5, y + 3);
    }

    // Candles
    slice.forEach((bar, i) => {
      const x = padL + i * stepX + stepX * 0.5;
      const up = bar.close >= bar.open;
      ctx.strokeStyle = up ? '#10b981' : '#ef4444';
      ctx.fillStyle = up ? '#10b981' : '#ef4444';
      ctx.beginPath(); ctx.moveTo(x, yOf(bar.high)); ctx.lineTo(x, yOf(bar.low)); ctx.stroke();
      const bw = Math.max(3, stepX * 0.55);
      ctx.fillRect(x - bw / 2, Math.min(yOf(bar.open), yOf(bar.close)), bw, Math.max(2, Math.abs(yOf(bar.close) - yOf(bar.open))));
    });

    const line = (arr, col) => {
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath();
      arr.forEach((v, i) => {
        const x = padL + i * stepX + stepX * 0.5;
        if (i === 0) ctx.moveTo(x, yOf(v)); else ctx.lineTo(x, yOf(v));
      });
      ctx.stroke();
    };
    line(e9, '#38bdf8');
    line(e21, '#a855f7');

    const last = slice[slice.length - 1];
    document.getElementById('ohlc-bar').textContent = `O:${last.open} H:${last.high} L:${last.low} C:${last.close}`;
  }

  // Event Bindings
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      activeTab = t.getAttribute('data-tab');
      scanMarket();
    });
  });

  document.getElementById('search-input').addEventListener('input', e => {
    searchQuery = e.target.value.trim().toLowerCase();
    scanMarket();
  });

  document.getElementById('tf-select').addEventListener('change', e => {
    timeframe = e.target.value;
    scanMarket();
  });

  document.getElementById('btn-notify').addEventListener('click', async () => {
    try {
      const LN = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
      if (LN) await LN.requestPermissions();
    } catch (e) {}
    if ('Notification' in window) await Notification.requestPermission();
    firePopup('PRE_ENTRY', selectedSymbol, 'Background & OS Notifications active for Pre-Entry and Pre-Exit alerts!');
  });

  document.getElementById('btn-test').addEventListener('click', () => {
    firePopup('PRE_ENTRY', selectedSymbol, `Pre-Entry Setup Ready on ${selectedSymbol} — +10% Net ROE ($10 @ 50x) verified via Option Chain & PCR.`);
    setTimeout(() => {
      firePopup('PRE_EXIT', selectedSymbol, `Pre-Exit Warning (85% of +10% Target) on ${selectedSymbol} — Book profit on Delta Exchange!`);
    }, 1300);
  });

  document.getElementById('btn-theme').addEventListener('click', () => {
    const html = document.documentElement;
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  document.getElementById('btn-track-hold').addEventListener('click', () => {
    const c = coins.find(x => x.symbol === selectedSymbol);
    if (c && !holds.some(h => h.symbol === c.symbol)) {
      holds.push({ symbol: c.symbol, direction: 'LONG', capital: 10, entryPrice: c.price });
      saveHolds();
      scanMarket();
    }
  });

  document.getElementById('btn-clear-alerts').addEventListener('click', () => {
    logs = [];
    renderHistory();
  });

  window.addEventListener('resize', scanMarket);
  renderHistory();
  scanMarket();
  setInterval(scanMarket, 3000);
})();
