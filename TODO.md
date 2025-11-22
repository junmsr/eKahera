# TODO: Update Cash Ledger Endpoints for User Exclusivity and Daily Filtering

## Tasks
- [ ] Update `getCashLedger` in `backend/src/controllers/statsController.js` to filter transactions by user role (cashiers see only their own) and limit to today's transactions.
- [ ] Update `getCashTransactions` in `backend/src/controllers/statsController.js` to filter transactions by user role and limit to today's transactions.
- [ ] Test the endpoints to ensure filtering works correctly for different user roles and only shows today's data.
