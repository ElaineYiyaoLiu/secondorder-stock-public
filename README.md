This is SecondOrder Stock, a bilingual workspace for finding historical market analogues and comparing what happened next.

Development version: **v0.4**

Explore a candlestick chart, select 10–120 sessions, and find past periods through eight representations. Results show agreement, rebased price overlays, and 5/20/60-session outcome summaries. Geometry exposes the representations, correlation matrix and persistence barcodes. Lab runs an exploratory walk-forward comparison against a past-only unconditional baseline.

这是 SecondOrder Stock，一个中英文工作台，用不同的几何表示寻找历史相似行情，并比较之后发生了什么。

在 K 线上选择 10–120 个交易日，查看历史相似区间、价格叠图和后续 5/20/60 日结果。几何页面显示表示方法、相关矩阵和持久性条形图；实验室提供滚动样本外比较。

## Data

The default data is **synthetic**, copied from the deterministic Project 02 fixtures. Prices and volume are invented and end on 2025-06-30. The CSV template also contains synthetic data. Results from this sample do not demonstrate a real-market advantage.

Import daily OHLCV as `symbol,date,open,high,low,close,volume`. Use consistently adjusted OHLC and volume, strictly increasing completed dates, and 180–3000 bars per symbol. Files stay in the browser. Basket methods require 3–12 assets with identical dates. Single-symbol or misaligned datasets disable basket methods; real and synthetic sources are never mixed.

An optional server-side Twelve Data adapter is available at `/api/history?symbol=NVDA`. Set `TWELVE_DATA_API_KEY` in Vercel environment settings. The key stays server-side. Provider failure preserves the current dataset. Provider-default adjustment needs checking before research; live data has not been validated with an account/key.

## Run

Node.js 22 or later. The web application has no third-party runtime dependencies.

```bash
npm run dev
npm test
npm run build
```

Open http://localhost:3000. Vercel serves `dist` and the independent `api/history.js` function. Calculations run in a module Web Worker.

## Source and release

Based on the inspected Private `v0.1` versions:

- Project 02, `ElaineYiyaoLiu/secondorder-markets-private`, commit `cfede5e4601b6156ec4ed0071252d0fc949e8410`: stock universe, deterministic fixtures, candle interpretation, chart interaction design and Twelve Data adapter.
- Project 04, `ElaineYiyaoLiu/secondorder-homology-private`, commit `50dbdd14c63b254d5663ac3deaec4bc3d34051e3`: correlation-distance and persistent-homology methodology, past-only validation rules. Its full original Python pipeline is retained in `research/homology.py`, with dependencies in `research/requirements.txt`.
- SecondOrder site `v0.1`, commit `f7abfae222db977fd12c360757e53e107b0f2762`: typography and blue/copper brand system.

Development version: `secondorder-stock-private / v0.4`. Historical `v0.1`, `v0.2` and `v0.3` branches are retained. Production remains on `v0.1`; this change has not been published. The inspected Stock project is connected to the Private repository and has no Public mirror.

The first geometry now compares candle shape, ordered price path, relative volume and volatility in a fixed weighted Euclidean embedding. The second geometry compares normalized close paths and daily changes with regularized DTW, endpoint returns and volatility anchors. The third geometry combines robust linear and tied-rank correlations with window-local identity shrinkage, explicit asset labels and undefined-correlation handling. The fourth geometry now compares robust labelled covariance states with adaptive spherical shrinkage, dimension-normalized affine-invariant distance and explicit flat-window exclusion. The fifth geometry now uses smooth fixed-unit return compression and exact empirical transport across full and 20% tail distributions; tail means and effective sample mass are reported. The sixth geometry now matches complete robust linear and rank persistence diagrams with exact diagonal-aware W2, and excludes constant-return topology. The seventh geometry now uses robust multiresolution state-tree prefixes with neutral bands, explicit volume coverage and six refinement rounds; zero distance means a shared quantized leaf. The eighth geometry now uses time-augmented four-channel step-2 log signatures across the whole window, halves and quarters, plus activity and zero-volume anchors. This is a fixed weighted feature distance, not an intrinsic Lie-group distance. Basket date alignment is window-local, so future mismatches cannot disable past windows. Lab compares methods on shared origins and reports coverage. Search parameters are validated and duplicate method IDs cannot inflate agreement.

See `CANDLE_MODEL.md`, `PATH_MODEL.md` and `RELATION_MODEL.md` for designs, `research/candle-validation.json`, `research/path-validation.json` and `research/relationship-validation.json` for measured synthetic results, and `VALIDATION.md` for checks. Run `npm run validate:candle` , `npm run validate:path` or `npm run validate:relations` to reproduce each comparison. Synthetic results do not establish a forecasting advantage.

Market-state design, numerical checks and synthetic limitations: [MARKET_STATE_MODEL.md](MARKET_STATE_MODEL.md). Reproduce with `npm test`, `npm run validate:market`, `node scripts/market-reference-fixture.mjs` and `python scripts/check-market-reference.py` (NumPy required).

Return-distribution design, numerical checks and synthetic limitations: [DISTRIBUTION_MODEL.md](DISTRIBUTION_MODEL.md). Reproduce with `npm run validate:distribution`, `node scripts/distribution-reference-fixture.mjs` and `python scripts/check-distribution-reference.py` (NumPy/SciPy required).

Topology design, independent verification and limitations: [TOPOLOGY_MODEL.md](TOPOLOGY_MODEL.md). Reproduce with `npm run validate:topology`, `node scripts/topology-reference-fixture.mjs` and `python scripts/check-topology-reference.py` (NumPy/SciPy required).

Hierarchy design, independent verification and limitations: [HIERARCHY_MODEL.md](HIERARCHY_MODEL.md). Reproduce with `npm run validate:hierarchy`, `node scripts/hierarchy-reference-fixture.mjs` and `python scripts/check-hierarchy-reference.py` (NumPy required).

Path-order design, independent tensor verification and limitations: [SIGNATURE_MODEL.md](SIGNATURE_MODEL.md). Reproduce with `npm run validate:signature`, `node scripts/signature-reference-fixture.mjs` and `python scripts/check-signature-reference.py` (NumPy required). Synthetic linked-drift forecasts worsened versus the old signature; no prediction advantage is established.
