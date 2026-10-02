# SecondOrder Stock publishing

Version v0.13 aligns the complete wordmark with Markets/Homology, adds a three-step workflow, a Marketstack v2 import and runnable geometry result cards.

Private development uses versioned branches in secondorder-stock-private; public releases use secondorder-stock-public/main and its Vercel project. /stock is embedded at secondorder.tools. The custom Stock domain awaits DNS configuration.

Real history uses server-side MARKETSTACK_API_KEY. Requests use HTTPS and adjusted OHLCV when complete; otherwise all assets use raw OHLCV and the UI warns that splits can affect comparisons. Requests use, bounded pagination, one year of history and a 15-minute cache. Provider authentication, plan, quota and short-history errors are shown without replacing existing data. Keys must never be committed or placed in client code.
