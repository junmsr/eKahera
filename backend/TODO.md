# Fix OTP Email Issue on Render

## Tasks
- [ ] Add RESEND_API_KEY to backend/config.env
- [ ] Install resend npm package to backend
- [ ] Update backend/src/controllers/otpController.js to use Resend API instead of nodemailer
- [ ] Update backend/src/utils/emailService.js to use Resend API for all email functions
- [ ] Remove old Gmail SMTP configuration from config.env
- [ ] Test OTP sending functionality
- [ ] Deploy to Render and verify emails work
- [ ] Monitor for any issues
