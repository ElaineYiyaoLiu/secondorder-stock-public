# SecondOrder Stock v0.15

This release changes the tasks, not just the model labels. Seven current-analysis models receive selected-window or endpoint-bounded data. Homology alone retrieves earlier structures. Current analysis never calls the archived retrieval engine. No consensus, agreement vote or buy/sell score exists in the production flow.

## Current analysis

| ID | Task | Calculation | Evidence boundary |
|---|---|---|---|
| euclidean | Daily candle structure | Signed body, upper/lower wick proportions, up-body counts and overnight log gaps relative to the median daily log high/low range | Under 20 sessions: descriptive small sample. No order of intraday high/low, fund-flow or reversal inference. Volume is not used in this model. |
| dtw | Current price path | Net change, absolute net log movement / total absolute log movement, maximum peak-to-trough drawdown, recovery and half-window regression slopes | Under 20 sessions: slopes unstable. DTW retrieval removed. Flat paths retain zero efficiency with no maximum drawdown. |
| correlation | Labelled asset links | Existing robust linear/rank Gram estimates and OAS identity shrinkage. Twelve joint circular-block resamples diagnose mean off-diagonal sensitivity | Full shrinkage: no specific relationship conclusion. Under 30 sessions, insufficient resamples or P90 edge deviation over 0.15: limited. Resampling sensitivity is not a confidence interval. |
| riemannian | Equal-weight basket risk | Existing robust spherical-shrunk covariance. Weights 1/p, daily sigma sqrt(wᵀΣw), fractional variance contribution wᵢ(Σw)ᵢ/(wᵀΣw). Also raw equal-weight daily volatility | Full shrinkage: contributions dominated by prior. Short windows: uncertain allocation. Adjacent complete equal-length covariance windows use normalized affine-invariant SPD distance; no historical matching. Negative contributions are allowed. |
| wasserstein | Observed daily-return distribution | Raw simple-return histogram; centered log-return standard deviation; exact fractional worst/best 20% log-return means. Adjacent complete window comparison reuses exact transport and separately reports raw W₁ | Under ten effective tail observations: limited description. Ten is a display heuristic, not statistical adequacy. Extreme raw observations remain visible. Tail means are not loss forecasts. |
| ultrametric | Multiscale context | 20/60/120 sessions ending at selected endpoint. Net change and daily volatility; mean log return × sqrt(n−1) / max(0.001, volatility) labels down below −0.5, up above 0.5, mixed otherwise | Fewer than two scales: insufficient. Distance under 0.15 from a direction boundary: limited. This is a derived overview with shared evidence. Fixed prefix retrieval removed; no ultrametric claim in the new analysis. |
| signature | Observable price-volume order | Existing whole/half/quarter time-augmented step-2 log signatures. Also first maximum-volume and first highest-close dates, quarter simple returns and median volume | Always exploratory. Constant price/volume or zero-volume coverage prevents event-order conclusions. Signed price-volume area is not a causal or lead-lag test. A daily close path cannot reveal intraday order. |

All labels and thresholds above are fixed descriptive engineering choices, not fitted market probabilities. Each result contains summary, metrics, plot data and a separate evidence status. "Observed" means the descriptive calculation has support, not predictive reliability. Missing basket data does not disable single-symbol models.

Adjacent comparison windows are exactly the same number of sessions immediately before the selected start. No reference bank or best-match selection is used. Multiscale context can precede the selection start, but always stops at its endpoint. Asset alignment uses the primary symbol's selected dates, preserving asset identities; it does not require identical array offsets.

## Homology

The asset basket has 3–12 distinct labels. Existing unshrunk robust Pearson and tied-rank Spearman chord distances yield exact Z₂ Rips H₀/H₁ diagrams, with complete diagonal-aware W₂ assignment. Fixed 70/30 channel and 50/50 dimension weights remain. Diagram distances lose vertex labels even though the same basket is required. A three-asset Rips complex cannot retain a positive H₁ loop; absence of H₁ does not erase H₀ information.

Candidate windows have the selected length and are sampled every five primary-symbol sessions. For horizon h in {5,20,60}, candidate endpoint+h must be strictly before the query start. Each horizon independently filters candidates and selects at most eight greedy references, separated by length+h. Cohort composition and counts differ by horizon, and are explicitly displayed. No 60-session gate is applied to 5/20-session comparisons.

Every distance returns normalized H₀/H₁ components for each channel. Displayed combined H₀/H₁ distances use the channel weights; total distance is the root of their 50/50 squared combination. Distances are geometric dissimilarities, not percentages of similarity or probabilities.

Eight fixed-seed joint circular-block resamples of the query diagnose sensitivity against each horizon's fixed shortlist of up to 30 eligible candidates. Block length is rounded sqrt(n−1), at least two returns. Cross-asset return vectors are resampled together. Retention is the proportion in which the original top reference remains among the three spaced references of the local shortlist. It does not assess omitted candidates, constitute a full-bank bootstrap or give statistical confidence. Under four valid resamples, retention below 0.5, under 30 query sessions, indistinguishable eligible distances or fewer than three separated references all limit evidence. Three references is a display minimum, not proof of forecasting adequacy.

Historical later returns use the selected stock, not the whole basket portfolio. Matches can share topology while exhibiting different price paths. Opposite-sign later returns are explicitly identified. All historical results remain descriptive unless separately evaluated.

## Validation and release checks

Production unit tests cover known candle and drawdown cases, equal-weight risk contribution sums, fractional tails, partial date alignment, endpoint-bounded scale context, missing volume, independent horizon maturity and future-data mutation. The production Worker accepts only analysis, homology and lab tasks.

Homology Lab uses a 30-session query, 20-session horizon, 20-session test stride and at most six spaced references. It records attempted, abstained and scored origins separately. Under three references, insufficient past baseline, short topology queries or unstable local matching abstain. The baseline uses mature spaced past 20-session returns. MAE is reported only for scored origins. Under ten scored origins, no reliable forecasting conclusion is supported. This is exploratory and has no transaction-cost model or point-in-time stock universe.

The previous retrieval algorithms and their numerical property tests remain archived in legacy-engine/legacy-worker/legacy-evidence. Build output excludes these three entry modules. Historical validation reports have not been regenerated to masquerade as v0.15 evidence.
