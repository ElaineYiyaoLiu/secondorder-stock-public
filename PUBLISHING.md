# SecondOrder Stock publishing

Application release: v0.10. Private development versions are preserved in `secondorder-stock-private/v0.X`. The released source is mirrored to `secondorder-stock-public/main`, which supplies the `secondorder-stock-public` Vercel project. Intended domain: `stock.secondorder.tools`, with the portal entry at `secondorder.tools/stock`.

The public source contains no provider credentials. Configure TWELVE_DATA_API_KEY only in the deployment environment when live provider use is needed. Sample data and local CSV imports need no key.

Run npm test and npm run build before publishing. Verify both languages, portal language propagation, the displayed version, responsive layout and mature historical outcomes. The eight models remain experimental; see each model document for negative forecasting evidence and limitations.
