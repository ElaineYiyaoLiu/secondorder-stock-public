This is SecondOrder Stock, a bilingual workspace for understanding a selected market period and comparing historical basket structure through Homology.

Current version: **v0.21**.

Seven models describe current conditions: daily candles, price path, labelled asset relationships, equal-weight basket risk, return distribution, multiscale state and price-volume order. Homology is the eighth model and the only historical analogue search. Models have separate evidence checks. There is no agreement vote or combined directional score.

这是 SecondOrder Stock，一个中英文行情工作台。七个模型分析选中区间的结构、路径与风险；第八个 Homology 在同一组卡片中比较历史资产组结构。各模型分别判断证据。

## Use

1. The workspace automatically loads three years of completed real daily bars for NVDA and the eight-asset comparison basket. If loading fails, it shows the error and keeps the chart and calculations hidden until real data, a CSV, or an explicitly chosen demo is loaded. Demo data remains available on request: 850 aligned synthetic bars ending on 2025-06-30, with invented prices and volume.
2. Keep the latest 30 sessions or select 10–120. Run all eight models with one button; individual cards can also run separately.
3. Use model 08, Homology, in the same grid to compare the same asset basket with earlier structures. Select 5, 20 or 60 sessions of later outcomes; each has its own mature reference cohort.
4. Open Advanced checks at the bottom of the same page to validate Homology through its past-only walk-forward comparison. Short histories and unstable matching abstain from scoring.

CSV columns: `symbol,date,open,high,low,close,volume`. Accepts 10–3000 completed bars per symbol and 1–12 symbols. Basket models require 3–12 assets covering every selected date. Dates need not occupy identical array offsets. Imported files stay in the browser. Use consistently adjusted OHLCV.

The Marketstack v2 endpoint `/api/history?symbol=NVDA&basket=1&years=3` supports 1, 3, 5 and 10 requested years. It reports actual start/end, bar count, adjustment and coverage, and aligns returned basket dates by intersection. Provider plan limits may shorten the available range. Pagination is bounded to 40,000 aggregate records and 48 seconds. Requests never expose `MARKETSTACK_API_KEY`, switch to synthetic data or commit partial provider results. Successful range-specific requests are coalesced and cached for six hours in memory and on the Vercel CDN for matching URLs. Errors remain uncached and the browser response uses no-store. This reduces repeat loading; cache entries are regional and can be evicted, so it is not a guaranteed monthly quota cap.

## Models and evidence

See [AVAILABILITY_V018.md](AVAILABILITY_V018.md), [ONBOARDING_V017.md](ONBOARDING_V017.md), [MODELS_V016.md](MODELS_V016.md) and the original task definitions in [MODELS_V015.md](MODELS_V015.md) for definitions, diagnostic thresholds and limits. Model documentation from v0.2–v0.14 and `research/*` reports describe earlier retrieval designs. They are retained as historical research, not evidence for the new current-analysis tasks.

Node 22 or later; no third-party runtime dependencies. Calculations run in a module Web Worker.

```bash
npm run dev
npm test
npm run build
```

`tests/model-audit.test.mjs`, `tests/current-analysis.test.mjs` and `tests/current-worker.test.mjs` cover the production model roles, known numerical examples, data coverage, separate horizon maturity, dispatch and future isolation. Existing numerical and retrieval tests explicitly use `public/legacy-engine.js`; the legacy engine, worker and evidence layer are excluded from the production build. Existing `validate:*` scripts reproduce historical research and continue to use that archived engine.

## Release

Development: `secondorder-stock-private / v0.21`; previous numbered branches are retained. Production: `secondorder-stock-public / main`, deployed on Vercel and embedded at https://secondorder.tools/stock. The stock product owns its version independently.

## Data requirements

All models use completed daily date, open, high, low, close and volume values. Use a consistent adjustment convention; adjusted OHLCV is preferred. Models 3, 4 and 8 need 3–12 assets with aligned dates and actual return variation; the default basket is NVDA, AAPL, MSFT, AMZN, META, SPY, QQQ and TSLA.

For the latest 30-session selection, the coverage prerequisite is at least 300 aligned bars through the selection end for three separated references at every horizon (5, 20 and 60 sessions). A 120-session selection needs 660. These are coverage thresholds, not guarantees of distinguishable or stable matches. Three years, about 750 bars per asset or 6,000 asset-day records for eight assets, is the default. Basic's advertised 10-year daily history and 10,000 monthly ticker requests cover this scale; actual account entitlement and remaining quota must be checked in Marketstack. Each symbol in every paginated request consumes quota.

Data options (history range, comparison assets, CSV and demo) are collapsed in the sidebar. Range and basket changes automatically reload real history. A retry button appears only after a loading error; a return-to-market button appears only while CSV or demo data is active.
