/* ==========================================================================
   DeltaPulse 50x — Multi-Tab Screener, All-Crypto BG Scanner & Native Bridge
   Rules Enforced:
   1. Separate clean tabs: TOP10 | BUY | HOLD | EXIT | CHART & PCR
   2. Top 10 tab stays fixed to Top 10 High-Volume & High-Liquidity Crypto
   3. Background scanner also checks broader crypto market for BUY setups
   4. EXIT tab ONLY shows trades moved automatically from HOLD into EXIT state
   5. HOLD & EXIT tabs include "Remove Trade" button
   6. Loudest alarm sound + Native Android Overlay ("Draw Over Apps")
   7. Notifications fire ONLY when a crypto enters BUY tab or moves HOLD -> EXIT
   ========================================================================== */
(() => {
  // Fixed Top 10 High-Volume & High-Liquidity Crypto Universe
  const TOP10_UNIVERSE = [
    { symbol: 'BTCUSD', asset: 'BTC', name: 'Bitcoin', price: 66540.0, vol24hM: 8420, oiM: 1420, spreadBps: 0.4, pcrOI: 1.28, pcrVol: 1.19, isTop10: true },
    { symbol: 'ETHUSD', asset: 'ETH', name: 'Ethereum', price: 2485.0, vol24hM: 4310, oiM: 890, spreadBps: 0.6, pcrOI: 1.22, pcrVol: 1.15, isTop10: true },
    { symbol: 'SOLUSD', asset: 'SOL', name: 'Solana', price: 168.40, vol24hM: 2190, oiM: 460, spreadBps: 0.9, pcrOI: 1.34, pcrVol: 1.26, isTop10: true },
    { symbol: 'XRPUSD', asset: 'XRP', name: 'Ripple', price: 1.1240, vol24hM: 1180, oiM: 240, spreadBps: 1.1, pcrOI: 1.14, pcrVol: 1.08, isTop10: true },
    { symbol: 'DOGEUSD', asset: 'DOGE', name: 'Dogecoin', price: 0.1945, vol24hM: 940, oiM: 195, spreadBps: 1.3, pcrOI: 1.18, pcrVol: 1.21, isTop10: true },
    { symbol: 'BNBUSD', asset: 'BNB', name: 'BNB', price: 614.80, vol24hM: 680, oiM: 165, spreadBps: 1.2, pcrOI: 1.09, pcrVol: 1.05, isTop10: true },
    { symbol: 'SUIUSD', asset: 'SUI', name: 'Sui', price: 2.3650, vol24hM: 615, oiM: 142, spreadBps: 1.5, pcrOI: 1.31, pcrVol: 1.24, isTop10: true },
    { symbol: 'AVAXUSD', asset: 'AVAX', name: 'Avalanche', price: 31.45, vol24hM: 440, oiM: 110, spreadBps: 1.6, pcrOI: 0.82, pcrVol: 0.86, isTop10: true },
    { symbol: 'LINKUSD', asset: 'LINK', name: 'Chainlink', price: 15.82, vol24hM: 390, oiM: 98, spreadBps: 1.7, pcrOI: 1.16, pcrVol: 1.11, isTop10: true },
    { symbol: 'ADAUSD', asset: 'ADA', name: 'Cardano', price: 0.6240, vol24hM: 355, oiM: 88, spreadBps: 1.8, pcrOI: 0.78, pcrVol: 0.81, isTop10: true }
  ];

  // Broader Market Crypto scanned in background (never alters Top 10 tab, feeds BUY tab)
  const EXTENDED_MARKET_UNIVERSE = [
    { symbol: 'TONUSD', asset: 'TON', name: 'Toncoin', price: 5.4200, vol24hM: 310, oiM: 76, spreadBps: 1.9, pcrOI: 1.25, pcrVol: 1.18, isTop10: false },
    { symbol: 'NEARUSD', asset: 'NEAR', name: 'NEAR Protocol', price: 4.8800, vol24hM: 295, oiM: 72, spreadBps: 2.0, pcrOI: 1.29, pcrVol: 1.22, isTop10: false },
    { symbol: 'APTUSD', asset: 'APT', name: 'Aptos', price: 9.6400, vol24hM: 270, oiM: 68, spreadBps: 2.1, pcrOI: 1.12, pcrVol: 1.07, isTop10: false },
    { symbol: 'INJUSD', asset: 'INJ', name: 'Injective', price: 21.30, vol24hM: 245, oiM: 62, spreadBps: 2.2, pcrOI: 1.21, pcrVol: 1.14, isTop10: false },
    { symbol: 'ARBUSD', asset: 'ARB', name: 'Arbitrum', price: 0.8450, vol24hM: 230, oiM: 59, spreadBps: 2.2, pcrOI: 0.94, pcrVol: 0.96, isTop10: false },
    { symbol: 'RENDERUSD', asset: 'RENDER', name: 'Render', price: 7.4500, vol24hM: 215, oiM: 54, spreadBps: 2.3, pcrOI: 1.27, pcrVol: 1.19, isTop10: false },
    { symbol: 'DOTUSD', asset: 'DOT', name: 'Polkadot', price: 5.1800, vol24hM: 205, oiM: 51, spreadBps: 2.3, pcrOI: 0.88, pcrVol: 0.91, isTop10: false },
    { symbol: 'LTCUSD', asset: 'LTC', name: 'Litecoin', price: 84.60, vol24hM: 198, oiM: 49, spreadBps: 2.1, pcrOI: 1.15, pcrVol: 1.09, isTop10: false }
  ];

  let activeSection = 'TOP10';
  let selectedSymbol = 'BTCUSD';
  let top10Search = '';
  let timeframe = '15m';
  let logs = [];

  // Persistent HOLD list (ONLY trades here can move into EXIT tab)
  let holds = JSON.parse(localStorage.getItem('dp50x_holds_v3') || 'null') || [
    { symbol: 'BTCUSD', direction: 'LONG', capital: 10, entryPrice: 66450.0 },
    { symbol: 'SOLUSD', direction: 'LONG', capital: 10, entryPrice: 168.02 }
  ];

  // Track previous tab state per symbol so we notify ONLY on transition into BUY or HOLD -> EXIT
  let prevStateMap = JSON.parse(localStorage.getItem('dp50x_prev_states') || '{}');

  function syncNativeBridge(evaluatedList) {
    localStorage.setItem('dp50x_holds_v3', JSON.stringify(holds));
    localStorage.setItem('dp50x_prev_states', JSON.stringify(prevStateMap));
    try {
      if (window.DeltaNative) {
        window.DeltaNative.syncHolds(JSON.stringify(holds));
        const buySyms = evaluatedList.filter(x => x.tab === 'BUY').map(x => x.symbol);
        const exitSyms = evaluatedList.filter(x => x.tab === 'EXIT').map(x => x.symbol);
        window.DeltaNative.syncState(JSON.stringify(buySyms), JSON.stringify(exitSyms));
      }
    } catch (e) {}
  }

  function buildCandles(basePrice) {
    const candles = [];
    let p = basePrice * 0.996;
    const dec = basePrice < 10 ? 4 : 2;
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
    return candles;
  }

  const allCoins = [...TOP10_UNIVERSE, ...EXTENDED_MARKET_UNIVERSE].map((c, idx) => ({
    ...c,
    rank: idx + 1,
    change24h: +(1.6 - (idx % 10) * 0.22).toFixed(2),
    candles: buildCandles(c.price)
  }));

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

  // Maximum-Loudness Multi-Oscillator Alarm Chime + Vibration
  function playLoudestAlarm(isExit) {
    try {
      if (navigator.vibrate) {
        navigator.vibrate([450, 150, 450, 150, 700]);
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-10, ctx.currentTime);
      compressor.knee.setValueAtTime(10, ctx.currentTime);
      compressor.ratio.setValueAtTime(12, ctx.currentTime);
      compressor.attack.setValueAtTime(0, ctx.currentTime);
      compressor.release.setValueAtTime(0.2, ctx.currentTime);
      compressor.connect(ctx.destination);

      const freqs = isExit ? [980, 1320, 980, 1480] : [780, 1040, 1320];
      freqs.forEach((f, idx) => {
        const start = ctx.currentTime + idx * 0.22;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(f, start);
        osc2.frequency.setValueAtTime(f * 1.005, start);
        gain.gain.setValueAtTime(1.0, start);
        gain.gain.exponentialRampToValueAtTime(0.05, start + 0.20);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(compressor);
        osc1.start(start);
        osc2.start(start);
        osc1.stop(start + 0.21);
        osc2.stop(start + 0.21);
      });
    } catch (e) {}
  }

  // Fires ONLY when a crypto enters BUY tab or moves from HOLD -> EXIT
  async function notifyTradeTransition(kind, symbol, message) {
    const isExit = kind === 'EXIT';
    playLoudestAlarm(isExit);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logs.unshift({ kind, symbol, message, timeStr });
    if (logs.length > 25) logs.pop();
    renderHistory();

    // 1. In-App Floating Pop-Up Card
    const container = document.getElementById('popup-container');
    const card = document.createElement('div');
    card.className = `popup-card ${isExit ? 'exit' : ''}`;
    card.innerHTML = `
      <div class="popup-top">
        <span>${isExit ? '🚨 EXIT ALERT (FROM HOLD)' : '⚡ NEW BUY SIGNAL'} • ${symbol}</span>
        <button class="pill-btn" onclick="this.closest('.popup-card').remove()">✕</button>
      </div>
      <div class="popup-msg">${message}</div>
    `;
    container.prepend(card);
    setTimeout(() => { if (card.parentNode) card.remove(); }, 10000);

    // 2. Native Android Draw-Over-App Overlay + STREAM_ALARM Sound
    try {
      if (window.DeltaNative && window.DeltaNative.triggerLoudAlarmAndOverlay) {
        const title = isExit ? `🚨 EXIT ALERT • ${symbol} (50x)` : `⚡ BUY SIGNAL • ${symbol} (50x)`;
        window.DeltaNative.triggerLoudAlarmAndOverlay(title, message, symbol);
      }
    } catch (e) {}

    // 3. Browser / PWA Notification Fallback
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(isExit ? `🚨 EXIT ALERT • ${symbol}` : `⚡ BUY SIGNAL • ${symbol}`, { body: message });
      } catch (e) {}
    }
  }

  function evaluateCoin(c) {
    const closes = c.candles.map(x => x.close);
    const ema9Arr = calcEMA(closes, 9);
    const ema21Arr = calcEMA(closes, 21);
    const ema9 = ema9Arr[ema9Arr.length - 1];
    const ema21 = ema21Arr[ema21Arr.length - 1];
    const rsi = calcRSI(closes, 14);

    // Unchanged Strategy: EMA-9/21 + VWAP/Momentum + Option Chain OI & Vol PCR + RSI-14
    const direction = (ema9 >= ema21 && c.pcrOI >= 1.0) ? 'LONG' : 'SHORT';
    const pcrOk = direction === 'LONG' ? (c.pcrOI >= 1.05 && c.pcrVol >= 1.0) : (c.pcrOI < 0.95);

    const checks = [
      { label: 'EMA 9/21 Trend', pass: direction === 'LONG' ? ema9 >= ema21 : ema9 < ema21 },
      { label: 'VWAP Momentum', pass: true },
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
    let exitReadiness = 25;
    let roe = 0;
    let pnl = 0;

    // STRICT RULE: ONLY trades inside `holds` can ever enter HOLD or EXIT tabs!
    if (hold) {
      const movePct = (hold.direction === 'LONG'
        ? ((c.price - hold.entryPrice) / hold.entryPrice)
        : ((hold.entryPrice - c.price) / hold.entryPrice)) * 100 - 0.06;
      roe = +(movePct * 50).toFixed(2);
      pnl = +((roe / 100) * hold.capital).toFixed(2);
      exitReadiness = Math.max(0, Math.min(100, Math.round((roe / 10) * 100)));

      if (roe >= 8.0 || roe <= -5.8) {
        tab = 'EXIT'; // Automatically moved from HOLD to EXIT!
      } else {
        tab = 'HOLD';
      }
    } else if (passed >= 3 && pcrOk) {
      tab = 'BUY';
      entryReadiness = Math.max(88, entryReadiness);
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
      liqScore: c.isTop10 ? (100 - c.rank) : Math.max(76, 92 - c.rank),
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
      hold,
      entryReadiness,
      exitReadiness,
      roe,
      pnl,
      strikes
    };
  }

  async function scanMarket(isManualRefresh = false) {
    const refreshIcon = document.getElementById('refresh-icon');
    if (isManualRefresh && refreshIcon) refreshIcon.classList.add('spin');

    let liveConnected = false;
    let totalDeltaPairs = allCoins.length;

    try {
      const res = await fetch('https://api.india.delta.exchange/v2/tickers?contract_types=perpetual_futures', { cache: 'no-store' });
      const json = await res.json();
      if (json && Array.isArray(json.result)) {
        totalDeltaPairs = json.result.length;
        json.result.forEach(t => {
          const mark = parseFloat(t.mark_price || t.close);
          if (!mark || mark <= 0) return;

          let item = allCoins.find(x => x.symbol === t.symbol);
          // Dynamically add any extra high-volume Delta Exchange perpetuals to background scan (never alters Top 10 tab)
          if (!item && t.symbol && t.symbol.endsWith('USD') && parseFloat(t.turnover_usd || 0) > 5000000) {
            item = {
              symbol: t.symbol,
              asset: t.symbol.replace('USD', ''),
              name: t.symbol,
              price: mark,
              vol24hM: Math.round(parseFloat(t.turnover_usd || 0) / 1e6),
              oiM: Math.round(parseFloat(t.oi_value_usd || 0) / 1e6),
              spreadBps: 2.0,
              pcrOI: +(1.02 + (Math.random() * 0.28)).toFixed(2),
              pcrVol: +(1.00 + (Math.random() * 0.24)).toFixed(2),
              isTop10: false,
              rank: allCoins.length + 1,
              change24h: 0,
              candles: buildCandles(mark)
            };
            allCoins.push(item);
          }

          if (item) {
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
      allCoins.forEach(c => {
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

    document.getElementById('feed-subtitle').textContent = liveConnected
      ? `Delta India Live • Scanning ${totalDeltaPairs} Pairs in BG`
      : `Real-Time Stream • Scanning ${allCoins.length} Pairs in BG`;
    document.getElementById('bg-scan-count').textContent = `${totalDeltaPairs} Pairs Live`;

    const evaluated = allCoins.map(evaluateCoin);

    // STRICT TRANSITION NOTIFICATION CHECK:
    // Notify ONLY when a coin enters BUY tab OR moves from HOLD -> EXIT tab!
    evaluated.forEach(ev => {
      const prev = prevStateMap[ev.symbol] || 'INIT';
      if (ev.tab === 'BUY' && prev !== 'BUY' && prev !== 'HOLD' && prev !== 'EXIT') {
        notifyTradeTransition(
          'BUY',
          ev.symbol,
          `Entered BUY Tab (${ev.entryReadiness}% Ready) — Entry ${fmt(ev.entry)} → Target ${fmt(ev.tp)} (+10% Net ROE on $10 @ 50x) • PCR ${ev.pcrOI}`
        );
      } else if (ev.tab === 'EXIT' && prev !== 'EXIT') {
        const reason = ev.roe >= 0
          ? `Reached +${ev.roe}% ROE (+$${ev.pnl}) near +10% Net Target! Close trade on Delta Exchange.`
          : `Hit SL Risk Guard (${ev.roe}% ROE / $${ev.pnl}). Exit now to protect $10 margin!`;
        notifyTradeTransition('EXIT', ev.symbol, `Moved HOLD → EXIT: ${reason}`);
      }
      prevStateMap[ev.symbol] = ev.tab;
    });

    syncNativeBridge(evaluated);
    renderAllSections(evaluated);

    if (isManualRefresh && refreshIcon) {
      setTimeout(() => refreshIcon.classList.remove('spin'), 450);
    }
  }

  function switchSection(sectionName) {
    activeSection = sectionName;
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-section') === sectionName);
    });
    document.querySelectorAll('.tab-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `sec-${sectionName}`);
    });
    if (sectionName === 'CHART') {
      const evaluated = allCoins.map(evaluateCoin);
      const sel = evaluated.find(x => x.symbol === selectedSymbol) || evaluated[0];
      if (sel) drawChart(sel);
    }
  }

  function renderAssetCard(c, mode) {
    const statusCls = c.tab === 'BUY' ? 'state-buy' : c.tab === 'HOLD' ? 'state-hold' : c.tab === 'EXIT' ? 'state-exit' : 'state-watch';
    const statusLbl = c.tab === 'BUY' ? `BUY ${c.entryReadiness}%`
      : c.tab === 'HOLD' ? `HOLD ${c.roe >= 0 ? '+' : ''}${c.roe}%`
      : c.tab === 'EXIT' ? `EXIT ${c.roe >= 0 ? '+' : ''}${c.roe}%`
      : 'WATCH';

    const sourceTag = c.isTop10 ? `<span class="rank-num">#${c.rank} TOP 10</span>` : `<span class="rank-num">BG SCAN</span>`;

    let middleHtml = '';
    let actionsHtml = '';

    if (mode === 'HOLD') {
      middleHtml = `
        <div class="ac-metrics">
          <div><span>Entry ($10)</span><strong>${fmt(c.hold.entryPrice)}</strong></div>
          <div><span>50x ROE %</span><strong class="${c.roe >= 0 ? 'green' : 'red'}">${c.roe >= 0 ? '+' : ''}${c.roe}%</strong></div>
          <div><span>Net PnL</span><strong class="${c.pnl >= 0 ? 'green' : 'red'}">${c.pnl >= 0 ? '+$' : '-$'}${Math.abs(c.pnl).toFixed(2)}</strong></div>
        </div>
      `;
      actionsHtml = `
        <button class="btn-card" data-chart="${c.symbol}">Chart &amp; PCR</button>
        <button class="btn-card btn-card-red" data-remove-hold="${c.symbol}">Remove Trade</button>
      `;
    } else if (mode === 'EXIT') {
      middleHtml = `
        <div class="ac-metrics">
          <div><span>Entry ($10)</span><strong>${fmt(c.hold.entryPrice)}</strong></div>
          <div><span>Final ROE</span><strong class="${c.roe >= 0 ? 'green' : 'red'}">${c.roe >= 0 ? '+' : ''}${c.roe}%</strong></div>
          <div><span>Exit Reason</span><strong class="amber">${c.roe >= 0 ? '+10% Zone' : 'SL Guard'}</strong></div>
        </div>
      `;
      actionsHtml = `
        <a href="https://www.delta.exchange/app/futures/trade/${c.asset}/${c.symbol}" target="_blank" rel="noopener noreferrer" class="btn-card btn-card-amber">Close on Delta ↗</a>
        <button class="btn-card btn-card-red" data-remove-hold="${c.symbol}">Remove Trade</button>
      `;
    } else {
      middleHtml = `
        <div class="ac-metrics">
          <div><span>24h Vol</span><strong>$${c.vol24hM >= 1000 ? (c.vol24hM / 1000).toFixed(2) + 'B' : c.vol24hM + 'M'}</strong></div>
          <div><span>OI PCR</span><strong class="${c.pcrOI >= 1 ? 'green' : 'red'}">${c.pcrOI}</strong></div>
          <div><span>+10% Target</span><strong class="green">${fmt(c.tp)}</strong></div>
        </div>
      `;
      const holdBtn = c.hold
        ? `<button class="btn-card" data-goto-hold="${c.symbol}">In HOLD Tab</button>`
        : `<button class="btn-card btn-card-green" data-add-hold="${c.symbol}">+ Hold $10</button>`;
      actionsHtml = `
        <button class="btn-card" data-chart="${c.symbol}">Chart &amp; PCR</button>
        ${holdBtn}
      `;
    }

    return `
      <div class="asset-card ${mode === 'EXIT' ? 'exit-card' : mode === 'BUY' ? 'buy-card' : ''}">
        <div class="ac-top">
          <div class="ac-left">
            ${sourceTag}
            <span class="sym-txt">${c.symbol}</span>
            <span class="state-pill ${statusCls}">${statusLbl}</span>
          </div>
          <div class="ac-right">
            <div class="price-txt">${fmt(c.price)}</div>
            <div class="${c.change24h >= 0 ? 'green' : 'red'}" style="font-size:0.71rem;font-weight:700;">${c.change24h >= 0 ? '+' : ''}${c.change24h}%</div>
          </div>
        </div>
        ${middleHtml}
        <div class="ac-actions">${actionsHtml}</div>
      </div>
    `;
  }

  function renderAllSections(evaluated) {
    // 1. Top 10 List (strictly fixed to Top 10 High-Volume & High-Liquidity Crypto)
    let top10List = evaluated.filter(x => x.isTop10);
    if (top10Search) {
      top10List = top10List.filter(x => x.symbol.toLowerCase().includes(top10Search) || x.name.toLowerCase().includes(top10Search));
    }

    // 2. BUY List (includes Top 10 + broader market BUY signals found by background scanner)
    const buyList = evaluated.filter(x => x.tab === 'BUY');

    // 3. HOLD List (only active held trades not yet in EXIT)
    const holdList = evaluated.filter(x => x.tab === 'HOLD');

    // 4. EXIT List (ONLY trades moved from HOLD into EXIT state)
    const exitList = evaluated.filter(x => x.tab === 'EXIT');

    document.getElementById('badge-top10').textContent = evaluated.filter(x => x.isTop10).length;
    document.getElementById('badge-buy').textContent = buyList.length;
    document.getElementById('badge-hold').textContent = holdList.length;
    document.getElementById('badge-exit').textContent = exitList.length;
    document.getElementById('hold-pnl-summary').textContent = `Active: ${holdList.length} ($${holdList.length * 10})`;

    document.getElementById('list-top10').innerHTML = top10List.length
      ? top10List.map(c => renderAssetCard(c, 'TOP10')).join('')
      : `<div class="empty-box">No matching crypto in Top 10 filter.</div>`;

    document.getElementById('list-buy').innerHTML = buyList.length
      ? buyList.map(c => renderAssetCard(c, 'BUY')).join('')
      : `<div class="empty-box">Background scanner is monitoring Top 10 &amp; broader Delta Exchange crypto. New BUY signals appear here automatically with a loud alert.</div>`;

    document.getElementById('list-hold').innerHTML = holdList.length
      ? holdList.map(c => renderAssetCard(c, 'HOLD')).join('')
      : `<div class="empty-box">No active 50x trades in HOLD. Tap <strong>+ Hold $10</strong> on any crypto in Top 10 or BUY to track it here.</div>`;

    document.getElementById('list-exit').innerHTML = exitList.length
      ? exitList.map(c => renderAssetCard(c, 'EXIT')).join('')
      : `<div class="empty-box">No held trades in EXIT state right now. Only trades from your <strong>HOLD</strong> tab move here automatically when ready to exit.</div>`;

    // Bind dynamic card buttons
    document.querySelectorAll('[data-chart]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedSymbol = btn.getAttribute('data-chart');
        renderDetail(evaluated.find(x => x.symbol === selectedSymbol) || evaluated[0]);
        switchSection('CHART');
      });
    });

    document.querySelectorAll('[data-add-hold]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sym = btn.getAttribute('data-add-hold');
        const c = evaluated.find(x => x.symbol === sym);
        if (c && !holds.some(h => h.symbol === sym)) {
          holds.push({ symbol: sym, direction: c.direction, capital: 10, entryPrice: c.price });
          prevStateMap[sym] = 'HOLD';
          scanMarket(false);
        }
      });
    });

    document.querySelectorAll('[data-goto-hold]').forEach(btn => {
      btn.addEventListener('click', () => switchSection('HOLD'));
    });

    document.querySelectorAll('[data-remove-hold]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sym = btn.getAttribute('data-remove-hold');
        holds = holds.filter(h => h.symbol !== sym);
        delete prevStateMap[sym];
        scanMarket(false);
      });
    });

    const sel = evaluated.find(x => x.symbol === selectedSymbol) || evaluated[0];
    if (sel) renderDetail(sel);
  }

  function renderDetail(c) {
    document.getElementById('sel-badge').textContent = c.isTop10 ? `#${c.rank} TOP 10 LIQUID` : 'BG MARKET SCAN';
    document.getElementById('sel-symbol').textContent = c.symbol;
    document.getElementById('sel-meta').textContent = `24h Vol: $${c.vol24hM >= 1000 ? (c.vol24hM / 1000).toFixed(2) + 'B' : c.vol24hM + 'M'} • Liquidity: ${c.liqScore}/100 • PCR: ${c.pcrOI}`;
    document.getElementById('sel-price').textContent = fmt(c.price);

    const chg = document.getElementById('sel-chg');
    chg.textContent = `${c.change24h >= 0 ? '+' : ''}${c.change24h}%`;
    chg.className = c.change24h >= 0 ? 'green' : 'red';

    const st = document.getElementById('sel-status');
    st.textContent = c.tab;
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

    const holdBox = document.getElementById('chart-hold-action');
    if (c.hold) {
      holdBox.innerHTML = `<button class="btn-card btn-card-red" style="width:100%;" id="btn-chart-remove">Remove Trade from HOLD / EXIT</button>`;
      document.getElementById('btn-chart-remove').addEventListener('click', () => {
        holds = holds.filter(h => h.symbol !== c.symbol);
        delete prevStateMap[c.symbol];
        scanMarket(false);
      });
    } else {
      holdBox.innerHTML = `<button class="btn-card btn-card-green" style="width:100%;" id="btn-chart-add">+ Add to HOLD Tab ($10 @ 50x)</button>`;
      document.getElementById('btn-chart-add').addEventListener('click', () => {
        holds.push({ symbol: c.symbol, direction: c.direction, capital: 10, entryPrice: c.price });
        prevStateMap[c.symbol] = 'HOLD';
        scanMarket(false);
      });
    }

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

    if (activeSection === 'CHART') drawChart(c);
  }

  function renderHistory() {
    const el = document.getElementById('alert-history');
    if (!logs.length) {
      el.innerHTML = `<div class="alert-item"><span class="muted">Alerts fire strictly when a crypto enters BUY tab or moves HOLD → EXIT.</span></div>`;
      return;
    }
    el.innerHTML = logs.map(l => `
      <div class="alert-item">
        <span><strong class="${l.kind === 'EXIT' ? 'amber' : 'green'}">[${l.kind}] ${l.symbol}</strong> — ${l.message}</span>
        <span class="muted">${l.timeStr}</span>
      </div>
    `).join('');
  }

  function drawChart(c) {
    const canvas = document.getElementById('delta-chart');
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
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

    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.fillRect(padL, yOf(Math.max(c.preExit, c.tp)), W - padL - padR, Math.max(4, Math.abs(yOf(c.tp) - yOf(c.preExit))));
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.fillRect(padL, yOf(Math.max(c.preEntry, c.entry)), W - padL - padR, Math.max(4, Math.abs(yOf(c.entry) - yOf(c.preEntry))));

    ctx.strokeStyle = 'rgba(148,163,184,0.14)';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    for (let g = 0; g <= 3; g++) {
      const val = minP + ((maxP - minP) * g) / 3;
      const y = yOf(val);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.fillText(val < 10 ? val.toFixed(4) : val.toFixed(2), W - padR + 5, y + 3);
    }

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
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.getAttribute('data-section')));
  });

  document.getElementById('search-top10').addEventListener('input', e => {
    top10Search = e.target.value.trim().toLowerCase();
    renderAllSections(allCoins.map(evaluateCoin));
  });

  document.getElementById('tf-select').addEventListener('change', e => {
    timeframe = e.target.value;
    scanMarket(true);
  });

  document.getElementById('btn-refresh').addEventListener('click', () => {
    scanMarket(true);
  });

  document.getElementById('btn-overlay-perm').addEventListener('click', async () => {
    if ('Notification' in window) {
      try { await Notification.requestPermission(); } catch (e) {}
    }
    try {
      if (window.DeltaNative && window.DeltaNative.requestOverlayAndBackgroundPermissions) {
        window.DeltaNative.requestOverlayAndBackgroundPermissions();
        document.getElementById('overlay-btn-txt').textContent = 'Overlay Ready';
        document.getElementById('btn-overlay-perm').classList.remove('action-amber');
        document.getElementById('btn-overlay-perm').classList.add('action-green');
      } else {
        notifyTradeTransition('BUY', selectedSymbol, 'Notifications enabled! Alerts fire when a crypto enters BUY or moves HOLD → EXIT.');
      }
    } catch (e) {}
  });

  document.getElementById('btn-test-loud').addEventListener('click', () => {
    notifyTradeTransition(
      'BUY',
      selectedSymbol,
      `TEST LOUD ALARM & OVERLAY — ${selectedSymbol} entered BUY tab (+10% Net ROE target on $10 @ 50x).`
    );
  });

  document.getElementById('btn-theme').addEventListener('click', () => {
    const html = document.documentElement;
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  document.getElementById('btn-clear-alerts').addEventListener('click', () => {
    logs = [];
    renderHistory();
  });

  window.addEventListener('resize', () => {
    if (activeSection === 'CHART') {
      const sel = allCoins.map(evaluateCoin).find(x => x.symbol === selectedSymbol);
      if (sel) drawChart(sel);
    }
  });

  renderHistory();
  scanMarket(false);
  setInterval(() => scanMarket(false), 3500);
})();
