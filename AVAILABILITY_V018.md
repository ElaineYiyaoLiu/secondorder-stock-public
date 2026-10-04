# SecondOrder Stock v0.18

Homology now occupies the same two-column grid cell as the seven other models, next to model 07. It uses the same heading, question, observation, metrics, plot, evidence badge and footer button. Detailed historical tables and outcomes expand inside its own card. It has no full-width grid rule or standalone section heading.

The original SecondOrder wordmark is restored with Stock as a separate product label. The v0.1 stock header and the current main-site header both use text wordmarks; neither includes a separate logo image. The earlier merged SecondOrder Stock styling had removed that distinction.

## Availability diagnosis and fixes

The production real-history default returned eight assets and 745 aligned daily bars, ending 2026-10-02. Its 30-day current-analysis run returned all primary metrics. Several models retained limited evidence, which is distinct from missing calculations.

The previous interactive sample generated almost independent asset returns. Correlation shrinkage commonly eliminated specific links, leaving the strongest pair undefined. The interactive dataset now explicitly illustrates a shared market component with asset-specific variation, while retaining eight assets and 850 daily observations. It remains labelled synthetic. No real prices, imported files, evidence thresholds or historical numerical fixtures are altered to produce valid-looking results.

Optional risk comparison metrics are shown when a valid adjacent-window comparison exists. Missing adjacent history is explained instead of adding an undefined metric. Undefined price/volume peaks, supported pairs and resampling metrics have short specific reasons in the actual renderer. Zero remains a valid value.

## Repeated checks

Three rounds use endpoints 849, 789 and 729. Each covers all eight assets and 20/30/60/120-day selections: 96 current-analysis runs. Every run returns seven models with defined metrics and finite numeric values. All eight assets have mature Homology references at 5/20/60-day horizons for the default selection. Synthetic NVDA 30-day and 120-day queries both return complete cohorts at all three horizons; references and their outcomes precede the query.

Adversarial checks retain insufficiency for a one-asset dataset, omit an unsupported adjacent comparison, and verify specific missing-value reasons rather than fabricated numbers. Original numerical fixtures and existing model audits remain unchanged.

211 tests passed. Build and whitespace checks passed. Live UI and real-history checks are repeated after publishing.
