# v0.9 development validation, 2026-10-01

Geometry 8 is `path-order-signature-v2`. 120 automated tests pass, including 500 Chen composition cases, 500 metric triples, time and local order collision examples, extreme-input validation, future isolation, Worker dispatch and exact v0.8 snapshots for the seven other geometries. Independent Python/NumPy degree-2 tensor signatures match 200 raw paths and 720 window states, with maximum final vector error 2.98e-14. Stress checks cover 10/30/120-day queries over 3,000 sessions. The synthetic linked-drift process worsened versus the legacy signature; no predictive advantage is established. Browser visual/export/threading and live-provider QA remain unverified. See `SIGNATURE_MODEL.md` and the two `research/signature-*.json` reports. This is a version-branch preview; production remains v0.1.

# v0.8 development validation, 2026-10-01

Geometry 7 is `hierarchical-state-v2`. 106 automated tests pass, including 20,000 adversarial prefix triples, clipping regression for a degenerate bimodal MAD, extreme-input validation, future isolation, Worker dispatch and exact v0.7 snapshots for the seven other geometries. An independent Python/NumPy embedding matches 240 window prefixes, with maximum feature error 3.58e-14; ancestor-set LCA distances match 1,000 pairs. Stress checks cover 10/30/120-day windows against 3,000 sessions. Synthetic 24-seed evaluation does not establish forecast gains. Browser visual/export/threading and live-provider QA remain unverified. See `HIERARCHY_MODEL.md`, `research/hierarchy-reference-check.json` and `research/hierarchy-validation.json`. This is a version-branch preview; production remains v0.1.

# v0.7 development validation, 2026-10-01

The sixth geometry is `market-topology-v2`; equations, comparisons and limits are in TOPOLOGY_MODEL.md.

- 96 automated tests pass, including known Rips diagrams, 100 exhaustive assignments, 500 diagram metric triples, 66-point matching, tiny features, degeneracy, labels, future isolation, seven-model v0.6 snapshots and six-model Worker search/Lab.
- Independent GF2 persistent-rank oracle: 60 complexes at all critical-threshold pairs, 79,032 H0/H1 ranks agree. 200 SciPy assignments: maximum error 1.11e-16. NumPy correlation distances: maximum error 2.53e-14. Ripser/GUDHI are unavailable; no package cross-check is claimed.
- 24 synthetic six-asset 1,000-session histories, four variants, 863 common scored origins. All full-model MAE means slightly worse than legacy, all exploratory paired intervals cross zero and none beats zero-return prediction.
- 12-asset / 3,000-session stress: 585/577/541 finite candidates for 10/30/120-session queries, eight neighbours each, approximately 1.26/1.62/3.03 seconds here.
- Build, module syntax and local HTTP routes pass. UI includes separate linear/rank barcodes and unavailable states; export retains full diagrams and distances.
- Browser interaction QA and real-market validation remain unverified. No predictive advantage or permanent absence of bugs is claimed.

Earlier development validation follows.

# v0.6 development validation, 2026-10-01

The fifth geometry is `return-distribution-v2`. Details, formulas, tests and limitations are in DISTRIBUTION_MODEL.md.

- 82 automated tests pass, including 500 random unequal-length distribution triples, exact fractional-tail formulas, ties, duplicates, flat and extreme prices, invalid inputs, future isolation, legacy diagnostics, v0.5 hashes for the other seven geometries and five-geometry Worker search/Lab.
- Independent SciPy weighted CDF oracle: 300 model pairs and 100 unequal-sample transport cases. Maximum channel error 8.89e-16, full distance error 4.45e-16. Scripts and report retained; large deterministic input regenerates from seed.
- 1,200 constructed contamination-retrieval pairs expose short-tail failure: 10-session windows do not distinguish the contaminated similar candidate. Longer-window improvements are target-dependent.
- 36 synthetic 1,200-session forecast histories, four variants, 1,656 common origins, exploratory 5,000 seed-cluster bootstrap. All forecast intervals cross zero and no full-model result beats zero-return prediction.
- 12-asset / 3,000-session stress: 585/577/541 finite candidates for 10/30/120-session queries, eight neighbours each, approximately 2.01/1.13/2.25 seconds in this workspace.
- Build, module syntax and local HTTP routes pass. UI describes tail means as daily log returns and displays effective tail sample mass. Export contains the representation.
- Browser interaction QA and live-market validation remain unverified. No predictive advantage or guarantee of permanent bug absence is claimed.

Earlier development validation follows.

# v0.5 development validation, 2026-10-01

The fourth geometry is `market-state-spd-v2`. Details, equations, failure corrections, synthetic results and stopping rule are in MARKET_STATE_MODEL.md.

- 69 automated tests pass. Includes 500 SPD triples, known formulas, covariance degeneracy, extreme scales, labels, JSON, future isolation, preserved v0.4 hashes for the other seven geometries, and four-geometry Worker search/Lab.
- Independent NumPy: 9 covariance windows / 100 SPD pairs; covariance error 2.02e-17, distance error 7.11e-13. Reproducible scripts and result in scripts/ and research/market-reference-check.json.
- 1,200 estimation windows and 27 synthetic forecasting histories / 972 shared scored origins, four variants, 5,000 seed-cluster bootstrap. Improved short/noisy covariance estimation does not establish better forecasts; all three forecast intervals cross zero and none beats zero-return prediction.
- 12-asset / 3,000-session stress: 585/577/541 candidates for 10/30/120-session queries, all eligible; 8 neighbours each; approximately 1.25/1.90/2.65 seconds here.
- Build, module syntax and local HTTP checks pass. UI includes covariance risk, shrinkage, clipping, complete-prior and unavailable states; export contains the representation.
- Browser interaction QA and live-market validation are unverified. Installed Playwright has no runnable browser executable. No trading advantage or guaranteed absence of all bugs is claimed.

Earlier development validation follows.

# v0.4 development validation, 2026-10-01

The third geometry is `asset-relationships-v2`. Earlier branches remain unchanged; production is not promoted by this development update.

- 56 node:test cases pass, including 500 randomized triples across 3–12 assets and 10–120 sessions. Tests cover labelled identity, unit and asset-order invariance, independent rank/OAS examples, PSD, symmetry, diagonals, bounded coefficients, exact distance contributions, tied ranks, constant-return exclusion, sparse/invalid values and extreme prices.
- Independent NumPy correlation, tied ranks and finite-p OAS checks pass with maximum matrix errors below 3e-15. Source and result are retained under scripts/ and research/relationship-reference-*.
- The revision loop fixed full-history alignment leaking future date mismatches into past availability, undefined candidates entering ranking, negative-zero JSON differences and sparse method IDs. Local basket alignment and excluded candidate counts are returned explicitly.
- A 12-asset, 10-session stress query exposed unstable PSD validation on a valid rank-deficient matrix. Diagonal-pivoted Schur reduction fixes it; seed 1117, indices 1770–1779 is a regression case.
- Seven other representations and rankings match the saved v0.3 engine on valid aligned data. Existing SPD/topology definitions and raw-correlation inputs remain unchanged. Their availability now correctly follows each window's alignment.
- Worker dispatch covers all first three models, Lab, structured-clone transport and errors. These checks do not verify browser rendering/threading.
- 1,200 six-asset Monte Carlo windows compare estimation to known latent correlation; independent and contaminated data favor the new estimator, while clean factor data can favor legacy because of shrinkage bias.
- 72 simulated six-asset histories produce 3,311 shared scored origins, plus 88 inherited demo origins. Separate-seed forecasts include no-shrink/no-winsor/linear-only ablations and 5,000 seed-cluster bootstrap resamples. Two groups favor the full new method slightly and one does not; all three paired intervals cross zero, and none beats zero-return prediction. Full data are in research/relationship-validation.json.
- Matrix view/export identify the new relationship model, shrinkage and undefined cases. Topology continues to use raw correlation and is labelled separately. Syntax/build checks pass. Local HTTP routes for the home page, relationships, engine, worker and application return 200 with correct module MIME types and v0.4 branding. A 12-asset, 3,000-session stress history passes at 10/30/120-session queries; the longest examines 541 eligible candidates in approximately 3.1 seconds in this workspace. See research/relationship-engine-checks.json.
- Browser interaction QA and live-provider/real-market validation remain unverified for v0.4. No forecasting advantage is claimed.

See RELATION_MODEL.md for exact equations, findings and stopping rule. Earlier records below are historical.

# v0.3 development validation, 2026-10-01

The second geometry is now `price-path-dtw-v2`; candle v2 remains unchanged. Historical v0.1/v0.2 branches are preserved and production is not promoted by this change.

- 39 node:test cases pass. New checks include eight exhaustive-path oracle comparisons, 500 random path pairs across 10–120 sessions, independently reconstructed optimal trace costs, symmetry, identity, finite extremes, price-unit invariance, robust scale under an isolated spike, endpoint/risk sensitivity and invalid/sparse input rejection.
- Future changes and appended observations cannot change historical DTW retrieval or predictions. Seven other representations and retrieval rankings match the saved v0.2 engine, beyond the in-suite legacy-mode comparison.
- The evaluation loop exposed model-dependent missing origins due to greedy neighbour spacing and the minimum of three neighbours. Offline comparison and browser Lab now use common dates, retain coverage, and deduplicate method IDs. Pairing tests check reordered dates, excluded dates, duplicated dates and mismatched actuals/baselines. Unavailable basket methods do not remove single-symbol origins.
- Worker dispatch tests cover both candle and DTW search and Lab through a structured-clone message sink.
- `npm run validate:path` compares 72 synthetic histories, with 3,311 common scored origins per full/legacy model and 88 demo origins. Separate-seed cohorts include no-warp/no-slope/no-regime ablations and 5,000 paired seed-bootstrap resamples. Full results and coverage are in `research/path-validation.json`.
- The full new model has higher MAE than legacy in all three separate-seed groups and loses to past-mean/zero-return baselines. The paired uncertainty intervals cross zero in those groups. The development repeated-drift group is worse with an exploratory positive interval. No forecasting improvement or market alpha is demonstrated.
- Computational stress on 3,000 fixture-derived bars completes finite DTW retrieval at 10, 30 and 120 sessions. The longest query scored 541 candidates in approximately 0.66 seconds in this workspace. Timings are runtime-specific; this repeated fixture is not market validation. See `research/path-engine-checks.json`.
- Browser-module syntax checks and build pass. Local HTTP checks pass for the home page, price-path module, engine, worker and application with correct JavaScript MIME types and v0.3 branding. No credential patterns were found in changed sources. Browser visual/threading QA and live-provider validation remain unverified for v0.3.

See `PATH_MODEL.md` for equations, assumptions, findings and the stopping rule. Existing candle results below are historical and their design is unchanged.

# v0.2 development validation, 2026-10-01

The Candlestick / Euclidean implementation is now `candle-euclidean-v2`; v0.1 is preserved in the historical branch and in a diagnostic baseline function. Production is not updated by this development change.

- 24 node:test cases pass, including the original regressions, 12 candle-specific cases and worker dispatch. One inherited future-data fixture was corrected to scale all OHLC fields, rather than generating an impossible close above the high.
- 500 deterministic random triples check finite distance, nonnegativity, symmetry and the triangle inequality. Exact block contributions, price/volume unit invariance, zero volume, flat windows, extreme magnitudes, invalid bars, future-invariant candle retrieval and past prediction are checked separately.
- Search rejects invalid indices, counts, horizons and geometry IDs. Duplicate IDs cannot inflate consensus.
- `npm run validate:candle` compares v0.1 and v2 on 72 generated histories with 1,200 bars each: 3,312 identical scored origins per model, plus 88 demo-symbol origins. Full results are in `research/candle-validation.json`.
- Separate seed cohort MAE is slightly better than v0.1 in all three processes, but worse than the past-only mean and zero-return baselines. v2 loses on three of eight demo symbols, including NVDA. There is no demonstrated forecasting advantage.
- Browser-module and adapter syntax checks, build output and local HTTP routes pass. Worker tests exercise search, Lab and error messages using a structured-clone message sink; they do not verify browser threading or rendering.
- v0.2 has not received live-provider or browser visual QA. Historical production browser observations below apply only to v0.1.

See `CANDLE_MODEL.md` for the equations, weights, assumptions and stopping rule. Passing engineering checks does not close the empirical research questions.

# Historical v0.1 validation

Local verification on 2026-10-01:

- Node syntax checks for browser modules and server adapter.
- `npm run build` succeeds with no external dependencies.
- Eleven `node:test` checks pass: SPD diagonal formula, symmetry and congruence invariance; exact square Rips H1 birth/death; DTW identity; strong ultrametric inequality; signature area changes with order; mature, separated candidate outcomes; no dependence on appended future observations; single-symbol basket exclusion; CSV validation; earlier walk-forward predictions unchanged by later data; absent provider configuration; mocked provider mapping with no key in the response.
- All eight engines execute on the inherited 500-observation synthetic sample. The default 30-session query examines 77 mature candidates and produces four separated analogues. Lab scores 11 origins per method. These counts are implementation checks, not real-market validation.
- Local server starts and reports its listening address. HTTP access from a separate tool process did not connect, so route delivery is not verified. The provider handler is tested directly: absent configuration returns an explicit 503 and never invents provider quotes.

Online verification on 2026-10-01:

- Private repository: ElaineYiyaoLiu/secondorder-stock-private. Visibility is private; the only branch and default branch is v0.1.
- Vercel project: secondorder-stock under SecondOrder. Production URL: https://secondorder-stock.vercel.app/. Production branch is v0.1, connected directly to the private repository as requested.
- The source deployment reached Ready. Desktop browser verification completed: candlestick rendering, ticker search and switching, 20-session selection, historical analogue computation, price overlay, 5/20/60-session outcome tables, all eight geometry cards, correlation map and H0/H1 persistence, language switching, and the Lab walk-forward calculation.
- The NVDA 30-session query returned four separated analogues from 77 candidate windows. Lab completed 11 origins for each of eight representations. AAPL 20-session selection also computed outcomes successfully. These are synthetic sample functionality checks, not real-market evidence.
- The unconfigured provider action preserves the current dataset and displays a message. No live Twelve Data key was supplied. No credentials were committed; .env.example contains an empty placeholder, and provider tests use a test-only string.
- No application-script errors were observed during these flows. Browser extension metadata errors were excluded.
- Mobile viewport, CSV file chooser/upload and export download QA remain unverified. No production claims about real-market prediction are made.
- Existing SecondOrder sites were not modified. No public repository was created.

