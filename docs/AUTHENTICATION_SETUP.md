# Authentication Setup and Troubleshooting

## Overview

This app uses Supabase for authentication with magic links (passwordless email authentication). This document explains the configuration and common issues.

## How Magic Link Authentication Works

1. User enters their email address
2. Backend calls Supabase to send a magic link (OTP - One-Time Password)
3. User receives email and clicks the magic link
4. Supabase verifies the OTP and redirects to our callback URL with an access token
5. Our backend decodes the JWT token and creates a session

## Important Configuration

### Supabase Dashboard Settings

**Critical settings to configure in your Supabase project:**

1. **Auth → URL Configuration**
   - Add your production URL to "Site URL"
   - Add your production URL to "Redirect URLs"
   - Example: `https://one-sweepstake-2.vercel.app/auth/verify`

2. **Auth → Email Templates**
   - The magic link template should redirect to `/auth/verify`
   - Default expiration is typically 1 hour (3600 seconds)

3. **Auth → Rate Limits**
   - If rate limits are too strict, users may experience failures
   - Consider adjusting for your use case

### Environment Variables

Required environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Common Issues and Solutions

### Issue 1: "Email link is invalid or has expired"

**Symptoms:**
- Error appears even 2-3 minutes after receiving the email
- User gets redirected to URL with `error=access_denied&error_code=otp_expired`

**Root Causes:**
1. **Magic link clicked multiple times** - OTPs are single-use tokens that are consumed on first click
2. **Email client preview** - Some email clients (Outlook, Gmail) may prefetch/preview links, consuming the OTP
3. **Security scanners** - Corporate email security tools may scan and consume the link
4. **Browser extensions** - Some extensions may prefetch links
5. **Actual expiration** - If Supabase OTP expiration is configured too short

**Solutions:**
1. **Educate users:**
   - Click the magic link only once
   - Avoid refreshing the page after clicking
   - Use the link promptly after receiving the email
   - If using corporate email, be aware of security scanners

2. **Supabase configuration:**
   - Check Auth settings in Supabase dashboard
   - Verify OTP expiration time is reasonable (default 1 hour)
   - Consider disabling link tracking in email templates

3. **Email provider settings:**
   - Some email services add link tracking that can consume OTPs
   - Consider using a plain text email template if issues persist

### Issue 2: Browser "locked" to one user

**Symptoms:**
- After signing in as User A, can't sign in as User B in the same browser
- Get OTP expiration errors when trying to switch users

**Root Cause:**
- Previously, the backend used `supabaseAdmin.auth.getUser()` which checked tokens against Supabase's session state
- This created browser-level session conflicts

**Solution:**
- ✅ **FIXED** - The backend now manually decodes and verifies JWT tokens without relying on Supabase session state
- The token verification is now completely stateless

### Issue 3: Display name defaults to null

**Symptoms:**
- If user closes the Profile Setup screen, their display name is saved as `null`
- User can't complete profile setup later

**Solution:**
- ✅ **FIXED** - New users now get a default display name generated from their email
- Example: `SamJamesLaw97@gmail.com` → `Sam James Law`
- Profile Setup screen pre-populates this default name for easy editing

## Architecture Details

### Token Flow

```
User → Email Input → Backend (sendMagicLink)
  ↓
Supabase sends email with OTP link
  ↓
User clicks link → Supabase verifies OTP
  ↓
If valid: Redirect to /auth/verify#access_token=...&type=magiclink
If invalid: Redirect to /auth/verify#error=access_denied&error_code=otp_expired
  ↓
Frontend (AuthVerify component):
  1. Checks for errors in URL hash
  2. Extracts access_token
  3. Calls backend verifyMagicLink endpoint
  ↓
Backend (verifyMagicLink):
  1. Decodes JWT token (stateless)
  2. Validates email, expiration, issuer
  3. Creates or retrieves user from database
  4. Generates default display name if new user
  5. Sets auth cookie
  6. Returns user info
  ↓
Frontend navigates to Profile Setup (new users) or Dashboard (existing users)
```

### Token Verification (Stateless Approach)

The backend verifies tokens by:
1. Decoding the JWT (format: `header.payload.signature`)
2. Parsing the payload to extract claims (email, exp, iss)
3. Validating:
   - Token hasn't expired (`exp` claim)
   - Email matches the user's claim
   - Issuer (`iss`) is our Supabase project URL
4. No session state checks - completely stateless

This approach prevents browser-specific session conflicts.

## Testing Authentication

### Test Scenarios

1. **Happy path:**
   - Request magic link
   - Check email immediately
   - Click link once
   - Should redirect to Profile Setup or Dashboard

2. **Expired link:**
   - Request magic link
   - Wait several minutes
   - Click link
   - Should show friendly error message with explanation

3. **Multiple users same browser:**
   - Sign in as User A
   - Sign out
   - Sign in as User B
   - Both should work without conflicts

4. **Profile setup:**
   - New user should see auto-generated display name
   - User should be able to edit and save
   - Display name should persist

## Monitoring and Debugging

### Enable Detailed Logging

Add logging to track authentication flow:

```typescript
// In auth router
console.log('Magic link requested for:', email);
console.log('Token verification for:', email);
console.log('User created/retrieved:', user.id);
```

### Check Supabase Logs

In Supabase Dashboard:
- Go to Logs → Auth Logs
- Look for failed OTP verifications
- Check for rate limit hits

### Common Error Codes

- `otp_expired` - Magic link expired or already used
- `access_denied` - General authentication failure
- `invalid_token` - Token format or signature invalid
- `email_mismatch` - Token email doesn't match claimed email

## Security Considerations

1. **JWT Secret:** Supabase JWT tokens are signed with your project's JWT secret
2. **Service Role Key:** Keep `SUPABASE_SERVICE_ROLE_KEY` secure - it bypasses Row Level Security
3. **HTTPS Only:** Always use HTTPS in production to prevent token interception
4. **Cookie Security:** Auth cookies are set with `HttpOnly`, `Secure`, and `SameSite=Lax`

## Future Improvements

Potential enhancements:
1. Add option for password-based authentication as fallback
2. Implement OAuth providers (Google, GitHub)
3. Add 2FA for enhanced security
4. Allow users to regenerate magic links if they expire
5. Add rate limiting on frontend to prevent abuse
