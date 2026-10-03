# SecondOrder Stock publishing

v0.15 separates seven current-analysis tasks from Homology historical retrieval. Private version branches retain history; Public has one main branch. Production deploys from secondorder-stock-public/main and is embedded at secondorder.tools/stock.

Release checks: run the complete numerical and production-role tests, build, inspect the public diff for secrets, compare Private/Public tree SHAs, verify Vercel's commit and production aliases, then test the live English/Chinese flows and Marketstack request. Never commit credentials. Existing historical research remains explicitly archived.
