# SecondOrder Stock publishing

v0.20 uses a single workspace: charts and eight model cards lead to an optional Advanced checks section at the bottom. Real Marketstack data loads automatically, with no synthetic fallback. Each model adds a short bilingual explanation. Successful daily-history responses use a six-hour shared CDN cache; error responses remain uncached. Private version branches retain history; Public has one main branch. Production deploys from secondorder-stock-public/main and is embedded at secondorder.tools/stock.

Release checks: run the complete numerical and production-role tests, build, inspect the public diff for secrets, compare Private/Public tree SHAs, verify Vercel's commit and production aliases, then test the live English/Chinese flows and Marketstack request. Never commit credentials. Existing historical research remains explicitly archived.
