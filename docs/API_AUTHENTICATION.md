# Lingkod-Ani API Authentication & Security Documentation

**Last Updated**: May 7, 2026  
**Document Version**: 1.0  
**Status**: Production Ready

## Table of Contents

1. [Authentication Overview](#authentication-overview)
2. [Firebase Authentication](#firebase-authentication)
3. [Authorization & Roles](#authorization--roles)
4. [API Endpoint Security](#api-endpoint-security)
5. [Session Management](#session-management)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Authentication Overview

Lingkod-Ani uses a **hybrid authentication model** combining:
- **Firebase Authentication** for user identity verification
- **Server-side Session Management** for persistent authenticated requests
- **Role-Based Access Control (RBAC)** for authorization
- **Fresh Token Validation** on sensitive operations

### Authentication Flow

```
1. User Login (Firebase)
   ├─ User enters credentials
   ├─ Firebase verifies identity
   └─ Returns Firebase ID Token

2. Server Session Creation
   ├─ API validates Firebase ID token
   ├─ Creates secure HTTP-only session cookie
   └─ Stores session in Firestore

3. Authenticated Request
   ├─ Client sends request with session cookie
   ├─ Server validates session
   ├─ Checks user role & permissions
   └─ Executes authorized action

4. Fresh Token Validation (Sensitive Operations)
   ├─ Request requires fresh Firebase ID token
   ├─ Token age verified (max 5 minutes old)
   └─ Operation proceeds only if token is fresh
```

---

## Firebase Authentication

### Setup Requirements

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lingkod-ani.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lingkod-ani
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lingkod-ani.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>
```

### Supported Authentication Methods

1. **Email/Password** - Primary method for staff (barangay workers, developers)
2. **Phone/SMS** - Farmer registration via SMS (future enhancement)
3. **Anonymous** - Demo mode access only

### Token Management

```typescript
// Firebase ID Token properties
interface FirebaseIdToken {
  iss: string;           // Issuer (Firebase)
  aud: string;           // Audience (Project ID)
  auth_time: number;     // Authentication timestamp
  user_id: string;       // Unique user ID (uid)
  sub: string;           // Subject (uid)
  iat: number;           // Issued at timestamp
  exp: number;           // Expiration timestamp (1 hour)
  email: string;         // User email
  email_verified: boolean; // Email verification status
  firebase: {
    identities: {};
    sign_in_provider: string;
  };
}

// Token validity: 1 hour (3600 seconds)
// Auto-refresh: Handles transparently by Firebase SDK
```

---

## Authorization & Roles

### Role Hierarchy

```
Admin (Developer)
  ├─ Full system access
  ├─ Can manage all users
  ├─ Can access audit logs
  └─ Can modify security settings

Staff (Barangay)
  ├─ Dashboard access
  ├─ SMS management
  ├─ Case management
  ├─ Knowledge base access
  └─ Cannot modify users/settings

Farmer
  ├─ SMS-only access
  ├─ Profile management
  ├─ Case tracking
  └─ Knowledge base queries

Unverified
  └─ Registration only
```

### User Profile Structure

```typescript
interface UserProfile {
  uid: string;                    // Firebase UID
  email: string;                  // Email address
  role: 'developer' | 'barangay' | 'farmer';
  title?: string;                 // Job title (e.g., "AEW", "Barangay Administrator")
  permissions: {
    canCreateCases: boolean;
    canEditCases: boolean;
    canDeleteCases: boolean;
    canManageUsers: boolean;
    canAccessAnalytics: boolean;
    canExportData: boolean;
    canModifySettings: boolean;
  };
  barangay?: string;              // Barangay name (for filtering)
  createdAt: Timestamp;
  lastLogin: Timestamp;
  isActive: boolean;
}
```

### Firestore Rules - RBAC Implementation

All Firestore security rules are implemented in [`firestore.rules`](../firestore.rules) with the following key patterns:

#### Developer Access
```firestore
function isDeveloper() {
  return currentUserRole() == 'developer';
}

match /admin/{document=**} {
  allow read, write: if isDeveloper();
}
```

#### Barangay-Level Isolation
```firestore
function isBarangayStaff() {
  return currentUserRole() == 'barangay';
}

function hasBarangayAccess(barangayName) {
  return isBarangayStaff() && 
         currentUserProfile().barangay == barangayName;
}

match /cases/{barangayName}/{document=**} {
  allow read, write: if hasBarangayAccess(barangayName);
}
```

#### Farmer-Level Isolation
```firestore
function isFarmer() {
  return currentUserRole() == 'farmer';
}

match /farmer-profiles/{userId}/{document=**} {
  allow read, write: if request.auth.uid == userId || isDeveloper();
}
```

---

## API Endpoint Security

### Authentication Patterns

#### 1. Public Endpoints (No Auth Required)
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/knowledge/search` - Public knowledge queries (limited)

#### 2. Server-Request Protected (Session Cookie)
Most interactive endpoints use server-side session validation:

```typescript
// Protected endpoint example
export async function POST(request: NextRequest) {
  // Authenticate the request
  const session = await authenticateServerRequest(request);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check authorization
  if (session.role !== 'barangay' && session.role !== 'developer') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  // Process the request
  // ...
}
```

**Endpoints Using This Pattern**:
- `/api/sms-cases/*` - Case management
- `/api/knowledge/*` - Knowledge base operations
- `/api/account/*` - User account operations
- `/api/data-center/*` - Data management

#### 3. Fresh Token Required (Sensitive Operations)
Critical operations require a fresh Firebase ID token (max 5 minutes old):

```typescript
export async function POST(request: NextRequest) {
  // Authenticate with fresh token requirement
  const session = await authenticateInteractiveRequest(request);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication failed or token expired' },
      { status: 401 }
    );
  }

  // Process sensitive operation
  // ...
}
```

**Endpoints Using This Pattern**:
- `POST /api/account/update-profile` - Profile updates
- `POST /api/account/change-password` - Password changes
- `POST /api/account/avatar-upload` - Avatar uploads
- `DELETE /api/sms-cases/*` - Case deletion
- `POST /api/data-center/export` - Data exports

---

## Session Management

### Server-Side Session

#### Session Creation
1. User logs in with Firebase credentials
2. Frontend obtains Firebase ID token
3. Frontend sends token to `/api/auth/login`
4. Server validates token using Firebase Admin SDK
5. Server creates secure session cookie
6. Client receives session cookie in response

#### Session Validation

```typescript
// Session validation helper
async function authenticateServerRequest(request: NextRequest) {
  try {
    // Get session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }

    // Verify session with Firebase Admin
    const decodedClaims = await admin.auth().verifySessionCookie(
      sessionCookie,
      true // Check revocation
    );

    // Fetch user profile from Firestore
    const userDoc = await admin
      .firestore()
      .collection('users')
      .doc(decodedClaims.uid)
      .get();

    if (!userDoc.exists) {
      return null;
    }

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      ...userDoc.data()
    };
  } catch (error) {
    return null;
  }
}
```

#### Session Expiration
- **Default Duration**: 5 days
- **Inactivity Timeout**: 2 hours
- **Automatic Refresh**: Session auto-extends on activity
- **Manual Logout**: Revokes all sessions

#### Session Cookie Security

```typescript
const sessionCookie = await admin.auth().createSessionCookie(
  idToken,
  {
    expiresIn: 5 * 24 * 60 * 60 * 1000, // 5 days
  }
);

response.cookies.set({
  name: 'session',
  value: sessionCookie,
  httpOnly: true,        // Cannot be accessed by JavaScript
  secure: true,          // HTTPS only
  sameSite: 'strict',    // CSRF protection
  maxAge: 5 * 24 * 60 * 60, // 5 days
  path: '/',
});
```

### Fresh Token Validation

For sensitive operations, require fresh Firebase ID token:

```typescript
async function authenticateInteractiveRequest(request: NextRequest) {
  try {
    // Get authorization header with Firebase ID token
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const idToken = authHeader.slice(7); // Remove "Bearer "

    // Verify token is fresh (max 5 minutes old)
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    const issuedAtSeconds = decodedToken.iat;
    const currentSeconds = Math.floor(Date.now() / 1000);
    const ageSeconds = currentSeconds - issuedAtSeconds;
    
    const MAX_TOKEN_AGE_SECONDS = 5 * 60; // 5 minutes
    
    if (ageSeconds > MAX_TOKEN_AGE_SECONDS) {
      return null; // Token too old
    }

    // Token is fresh, process request
    return decodedToken;
  } catch (error) {
    return null;
  }
}
```

---

## Security Best Practices

### 1. Credential Handling

✅ **DO:**
- Store credentials in environment variables
- Use `.env.local` (never committed to version control)
- Rotate service account keys regularly
- Use separate credentials for dev/staging/production

❌ **DON'T:**
- Commit `.env.local` to Git
- Log credentials or sensitive data
- Share credentials via email or chat
- Use the same credentials across environments

### 2. Token Security

✅ **DO:**
- Validate token signature using Firebase Admin SDK
- Check token expiration
- Verify token issuer matches your project
- Refresh tokens before expiration

❌ **DON'T:**
- Trust tokens without verification
- Store sensitive data in token claims
- Send tokens in URL parameters
- Cache tokens indefinitely

### 3. API Security

✅ **DO:**
- Use HTTPS for all API requests
- Include CSRF tokens on form submissions
- Validate input on both client and server
- Rate limit authentication endpoints
- Log security events for audit trails

❌ **DON'T:**
- Trust client-side validation alone
- Accept credentials in URL parameters
- Log sensitive data (passwords, tokens)
- Allow CORS from untrusted origins

### 4. Database Security

✅ **DO:**
- Use Firestore security rules for access control
- Validate permissions server-side before database operations
- Encrypt sensitive data in transit
- Regular security audits of database rules

❌ **DON'T:**
- Give clients direct database write access
- Store passwords in plain text
- Skip server-side authorization checks
- Use overly permissive Firestore rules

### 5. Audit & Monitoring

✅ **DO:**
- Log all authentication attempts
- Monitor failed login attempts
- Track sensitive operations (deletes, exports)
- Review audit logs regularly

❌ **DON'T:**
- Ignore suspicious login patterns
- Leave audit logs unmonitored
- Delete audit logs prematurely
- Fail to investigate security alerts

---

## Troubleshooting

### Common Authentication Issues

#### 1. "Unauthorized" on Protected Routes
**Symptom**: 401 error on authenticated endpoints  
**Causes**:
- Session cookie missing or expired
- Firebase token invalid or revoked
- User profile missing in Firestore

**Solutions**:
```bash
# Check if session cookie is present:
# In browser DevTools → Application → Cookies → session

# Verify user profile in Firestore:
# Firebase Console → Firestore → users/{uid}

# Try logging out and back in to refresh session
```

#### 2. "Forbidden" on Authorized Routes
**Symptom**: 403 error despite being logged in  
**Causes**:
- User role doesn't have required permission
- Barangay-level access restrictions
- User marked as inactive

**Solutions**:
```bash
# Check user role in Firestore:
# users/{uid} → role field

# Verify barangay assignment matches data:
# users/{uid} → barangay field

# Confirm user is active:
# users/{uid} → isActive: true
```

#### 3. Firebase Token Expired
**Symptom**: Sensitive operations fail with "token expired"  
**Cause**: Interactive request token is older than 5 minutes

**Solution**:
```typescript
// Refresh the Firebase token before sensitive operations:
const user = auth.currentUser;
const freshIdToken = await user?.getIdToken(true); // Force refresh
// Send request with fresh token
```

#### 4. Session Cookie Issues
**Symptom**: Session persists after logout or doesn't persist across tabs  
**Causes**:
- Session cookie misconfiguration
- Private browsing mode (blocks cookies)
- Third-party cookie restrictions

**Solutions**:
```bash
# Verify cookie settings:
# Check sameSite, secure, httpOnly flags

# Test in normal (non-private) browsing mode

# Check browser privacy settings allow first-party cookies
```

---

## Rate Limiting

Authentication endpoints are rate-limited to prevent brute-force attacks:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/login` | 5 attempts | 15 minutes |
| `POST /api/auth/signup` | 3 attempts | 1 hour |
| `POST /api/auth/reset-password` | 3 attempts | 1 hour |
| `POST /api/auth/verify-email` | 10 attempts | 1 hour |

---

## Compliance & Standards

- **NIST Cybersecurity Framework**: Followed in authentication design
- **OWASP Top 10**: Protections against injection, broken auth, sensitive data exposure
- **RA 10173 (Philippine Data Privacy Act)**: User data protection implemented
- **Firebase Security Best Practices**: Official recommendations followed

---

## Emergency Procedures

### Suspected Breach

1. **Immediate Actions**:
   - Disable affected user account
   - Revoke all active sessions
   - Check audit logs for unauthorized access

2. **Investigation**:
   - Review authentication logs
   - Identify compromised data
   - Trace incident timeline

3. **Recovery**:
   - Reset user passwords
   - Rotate service account credentials
   - Deploy security patches if needed

### Credential Rotation

```bash
# For Firebase service account:
# 1. Generate new key in Firebase Console
# 2. Update environment variables
# 3. Redeploy application
# 4. Delete old key after confirmation

# For API keys:
# 1. Generate new key
# 2. Update .env.local
# 3. Restart application
# 4. Delete old key
```

---

## Support & Questions

For security concerns or authentication issues:

1. **Documentation**: Review this guide
2. **Issues**: Check app logs in Firebase Console
3. **Contact**: Document in security incident log

---

**Document Hash**: `auth-docs-2026-05-07`  
**Next Review**: May 7, 2027
