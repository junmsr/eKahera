# TODO: Improve Error UI Across Project

## Overview
Update all error displays in the frontend to include an error icon (exclamation triangle) and ensure consistent styling. Remove any curly braces from error messages if present.

## Files to Update
- [x] frontend/src/pages/SuperAdminView.jsx: Update error display in business approval/rejection sections
- [ ] frontend/src/pages/SuperAdmin.jsx: Update error display in profile and delete sections
- [ ] frontend/src/pages/Profile.jsx: Update error display in profile fetch/update
- [ ] frontend/src/pages/POS.jsx: Update error display in transaction section
- [ ] frontend/src/pages/Logs.jsx: Update error display at bottom of logs table
- [ ] frontend/src/pages/EnterStore.jsx: Update error display in store entry
- [ ] frontend/src/pages/Documents.jsx: Verify and update if needed (already has icon)
- [ ] frontend/src/pages/CashierPOS.jsx: Update error display in POS section
- [ ] frontend/src/components/ui/SuperAdmin/DocumentVerification.jsx: Update error displays in verification actions
- [ ] frontend/src/components/ui/POS/ScannerCard.jsx: Update error display in scanner

## Steps
1. For each file, locate the error display JSX.
2. Add an error icon (SVG exclamation triangle) to the left of the error text.
3. Ensure error message is cleaned of any leading/trailing brackets.
4. Use consistent styling: bg-red-50, border-red-200, text-red-700, rounded-xl, flex items-center gap-3.
5. Test each page after update to ensure no regressions.

## Completion Criteria
- All error displays have an icon.
- No curly braces in error messages.
- Consistent red-themed styling.
- No broken functionality.
