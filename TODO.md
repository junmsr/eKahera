# TODO: Business Approval Email and Login Restriction

## Tasks
- [x] Modify `approveStore` in `backend/src/controllers/superAdminController.js` to send email confirmation after approval
- [x] Modify `login` in `backend/src/controllers/authController.js` to prevent login for pending businesses
- [x] Ensure email configuration in config.env is set up correctly (EMAIL_USER and EMAIL_PASSWORD are configured)
- [ ] Test email sending functionality (approve a business and check if email is sent)
- [ ] Test login restriction for pending businesses (create a user with pending business and try to login)
