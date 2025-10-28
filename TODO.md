# TODO: Add Delete Option for Businesses in SuperAdmin Store Management

## Backend Changes
- [x] Add `deleteStore` function in `backend/src/controllers/superAdminController.js` to verify superadmin password and delete business, log action
- [x] Add DELETE route in `backend/src/routes/superAdminRoutes.js`

## Frontend Changes
- [x] Add Delete button in `frontend/src/pages/SuperAdmin.jsx` actions column
- [x] Implement password confirmation modal on delete button click
- [x] Call delete API and update local state after successful deletion

## Followup Steps
- [ ] Test delete functionality and error handling
- [ ] Ensure cascading deletes for related data (users, products, etc.)
