# SecondOrder Stock v0.17

## Data budget

The interactive demo has eight assets and 850 aligned synthetic daily bars. It retains the original 500 bars exactly and adds 350 earlier weekday observations. Prices and volume are simulated, clearly labelled, and never presented as real history. The original 500-bar numerical fixture remains the default for existing research tests.

The UI requests three years of real history by default with comparison assets included. It reports actual aligned coverage rather than treating a requested year count as a guarantee. Longer ranges remain optional. There is no automatic widening of the request, silent substitution or additional asset universe.

For a query of L days and the longest 60-day historical outcome horizon, three spaced references can potentially fit once `3 * (L + 60) + L` aligned observations are available through the query end: 300 for the default 30-day query, 660 for a 120-day query. This is a coverage prerequisite. Candidate variation, greedy similarity ordering, estimation sensitivity and maturity still affect the number and quality of references. More data cannot guarantee strong evidence or scored validation origins.

## Model organization

| Number | Model | Task |
|---|---|---|
| 01 | Candlestick structure | Within-day price structure |
| 02 | Price path | Net move, reversals and drawdown |
| 03 | Asset relationships | Co-movement among labelled assets |
| 04 | Basket risk | Equal-weight group fluctuation and contributions |
| 05 | Return distribution | Typical daily moves and observed tails |
| 06 | Multiscale state | 20/60/120-day context |
| 07 | Price-volume order | Observed price/volume sequence |
| 08 | Homology | Historical structure matching and later outcomes |

All eight cards share the Analysis page and selection. Homology has no separate navigation section. A single Worker request computes selected current models and optionally Homology; results are published together. Every card retains its separate evidence assessment. Individual execution and result export remain available.

## Simulated novice walkthrough

This is an expert simulation of first-use tasks, not a claim of testing with recruited users.

Round 1, before changes: the production page showed seven checkboxes, skipped model numbers, and a separate Homology tab. The visitor had to infer a data source, query length, basket meaning, and whether evidence labels were trading signals. Chart display and analysis selection looked like competing controls.

Round 2 changes: a three-step introduction; explicit demo provenance; coverage status; default latest 30-day selection; an eight-model button; optional model checkboxes; continuous card numbers; same-grid Homology; model-specific plain-language questions; chart-display labels; evidence definitions; trading-day and asset-group explanations; a compact glossary; historical distance/outcome explanations; optional technical diagrams; MAE/percentage-point explanations in Advanced checks.

Regression checks cover bounded past-only demo extension, original fixture preservation, aligned coverage, invalid/missing/single-asset selections, exact coverage boundary, 30/120-day computations, all three horizons, future-data isolation, unified numbering and one-click/subset Worker dispatch. Live walkthrough results are recorded after deployment.

Round 2 live checks: the embedded production page reported eight demo assets, 850 aligned bars, and 8/8 results after one click. Model numbers were 01–07 plus 08 Homology in the same grid. A 120-session run completed. Switching language translated the controls and guidance. A three-year real-history request returned 745 aligned daily bars across eight assets, 2023-10-03 to 2026-10-02, explicitly unadjusted. Its latest 30-session one-click run returned 8/8 results. Advanced checks completed with 5 scored / 28 attempted origins and retained limited evidence. JSON preparation produced a v0.17 filename and visible retry link; browser download completion is not claimed.

Round 2 remaining confusion and fixes: diagnostic shrinkage/sensitivity/SPD values were mixed with main observations, and an entirely prior-driven correlation matrix could look like proof of no relationships. Diagnostics now sit inside optional details; unsupported charts are hidden. Each current model has a plain-language reading guide. Homology explains structure versus price shape, completed historical horizons, matching sensitivity and the effect of changing a horizon. Path legends identify selected versus historical periods. The glossary defines OHLCV, log-return context, N/A, unadjusted prices and splits. Searching a real/CSV dataset explicitly says it searches loaded assets and explains how to choose another stock.

Full numerical/production/coverage suite: 206 tests passed. Build and whitespace checks passed. These checks and simulated walkthroughs do not establish that every person will find every explanation clear, nor that all inputs have strong statistical evidence.
