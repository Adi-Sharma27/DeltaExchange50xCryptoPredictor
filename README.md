# DeltaPulse 50x Pro v4 — Long-Term Hold Top 5 Screener & Native Android APK

## Refinements in v4
1. **Long-Term Hold Period Filter in BUY Tab**: Every trade shown in the **BUY Top 5** tab is verified for higher-timeframe trend durability (`EMA-21` vs `EMA-50`), institutional Open Interest backing, and multi-hour/multi-day hold horizon (`12h–48h` / `6h–24h`). Short-lived scalps are excluded from the `BUY` tab.
2. **Strictly Top 5 Trades in BUY Tab**: Qualifying Long-Term Hold setups from both the Top 10 universe and the broader background market scanner are ranked by strategy confidence & liquidity, displaying **only the Top 5** (`BUY Top 5`).
3. **Restored Original 4-Pillar Strategy**:
   - **EMA-9 vs EMA-21** trend alignment
   - **Real 24-Bar VWAP** (`vwap_lookback_bars: 24`) price hold
   - **Option Chain PCR Gates**: `OI PCR >= 1.05` & `Vol PCR >= 1.00` for `LONG` (`OI PCR <= 0.90` & `Vol PCR <= 0.92` for `SHORT`)
   - **RSI-14 Zone**: Strictly `44 <= RSI <= 68`
   - **50x `$10` Risk Profile**: `+10%` Net ROE (`+$1.00`) target with `0.06%` fee buffer (`0.26%` gross move) and `0.14%` stop-loss.
4. **All v3 Native Android Features Preserved**: 5 clean tabs (`Top 10`, `BUY Top 5`, `HOLD`, `EXIT`, `Chart & PCR`), closed-app 24/7 background service, Draw-Over-App floating pop-ups, loudest `STREAM_ALARM` sound, strict `HOLD → EXIT` movement, `Remove Trade` buttons, and top `↻ Refresh` button.
