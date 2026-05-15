# Authentication Setup and Troubleshooting

## Overview

This app uses Supabase for passwordless authentication with 6-digit email OTP (One-Time Password) codes. This approach is more reliable than magic links, especially for corporate email environments with security scanners.

## How OTP Code Authentication Works

1. User enters their email address on the landing page
2. Backend calls Supabase to generate and send a 6-digit OTP code
3. User receives the code via email (valid for 1 hour)
4. User enters the code on the same page
5. Backend verifies the code with Supabase
6. If valid, creates a session and the user is signed in

## Why OTP Codes Instead of Magic Links?

**Magic links had issues:**

- Corporate email security scanners would consume the link before users could click it
- Links could only be used once, causing confusion if clicked multiple times
- Browser-level session conflicts when switching users

**OTP codes solve these problems:**

- ✅ Security scanners can't "consume" a code by scanning the email
- ✅ Works reliably with all email clients and corporate security tools
- ✅ Familiar UX (like 2FA codes from Google, GitHub, etc.)
- ✅ Can be easily copied/pasted from email
- ✅ Clear 1-hour expiration time

## Important Configuration

### Supabase Dashboard Settings

**Critical settings to configure in your Supabase project:**

1. **Auth → Email Auth**
   - Enable "Enable Email Signup"
   - Set "Email OTP Expiration" to 3600 seconds (1 hour)

2. **Auth → Email Templates**
   - Update the "Magic Link" template with the provided `template.html`
   - The template uses `{{ .Token }}` variable to display the 6-digit code
   - Make sure the template is set to "Email OTP" type

3. **Auth → Rate Limits**
   - Configure appropriate rate limits to prevent abuse
   - Recommended: 3-5 attempts per hour per email

### Environment Variables

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Common Issues and Solutions

### Issue 1: "Invalid or expired code"

**Symptoms:**

- User enters the code but gets an error message
- Code was entered correctly but verification fails

**Root Causes:**

1. **Code has expired** - Codes expire after 1 hour
2. **Code already used** - OTP codes are single-use
3. **Typo in code** - User mistyped the 6-digit code
4. **Rate limiting** - Too many failed attempts

**Solutions:**

1. Click "Resend code" to get a fresh code
2. Make sure to enter all 6 digits
3. Check email for the most recent code (older codes may be invalid)
4. Wait a few minutes if rate limited, then try again

### Issue 2: Not receiving the email

**Symptoms:**

- Code email doesn't arrive
- Significant delay in receiving the email

**Solutions:**

1. **Check spam folder** - OTP emails sometimes get flagged
2. **Verify email address** - Make sure the email is spelled correctly
3. **Wait a minute** - Email delivery can sometimes be delayed
4. **Check Supabase logs** - Look for email delivery errors in Supabase dashboard
5. **Whitelist sender** - Add the Supabase sender address to your contacts

### Issue 3: Display name defaults to generated value

**Symptoms:**

- New user's display name is auto-generated from their email
- User wants to change it

**Solution:**

- ✅ **Expected behavior** - New users get a default display name (e.g., "sam.james.law97@gmail.com" → "Sam James Law")
- Profile Setup screen pre-populates this name for easy editing
- Users can change it during profile setup or later in settings

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
FronAuthentication Flow

```

User → Email Input (LandingPage)
↓
Backend (sendOtpCode) → Supabase generates 6-digit code
↓
Supabase sends email with code
↓
User receives email, enters code on same page
↓
Backend (verifyOtpCode):

1. Verifies code with Supabase
2. Creates or retrieves user from database
3. Generates default display name if new user
4. Sets auth cookie
5. Returns user info
   ↓
   Frontend navigates to Profile Setup (new users) or Dashboard (existing users)

```

### Code Verification (Stateless Approach)

The backend verifies codes by:
1. Calling `supabaseAdmin.auth.verifyOtp()` with the email and code
2. Supabase validates the code server-side
3. If valid, returns user data
4. Backend creates/retrieves user in local database
5. Issues JWT session cookie
6. No client-side token management needed

This approach is completely stateless and prevents browser-specific conflicts.

### Single-Page Flow
Enter email address
   - Receive code email immediately
   - Enter code correctly
   - Should navigate to Profile Setup or Dashboard

2. **Expired code:**
   - Request code
   - Wait over 1 hour
   - Try to use code
   - Should show "Invalid or expired code" error
   - Click "Resend code" to get a fresh one

3. **Multiple users same browser:**
   - Sign in as User A, then sign out
   - Sign in as User B
   - Both should work without conflicts

4. **Resend functionality:**
   - Request code
   - Click "Resend code" before entering first code
   - Old code should be invalid, new code should work

5. **Profile setup:**
   - New user should see auto-generated display name
   - User should be able to edit and save
   - Display name should persist

6. **Wrong code:**
   - Enter incorrect 6-digit code
   - Should show error message
   - Should bOTP code requested for:', email);
console.log('Code verification attempt for:', email);
console.log('User created/retrieved:', user.id);
```

### Check Supabase Logs

In Supabase Dashboard:

- Go to Logs → Auth Logs
- Look for failed OTP verifications
- Check for rate limit hits
- Monitor email delivery success rate

## Security Considerations

1. **JWT Secret:** Keep `JWT_SECRET` secure - used to sign session tokens
2. **Service Role Key:** Keep `SUPABASE_SERVICE_ROLE_KEY` secure - bypasses Row Level Security
3. **HTTPS Only:** Always use HTTPS in production to prevent token interception
4. **Cookie Security:** Auth cookies are set with `HttpOnly`, `Secure`, and `SameSite=Lax`
5. **Rate Limiting:** Supabase provides built-in rate limiting for OTP requests
6. **Code Expiration:** 1-hour expiration balances security and usability

## Email Template Setup

The `template.html` file should be uploaded to Supabase:

1. Go to **Authentication → Email Templates** in Supabase dashboard
2. Select the template you want to update (likely "Magic Link" or "Email OTP")
3. Replace the HTML with the contents of `template.html`
4. Make sure to use `{{ .Token }}` to display the 6-digit code
5. Set expiration messaging to match your configuration (1 hour)
6. Test the template by sending yourself a code

## Future Improvements

Potential enhancements:

1. Add rate limiting on frontend to provide better UX
2. Implement OAuth providers (Google, GitHub) as alternatives
3. Add 2FA for enhanced security (additional code after initial login)
4. Allow users to set up trusted devices
5. Add email verification status indicator
6. Implement account recovery flow

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
