# SuperAdmin Registration System

This document explains the secure SuperAdmin registration system implemented in eKahera.

## 🔐 Security Features

- **Strong Password Requirements**: 8+ characters with uppercase, lowercase, numbers, and special characters
- **Email Validation**: Proper email format validation
- **Duplicate Prevention**: Prevents duplicate SuperAdmin accounts
- **High-Security Hashing**: Uses bcrypt with 12 salt rounds for SuperAdmin passwords
- **Audit Logging**: All SuperAdmin creation activities are logged
- **Setup Guard**: Automatic redirection to setup when no SuperAdmin exists

## 🚀 Methods to Create SuperAdmin Accounts

### 1. Initial Setup Wizard (Recommended)

**When it appears:**
- Automatically shown when no SuperAdmin exists in the system
- Accessible at `/setup` route

**How it works:**
1. System checks if any SuperAdmin exists on app startup
2. If none found, users are redirected to the setup wizard
3. First SuperAdmin account is created through a secure form
4. Setup wizard becomes inaccessible after first SuperAdmin is created

**Features:**
- Real-time password strength indicators
- Form validation with user-friendly error messages
- Secure password confirmation
- Professional UI with loading states

### 2. Environment-Based Creation (Development)

**Configuration in `backend/config.env`:**
```env
CREATE_INITIAL_SUPERADMIN=true
SUPERADMIN_EMAIL=admin@ekahera.com
SUPERADMIN_PASSWORD=SuperAdmin123!
SUPERADMIN_NAME=System Administrator
```

**How it works:**
- SuperAdmin is created automatically during database initialization
- Only runs if `CREATE_INITIAL_SUPERADMIN=true`
- Skips creation if SuperAdmin already exists
- Ideal for development and testing environments

### 3. CLI Command (Manual Creation)

**Usage:**
```bash
cd backend
npm run create-superadmin
```

**Features:**
- Interactive command-line interface
- Hidden password input (shows asterisks)
- Real-time validation
- Shows existing SuperAdmins before creation
- Secure password requirements enforcement

### 4. SuperAdmin Invitation System

**API Endpoint:**
```
POST /api/auth/invite/superadmin
Authorization: Bearer <superadmin-token>
Content-Type: application/json

{
  "email": "newadmin@company.com",
  "name": "New Administrator"
}
```

**How it works:**
- Only existing SuperAdmins can create invitations
- Creates a pending SuperAdmin account
- Generates secure invitation token
- Returns setup URL for the invited user
- 24-hour expiration on invitations

## 📋 API Endpoints

### Check Setup Status
```
GET /api/auth/setup/status
Response: { "needsSetup": boolean }
```

### Create Initial SuperAdmin
```
POST /api/auth/setup/superadmin
Content-Type: application/json

{
  "name": "Administrator Name",
  "email": "admin@company.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!"
}
```

### Invite SuperAdmin (Requires SuperAdmin Role)
```
POST /api/auth/invite/superadmin
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newadmin@company.com",
  "name": "New Administrator"
}
```

## 🛡️ Security Best Practices Implemented

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*(),.?":{}|<>)

### Database Security
- Passwords hashed with bcrypt (12 salt rounds for SuperAdmins)
- Email uniqueness enforced at database level
- Role-based access control
- Audit logging for all SuperAdmin activities

### Frontend Security
- Client-side validation with server-side verification
- Real-time password strength indicators
- Secure form handling with proper error states
- Setup guard prevents unauthorized access

## 🔄 Setup Flow

1. **First Visit**: User visits any route
2. **Setup Check**: System checks if SuperAdmin exists
3. **Redirect**: If no SuperAdmin, redirect to `/setup`
4. **Setup Form**: User fills out SuperAdmin creation form
5. **Validation**: Strong password and email validation
6. **Creation**: SuperAdmin account created in database
7. **Success**: User redirected to login page
8. **Login**: SuperAdmin can now access the system

## 🚨 Error Handling

### Common Errors
- **"SuperAdmin already exists"**: Setup has already been completed
- **"Email already registered"**: Email is already in use
- **"Passwords do not match"**: Password confirmation failed
- **"Password does not meet requirements"**: Weak password

### Recovery Options
- Use CLI command to create additional SuperAdmins
- Check database directly for existing SuperAdmins
- Use environment variables for development setup

## 🔧 Development Setup

1. **Enable Auto-Creation** (Optional):
   ```env
   CREATE_INITIAL_SUPERADMIN=true
   SUPERADMIN_EMAIL=dev@localhost
   SUPERADMIN_PASSWORD=DevAdmin123!
   ```

2. **Start the Application**:
   ```bash
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

3. **Access Setup**: Visit `http://localhost:3000`

## 📝 Logging and Monitoring

All SuperAdmin activities are logged:
- SuperAdmin creation (initial setup)
- SuperAdmin invitations sent
- Login attempts
- System access

Logs can be viewed through the application's logging system.

## 🔍 Troubleshooting

### Setup Page Not Showing
- Check if SuperAdmin already exists in database
- Verify API endpoints are working (`/api/auth/setup/status`)
- Check browser console for JavaScript errors

### CLI Command Not Working
- Ensure you're in the `backend` directory
- Check database connection in `config.env`
- Verify all dependencies are installed (`npm install`)

### Environment Creation Not Working
- Check `CREATE_INITIAL_SUPERADMIN=true` in config.env
- Verify database initialization is enabled
- Check server logs for creation messages

## 🎯 Production Recommendations

1. **Disable Environment Creation**: Set `CREATE_INITIAL_SUPERADMIN=false`
2. **Use Setup Wizard**: Let first user create SuperAdmin through UI
3. **Enable Audit Logging**: Monitor all SuperAdmin activities
4. **Regular Security Reviews**: Periodically review SuperAdmin accounts
5. **Strong Password Policies**: Enforce password rotation policies
6. **Multi-Factor Authentication**: Consider adding MFA for SuperAdmins

## 📞 Support

For issues with SuperAdmin setup:
1. Check this documentation
2. Review server logs
3. Use CLI command as fallback
4. Contact system administrator

---

**Security Note**: SuperAdmin accounts have full system access. Only create them for trusted administrators and follow your organization's security policies.
