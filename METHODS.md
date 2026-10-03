> Archived v0.14 retrieval methods. See MODELS_V015.md for the current implementation.

## Representations

| Method | Implementation | Boundary |
|---|---|---|
| Candlestick / Euclidean | Window-local median log true range; asinh-compressed gap/body/wicks, ordered path, median-relative log volume with zero flags, retained volatility regime; fixed weighted Euclidean norm | Same-length windows, fixed modeling weights, no time warping; see CANDLE_MODEL.md |
| Price path / DTW | Robust window-local return scale; compressed close level and daily-return channels; 10% band, two-step run limit, explicit time/warp penalties, symmetric step weighting; terminal-return and risk anchors | Equal-length windows; regularized dissimilarity, no triangle inequality claimed; see PATH_MODEL.md |
| Correlation | Median/MAD winsorized Pearson and average-tied-rank Spearman, each with original finite-p OAS identity shrinkage; 70/30 off-diagonal Euclidean embedding | Same labelled, locally aligned assets and length; undefined constant-return windows excluded; full shrinkage is a prior, not proof of independence; see RELATION_MODEL.md |
| Riemannian | Median/MAD winsorized covariance, adaptive spherical OAS regularization with 2% minimum; dimension-normalized affine-invariant SPD distance | Same labelled assets and length; flat assets excluded; estimator is not affine equivariant; see MARKET_STATE_MODEL.md |
| Distribution / Wasserstein | Fixed asinh(log return / 1%) transform; exact empirical full/lower-20%/upper-20% quantile distances, weights 60/20/20 | Dimensionless weighted quantile metric; no time order or multidimensional transport; short tails are noisy; see DISTRIBUTION_MODEL.md |
| Topology | Unshrunk robust linear and tied-rank Gram chord distances; exact Z2 Rips H0/H1; exact diagonal-aware W2 assignment, fixed channel/dimension weights | Same basket and length; constant assets excluded; diagrams lose vertex identities; see TOPOLOGY_MODEL.md |
| Hierarchy / ultrametric | Robust volatility / drift / median candle balance / relative volume; fixed neutral bands, volume coverage, 28-level coarse-to-fine prefix tree; d=2^(−LCP/4) | Ultrametric on finite leaves; pseudoultrametric on windows, no Qp embedding; fixed thresholds and order can cause boundary jumps |
| Signature / path order | Four transformed channels; step-2 log signatures on whole window, halves and quarters plus activity anchors; fixed weighted Euclidean feature distance | Finite-order pseudometric on raw windows, no path uniqueness or causal claim; not an intrinsic nilpotent-group metric |

Topology compares complete finite diagrams with Wasserstein order 2 and L-infinity ground distance, including diagonal deletion. Essential H0 and zero-lifetime pairs are omitted. The two-skeleton is sufficient for H0/H1; no higher-dimensional persistence is claimed. Identity shrinkage is not used in topology. Legacy and summary ablations remain for diagnostics. The retained Project 04 Python pipeline uses ripser for its separate larger-basket study; this browser implementation does not execute that pipeline. See TOPOLOGY_MODEL.md for independent verification and limits.

## Analogue search

Query windows have 10–120 observations. Candidates have the same length, sampled every five observations. A candidate endpoint plus the full 60-observation outcome horizon must precede the query **start**, strictly. Only then is its distance computed. Representations are window-local; no full-history fitted scaler is used. Candlestick v2 preserves volatility separately from normalized shape. Relationship v2 uses robust linear and rank channels, retains asset labels and excludes undefined correlation windows. Market-state v2 preserves absolute covariance risk and compares labelled matrices with a dimension-normalized affine-invariant distance. Distribution v2 uses fixed return units and tail mass with exact fractional empirical bins; it retains risk differences without fitted normalization. Topology v2 compares complete robust and rank diagrams, retaining small positive features and excluding undefined correlation windows. Basket dates are checked within each window, not against future observations. Method-specific eligible candidate counts are returned. Duplicate geometry IDs are removed and search indices, neighbour count and horizon are validated.

Each geometry ranks all eligible candidates. Greedy neighbours are spaced by window length plus horizon, up to eight. Consensus combines neighbour memberships, sorts by vote count, breaks ties by mean raw rank, and applies the same spacing. Agreement is an unweighted count, not calibrated confidence. The methods share data and are not statistically independent.

Forward returns use close at the candidate endpoint to close 5, 20 or 60 observations later. Mean, median, positive proportion and linearly interpolated 10th/90th percentiles use equal weight. The same mature cohort is used across horizons. Outcomes and ranges may be unstable with few analogues.

## Lab

Query length 30, horizon 20, test stride 20, first query endpoint 260. Up to six neighbours per geometry, spaced by 50 observations. Each candidate outcome finishes before the query starts. Prediction is the arithmetic mean of neighbour forward returns. The unconditional baseline uses mature past 20-observation returns sampled every 50 observations. At least three neighbours are required for a scored origin. MAE is in percentage points. MAE and baseline errors use the intersection of scored origins across all enabled methods. Available and excluded origin counts are retained; unavailable basket methods do not enter the intersection. Greedy neighbour spacing can make eligibility differ by model, so coverage remains part of the interpretation.

The browser engine caches window representations per dataset and symbol. Changing datasets rebuilds the engine. Background jobs are terminated when the query, dataset or chosen methods change. No adaptive weights, future-based calibration, or geometry selection is fitted.

## Research limits

These are experimental implementations, not verified alpha models. The short synthetic sample has a repeated drift mechanism inherited from Project 02, and can yield apparently useful analogues by construction. No synthetic result is market evidence.

The browser Lab has no statistical-significance intervals. The separate path, relationship, market-state, distribution and topology comparisons report exploratory paired seed-bootstrap intervals on synthetic data. Neither evaluation includes transaction costs, point-in-time constituents, delisted stocks, execution model or survivorship correction. Daily OHLC cannot reveal intraday order. Imported data must handle corporate actions consistently. Correlations of near-constant series are not informative. Small basket structure is not a representation of the entire stock market.

The original Project 04 Python script remains available for its separate larger-basket study. It has its own CLI, schema and report format; the browser Lab does not pretend to execute that pipeline.


See [HIERARCHY_MODEL.md](HIERARCHY_MODEL.md) for geometry 7 equations, independent verification, collision diagnostics and negative synthetic forecasting results.

See [SIGNATURE_MODEL.md](SIGNATURE_MODEL.md) for geometry 8 equations, independent tensor verification, order-collision examples and negative synthetic forecasting results.

