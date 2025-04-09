# Esoteric Oracle - Secure Session Management

This document outlines the secure session management implementation for the Esoteric Oracle web application, which provides robust authentication, session handling, and user preference persistence.

## Architecture Overview

The Esoteric Oracle application uses a comprehensive session management system with the following components:

1. **Authentication Service** - Core service for authentication operations
2. **Auth Provider** - React context provider for auth state management
3. **Session Manager** - Manages session expiry and automatic refreshing
4. **Activity Monitor** - Tracks user activity and handles session timeouts
5. **Cookie Manager** - Secure cookie utilities for data persistence
6. **User Preferences** - User-specific settings stored securely
7. **Security Middleware** - Protects routes and enforces authentication

## Security Features

### 1. Secure Cookie Management

Cookies are created with the following security measures:

- **HttpOnly** - Auth tokens are protected from JavaScript access
- **Secure** - In production, cookies are only sent over HTTPS
- **SameSite=Lax** - Protects against CSRF attacks while allowing normal navigation
- **Path** - Set appropriately to limit cookie scope
- **Expiration** - Managed based on user preferences and activity

### 2. Session Timeouts & Activity Monitoring

Multiple session timeout mechanisms:

- **Absolute timeout** - Sessions expire after a fixed period (configurable: 1, 7, or 30 days)
- **Inactivity timeout** - Sessions expire after a period of inactivity (20 minutes by default)
- **Sliding expiration** - Session timeout extends with user activity
- **Warning system** - Users are warned before session expiration

### 3. XSS & CSRF Protection

- **Content Security Policy (CSP)** - Restricts resource loading to prevent XSS
- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **X-Frame-Options: DENY** - Prevents clickjacking
- **X-XSS-Protection: 1; mode=block** - Enables browser XSS filtering
- **CSRF tokens** - Protect against cross-site request forgery

### 4. Token Management

- **Access Token** - Short-lived token (1 hour) for authentication
- **Refresh Token** - Longer-lived token for obtaining new access tokens
- **Automatic token refreshing** - Without disrupting the user experience
- **Token storage** - Properly secured in HttpOnly cookies

## How It Works

### Authentication Flow

1. User logs in with email/password
2. Supabase authenticates and returns session tokens
3. Tokens are stored in secure HttpOnly cookies
4. Auth provider updates the global auth state
5. User is redirected to the protected area

### Session Management

1. Session expiry times are set based on user preferences
2. Session Manager regularly checks token expiry and refreshes when needed
3. Activity Monitor tracks user interactions and manages inactivity timeouts
4. Warning dialogs appear before session expiration
5. User can extend the session or log out

### User Preferences

1. User preferences are stored in cookies (non-sensitive data)
2. Preferences include theme, notifications, history tracking, and session duration
3. Changes are persisted immediately and loaded on application startup

## Implementation Details

### Key Components

1. **lib/auth-service.ts**
   - Core authentication functions (login, logout, token management)
   - Session handling and token refreshing

2. **components/auth-provider.tsx**
   - React context for authentication state
   - Provides auth state to the entire application

3. **components/session-manager.tsx**
   - Monitors session expiry
   - Handles automatic token refreshing
   - Shows session expiry warnings

4. **components/activity-monitor.tsx**
   - Tracks user activity
   - Handles inactivity timeout
   - Shows inactivity warnings

5. **lib/cookie-utils.ts**
   - Secure cookie management
   - Handles reading, writing, and deleting cookies with proper security settings

6. **middleware.ts**
   - Protects routes
   - Enforces authentication
   - Adds security headers

### Session Timeout Configuration

Session timeouts are configurable through user preferences:

- **Short**: 1 day
- **Medium**: 7 days (default)
- **Long**: 30 days

Additionally, inactivity timeout is set to 20 minutes by default.

## Security Best Practices

1. **Defense in Depth**
   - Multiple security layers work together
   - No single point of failure

2. **Principle of Least Privilege**
   - Cookies have minimal necessary permissions
   - HttpOnly when JavaScript access isn't needed

3. **Secure Defaults**
   - Security settings are secure by default
   - Users must explicitly choose less secure options

4. **Privacy by Design**
   - Minimal data collection
   - User control over data storage preferences

## Testing

To test the session management:

1. **Session Expiration**
   - Login and check the session expiry time in development mode
   - Wait for the session to approach expiry
   - Confirm the warning dialog appears
   - Test both extending the session and logging out

2. **Inactivity Timeout**
   - Login and remain inactive for 15+ minutes
   - Verify the inactivity warning appears
   - Test both continuing the session and ending it
   - If continuing, verify the timeout resets

3. **Token Refresh**
   - Use browser developer tools to monitor network requests
   - Observe token refresh operations occurring automatically
   - Verify the session continues uninterrupted

4. **Remember Me**
   - Test login with "Remember me" checked
   - Close the browser and reopen
   - Verify you're still logged in (in supported browsers)
   - Repeat with "Remember me" unchecked

5. **Concurrent Sessions**
   - Login on multiple devices/browsers
   - Verify sessions work independently
   - Test logout on one device and confirm it doesn't affect others

## Performance Considerations

The session management system is designed with performance in mind:

1. **Efficient Checks**
   - Token checks are performed at appropriate intervals
   - Activity monitoring uses passive events with debouncing

2. **Lazy Loading**
   - Components load only when needed
   - Authentication state is hydrated efficiently

3. **Storage Optimization**
   - Minimal cookie sizes
   - Appropriate caching strategies

4. **Network Efficiency**
   - Token refreshes only when necessary
   - Batch operations when possible

## Debugging and Monitoring

For development purposes, the application includes:

1. **Session Debug Panel**
   - Shows current session status
   - Displays token expiry times
   - Shows recent authentication events

2. **Logging**
   - Comprehensive logs for authentication events
   - Clear error messages for troubleshooting

3. **Cookie Inspector**
   - Tool to examine and debug cookie state
   - Helps diagnose authentication issues

## Scalability

The session management architecture is designed to scale:

1. **Stateless Authentication**
   - Token-based authentication doesn't require server-side session storage
   - Supports horizontal scaling and load balancing

2. **Distributed Sessions**
   - Sessions work across multiple servers
   - No central session store required

3. **Configurable Parameters**
   - Timeout durations can be adjusted based on load
   - Refresh strategies can be optimized for traffic patterns

## Compliance

This implementation helps meet key compliance requirements:

1. **GDPR**
   - User consent for cookies
   - Control over data storage
   - Clear session management

2. **OWASP Top 10**
   - Protection against session fixation
   - Mitigation for XSS and CSRF
   - Proper authentication controls

3. **PCI DSS**
   - Secure session handling
   - Appropriate timeout controls
   - Proper authentication practices

## Roadmap

Future enhancements to the session management system:

1. **Multi-Factor Authentication**
   - Integration with various second factors
   - Adaptive MFA based on risk assessment

2. **Session Analytics**
   - Insights into session patterns
   - Anomaly detection for security

3. **Cross-Device Synchronization**
   - Better handling of multiple active sessions
   - Ability to view and manage all active sessions

4. **Enhanced Biometric Support**
   - Integration with WebAuthn and FIDO2
   - Support for platform biometrics

1. **Session Expiration