# SecondOrder Stock publishing

Version v0.11 aligns the complete wordmark with Markets/Homology, adds a three-step workflow, a shared Twelve Data import and runnable geometry result cards.

Private development uses versioned branches in secondorder-stock-private; public releases use secondorder-stock-public/main and its Vercel project. /stock is embedded at secondorder.tools. The custom Stock domain awaits DNS configuration.

Real history uses TWELVE_DATA_API_KEY on the server when configured; otherwise it requests the existing Markets service. A demo response is rejected. The shared service currently reports not-configured, so CSV import and clearly labelled samples remain available. Keys must never be committed or placed in client code.
