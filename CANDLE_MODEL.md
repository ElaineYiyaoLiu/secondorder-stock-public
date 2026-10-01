# Candlestick / Euclidean v2

第一个几何仍然回答：两段等长历史窗口，在 K 线、走势和成交量结构上有多相似？它没有单独的收益预测器。后续预测仍由历史邻居的结果均值产生。

旧版把开高低收分别相对第一天收盘取对数，再加入缩放为 0.1 的相对成交量。四个价格坐标共享同一走势，价格与成交量的比例缺少清楚解释。新版把信息分组，使每组的作用可以单独检查。

| 分组 | 信息 | 平方距离权重 |
|---|---|---:|
| Shape | 每日跳空、有方向的实体、上影线、下影线 | 0.45 |
| Path | 按时间排列、从第一天开盘出发的收盘路径 | 0.25 |
| Volume | 正成交量相对窗口中位数的变化，以及零成交量标记 | 0.15 |
| Regime | 典型波动尺度与实际收盘收益波动 | 0.15 |

These weights are fixed design priors, not fitted optimal weights. Shape and path deliberately overlap because they describe local and accumulated movements; the blocks are not independent evidence sources. The four-group allocation removes hidden dimensional weighting, but it does not remove modeling choices.

## Definition

For a window of n bars, let O, H, L, C, V be consistently adjusted OHLCV. All price changes use differences of logarithms to avoid ratio overflow or underflow. Let P_t be the previous close within the window, with P_0 = O_0.

Log true range is log(max(H_t, P_t)) minus log(min(L_t, P_t)). The window scale s is the larger of its median and 1e-6. The floor is dimensionless, approximately a one-millionth relative price movement. It prevents division by zero; results below this floor are floor-dependent.

The daily shape channels before compression are:

- gap: log(O_t) minus log(C_(t-1)), with first gap set to zero;
- body: log(C_t) minus log(O_t);
- upper wick: log(H_t) minus log(max(O_t, C_t));
- lower wick: log(min(O_t, C_t)) minus log(L_t).

Divide each channel by s, then apply asinh. This compresses isolated extremes without hard clipping or deleting their direction. The first gap is unobserved, not estimated using data outside the window. It contributes an always-zero coordinate and is retained for a fixed shape layout.

The ordered path channel is asinh((log(C_t) minus log(O_0)) / (s sqrt(n))). It preserves accumulated direction and order. sqrt(n) is a diffusion-inspired normalization, not an assertion that returns are independent or normally distributed. Equal-length comparison is required.

For positive volumes, subtract the median of their logarithms, then apply asinh. A zero-volume bar has a zero relative-volume coordinate and a separate flag equal to one. No additive pseudocount is used, so changing shares to thousands of shares does not change the representation. The flag records the supplied zero; it cannot distinguish genuine no-trade days from vendor missing-data placeholders. Missing values, negative volume, inconsistent OHLC and nonfinite values are rejected.

The regime channels are log(1 + s/1e-6) and log(1 + q/1e-6), where q is the RMS of the n-1 within-window close-to-close log returns. q is realized movement, not demeaned standard deviation, and includes drift. Keeping these channels prevents volatility normalization from making low-risk and high-risk windows identical. Abrupt corporate-action errors remain visible and are not automatically repaired.

For each block b with m_b coordinates, multiply its coordinates by sqrt(w_b/m_b). Concatenate them into phi. The distance is the Euclidean norm of phi(A) minus phi(B):

    d² = 0.45 MSE_shape + 0.25 MSE_path + 0.15 MSE_volume + 0.15 MSE_regime

There are 7n+2 coordinates. Squared contributions are available through candleContributions. The API uses a norm, not an additional RMS over the full vector, because block sizes are already normalized. Using another RMS would silently change the distance scale with window length.

## Properties and boundaries

The distance is symmetric, nonnegative and obeys the triangle inequality on embedding vectors. On raw OHLCV windows it is a pseudometric: common price and positive-volume unit scaling intentionally gives zero distance. A fixed-weight sum of squared coordinate differences keeps the Euclidean geometry; pair-dependent weights and DTW are not used.

Each window computes its own scale and volume center from that window alone. There is no full-history scaler, learned covariance, outcome-based feature fitting or market-specific tuning. This local normalization does not erase volatility because the regime block retains it. A median center resists an isolated volume spike; a majority of extreme bars can still change the center.

The model does not infer intraday order, align shifted events, preserve absolute liquidity, correct splits, identify holidays or estimate trading costs. Consistent price and volume adjustment is an input requirement. The window may contain repeated observations or very low activity; finite distance does not make those observations economically informative.

The baseline v0.1 representation is retained in legacyCandle and the diagnostic makeEngine option candleModel='legacy'. It is not a ninth selectable geometry. Runtime defaults to v2. The other seven representation definitions are unchanged.

## Validation and stopping rule

Tests cover exact expected distances, block contribution sums, unit invariance, zero volume, flat and near-flat prices, extreme magnitudes, body direction, wicks, gaps, time reversal, 500 seeded random triangle checks, invalid inputs, duplicate IDs, worker dispatch, and future-data invariance in retrieval and walk-forward prediction.

The comparison fixes weights before measurement. It uses 72 generated histories: three processes, two seed cohorts, 12 histories per cohort, 1,200 observations per history. Each has 46 scored origins; total 3,312 origins per model. Both models use identical origins, outcome maturity, search stride and neighbour spacing. Separate seeds test reproducibility within the same generators, not transfer to unseen markets. The inherited eight-symbol demo supplies another 88 origins per model.

Engineering iteration stops when known reproducible defects are fixed and the defined property, regression, worker and build checks pass. This is not proof that no defect exists. Forecasting validation remains open: neither a passing suite nor a lower synthetic MAE is sufficient to establish market information. Weights must not be repeatedly tuned against these same results until they look favorable.

## Measured results

See research/candle-validation.json for every seed and demo symbol. MAE is in percentage points. Held-out-seed cohort averages:

| Generated process | v0.1 | v2 | Past unconditional mean | Zero-return prediction |
|---|---:|---:|---:|---:|
| Independent innovations, no designed drift | 6.343 | 6.175 | 5.857 | 5.632 |
| Alternating volatility, no designed drift | 9.548 | 9.247 | 8.314 | 7.650 |
| Repeated drift phases | 6.790 | 6.767 | 6.433 | 6.207 |

新版在这三个独立种子组的平均误差都略低于旧版，但都没有超过简单基准。开发种子组的重复漂移过程中新版略差。八个原有合成股票样本里，新版赢五个、输三个，NVDA 的 MAE 从 4.025 升到 4.646。因此可以说表示和边界处理更完整，不能说预测能力已经改善。没有统计显著性检验，也没有真实股票数据验证。

下一步应在未用于设计的真实复权 OHLCV 上做时间顺序验证，检查邻居稳定性、分组消融、参数敏感性及分市场状态的表现。只有训练时段可用于权重选择，测试时段必须保留，并与旧版、无条件均值和零收益基准比较。
