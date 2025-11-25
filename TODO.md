# TODO for Fixing Scanned Cart Checkout Duplicate Transaction Issue

## Frontend: frontend/src/pages/CashierPOS.jsx
- Update `handleCheckout` function to include `transactionId` from component state in checkout API request body.
- Modify checkout request body to optionally include `transaction_id` if present.

## Backend: backend/src/controllers/salesController.js
- Modify `checkout` controller to accept optional `transaction_id` in request body.
- If `transaction_id` exists:
  - Start SQL transaction.
  - Update `transactions` table row with `transaction_id`:
    - Set status = 'completed'
    - Set cashier_user_id = current user's userId
    - Update total_amount.
  - Delete existing `transaction_items` rows associated with `transaction_id`.
  - Insert new `transaction_items` from request.
  - Insert/update `transaction_payment` for the transaction.
- Otherwise, fallback to existing logic of inserting new transaction row.
- Commit or rollback appropriately.
- Return JSON response with `transaction_id` and transaction details.

## Followup
- Test scanning a customer cart and performing checkout.
- Verify no duplicate transactions created.
- Verify updated transaction's status and cashier_user_id.
- Verify frontend handles updated transaction response gracefully.
