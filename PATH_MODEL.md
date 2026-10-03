> Historical retrieval design. Production v0.15 roles are documented in MODELS_V015.md.

# Price path geometry v2

SecondOrder Stock v0.3 keeps the candle geometry introduced in v0.2 and replaces the second geometry with `price-path-dtw-v2`. Historical versions stay unchanged. This is a close-path representation and similarity function for analogue retrieval, not a trained return predictor.

## What changes

The previous geometry compared zero-rebased log closes with squared local cost in a 10% Sakoe–Chiba band. It allowed unlimited repeated horizontal/vertical steps within the band and did not separately preserve risk level or endpoint return. Its root accumulated cost divided by the sum of lengths is retained as an exact diagnostic baseline through `pathModel: 'legacy'`.

The new model uses two aligned channels, explicit time-distortion costs, local step constraints and two unwarped anchors. Every representation is computed from its own selected window. Nothing is fitted to outcomes, other candidate windows or the full history.

| Component | Definition | Weight in squared distance |
|---|---|---:|
| Alignment | Regularized DTW on compressed normalized log-price level and daily log-return channels | 70% |
| Endpoint | Normalized terminal log price and terminal log return relative to a fixed 1% reference | 15% |
| Risk | Log-transformed daily RMS log return and centered population volatility | 15% |

Weights are design assumptions, not estimated market relationships. The first candle geometry already contains a price-path block, so the two geometries are correlated evidence sources.

## Representation

For positive, finite closes `c[0] ... c[n-1]`, `10 <= n <= 120`, define:

```
l[i] = log(c[i])
r[i] = l[i] - l[i-1], i >= 1
s = max(1e-6, median(abs(r)) / 0.6744897501960817)
x[i] = asinh((l[i] - l[0]) / (s * sqrt(n-1)))
y[0] = 0
y[i] = asinh(r[i] / s), i >= 1
endpoint = [x[n-1], asinh((l[n-1] - l[0]) / 0.01)]
RMS = hypot(r) / sqrt(n-1)
volatility = hypot(r - mean(r)) / sqrt(n-1)
risk = [log1p(RMS/1e-6), log1p(volatility/1e-6)]
```

Subtracting logs avoids forming overflowing or underflowing ratios. `asinh` compresses extreme values without clipping distinct inputs to the same value. Positive price-unit changes preserve the representation up to floating-point precision. Volume, open, high and low do not enter this geometry.

The scale is robust to an isolated return outlier. The Gaussian calibration constant makes median absolute zero-centered returns a familiar scale estimate under a zero-mean Gaussian process, but the code does not assume that markets follow that process. Returns are not centered before computing this scale, so a steady trend remains meaningful. RMS and centered volatility are kept separately, including for constant drift and nearly flat windows. The floor is in dimensionless log-return units.

## Alignment objective

Compare equal-length windows. An admissible path starts at `(0,0)`, ends at `(n-1,n-1)` and stays within `ceil(0.1*n)` sessions of the diagonal. Steps are diagonal `(1,1)`, horizontal `(0,1)` or vertical `(1,0)`. At most two consecutive horizontal or vertical steps are allowed. Changing directly between horizontal and vertical is prohibited; a diagonal step must separate them.

For local indices `(i,j)`:

```
q(i,j) = 0.65*(xA[i]-xB[j])^2
       + 0.35*(yA[i]-yB[j])^2
       + 0.05*((i-j)/band)^2
```

The initial cell and every diagonal destination have weight 2. Horizontal/vertical destinations have weight 1 and incur a further 0.05 cost per step. Each path has total cell weight `2*n`: the initial weight is 2 and each subsequent weight equals the total number of index increments. Consequently the denominator is constant across all admissible paths. Dynamic programming minimizes exactly the objective returned to the caller, without choosing a sum-optimal path and then normalizing by its variable path length.

```
A = minimum weighted path cost / (2*n)
E = mean squared endpoint-coordinate difference
R = mean squared risk-coordinate difference
d = sqrt(0.70*A + 0.15*E + 0.15*R)
```

The five dynamic-programming states are diagonal, first/second horizontal and first/second vertical. All states are considered at the final cell. The diagonal path always exists. Diagnostics can return component contributions and the optimal trace through `pathComparison(a,b,{trace:true})`; ordinary retrieval uses the identical objective without allocating parent pointers.

The distance is symmetric, nonnegative and zero for identical representations. Time penalties prevent a shifted but otherwise matching path from receiving a free zero-cost alignment. No triangle inequality is claimed. This is a regularized DTW dissimilarity, not a Riemannian manifold or a Euclidean metric. The time and step penalties are part of the score, not after-the-fact annotations.

## Tests and revision loop

1. Check inherited tests and isolate the change to the second geometry.
2. Compare the dynamic program with independent exhaustive enumeration on eight 10-session path pairs.
3. Run 500 deterministic random pairs spanning 10–120 sessions. Check identity, symmetry, finite scores, trace endpoints, monotone steps, band, run limits, no immediate warp reversal, independently reconstructed cost, fixed normalization and the diagonal upper bound.
4. Check price-unit invariance, JSON/structured-clone transport, flat and nearly flat paths, extreme finite prices, invalid and sparse-array inputs, volatility and endpoint sensitivity, ordering and time-stretch penalties.
5. Revise the initial RMS-based normalization after identifying its sensitivity to a single outlier. Add a regression proving the ordinary-step scale remains unchanged by an isolated shock.
6. Reject sparse arrays after adversarial review found that JavaScript array iteration can skip missing entries. Add sparse-window/channel regressions. Correct the evaluation-coverage mismatch found during the first comparison, with regression checks for date pairing and the browser Lab. Check future-data retrieval/prediction invariance, unchanged seven other representations and rankings, worker search/Lab dispatch, syntax, build and module delivery.
7. Compare legacy, full model and three ablations with fixed design constants. Record unfavorable results as well as improvements. Do not tune parameters to these outcomes.

Stop when the checks pass and review finds no remaining known implementation defect within this scope. Further empirical failures are research findings, not a reason to repeatedly tune against the same test set. Passing this loop does not prove the software has no possible defect.

## Evaluation and practical limits

Run `npm run validate:path`. Full results are recorded in `research/path-validation.json`. The protocol compares 72 synthetic histories with 1,200 observations each, using 30-session queries, 20-session forward outcomes, 20-session evaluation stride and six separated neighbours. Candidate outcomes must finish strictly before the query starts. Metrics are calculated on the intersection of scored dates across all compared models. Model-specific available and excluded dates are retained. One early origin in the switching-volatility seed cohort is excluded, giving 3,311 common origins across the 72 histories. The same generators and seeds used in candle evaluation are retained to make model comparisons interpretable.

Twelve seeds per process form each development/separate-seed cohort. The separate cohort additionally evaluates removal of warping, the slope channel or the risk anchor. Its seeds have been used in earlier candle research and are not an untouched market dataset. No ablation is selected as a replacement based on these results. The report gives a 5,000-resample paired seed bootstrap of the full-minus-legacy MAE difference, preserving within-history dependence. Twelve seeds yield exploratory uncertainty estimates; comparisons are not corrected for multiple testing.

The mathematical definition is more explicit and guarded, but any improvement in analogue forecasting must be demonstrated rather than inferred from its sophistication. Synthetic results, including the repeated-pattern generator, cannot establish market alpha.

Use consistently adjusted completed-session prices. This model does not repair splits, dividend adjustments, missing sessions or stale quotes. A shock caused by a bad corporate-action adjustment remains a shock to the geometry. Equal session count does not guarantee equal elapsed calendar time. Flat windows compare safely but supply little path information. No volume or intraday structure is represented. The 10% band, two-step run limit, scale floor, endpoint reference and component weights require external validation. There is no transaction-cost, point-in-time universe or live-provider validation in this change.

## References

The general DTW framework and combination of global/local path constraints are described in Keogh and Ratanamahatana, *Exact indexing of dynamic time warping*: https://www.cs.ucr.edu/~eamonn/KAIS_2004_warping.pdf . Step patterns and normalization are also explained by the DTW package authors: https://dynamictimewarping.github.io/faq/ . The channels, anchors, penalties and constants above are this project's explicit design choices, not results established by those references.

## Measured results

MAE in return percentage points on the separate-seed cohort, at common origins:

| Process | Legacy DTW | Full v2 | Past mean | Zero return | Common origins |
|---|---:|---:|---:|---:|---:|
| Independent innovations | 6.123 | 6.266 | 5.857 | 5.632 | 552 |
| Switching volatility | 9.488 | 9.569 | 8.271 | 7.606 | 551 |
| Repeated drift | 6.878 | 6.968 | 6.433 | 6.207 | 552 |

新版在这三个种子组中都略差于旧版，也没有超过简单基准。三个配对差值的种子 bootstrap 区间都跨过零，不能据此认定新版或旧版有稳定优势。开发组的重复漂移过程中，新版更差，探索性区间为 [0.026, 0.411] 个百分点。无时间拉伸的消融版本在三个独立种子组中都略优于完整版本，说明当前增加的对齐自由度尚未提供可确认的收益预测价值；不能据此再用同一组结果调参。

工程上，已通过 39 项测试，包含独立穷举核对与 500 组随机路径检查。表示更明确、时间变形更受约束，不等于预测更有效。保留完整结果，下一阶段需要未参与设计的真实复权数据，而不是继续把这些合成结果调到好看。

