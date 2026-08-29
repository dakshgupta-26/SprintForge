# SprintForge Security & Authentication Audit

**Audit Date**: August 29, 2026  
**Audited Subsystems**: SprintForge Backend (Node.js/Express/TypeScript/MongoDB/Socket.IO) & Frontend (Next.js 16/React 19/Tailwind CSS/Zustand)

---

## Executive Summary

SprintForge provides modern agile project management with features including Scrum/Kanban boards, real-time presence, encrypted team chat, and email OTP verification. An in-depth security inspection of the codebase was conducted across 41 key security domains.

Prior to hardening, the platform exhibited good foundational implementations in bcrypt password hashing (cost factor 12), transactional email OTP hashing (SHA-256 with TTL index), and AES-256-CBC chat message encryption. However, several critical security gaps were identified:
1. Client-side authentication tokens stored in `localStorage` vulnerable to XSS exfiltration.
2. Absence of server-side `Session` tracking, active device management, and token revocation.
3. Lack of refresh token rotation and token reuse detection.
4. Broken Object Level Authorization (BOLA/IDOR) in notification deletion/marking and analytics routes.
5. Socket.IO connection and room joins trusting client-supplied identifiers without server validation.
6. Missing password reset / recovery mechanism.
7. Unsanitized NoSQL query inputs susceptible to operator injection.
8. Generic rate limiting that lacked specific brute-force and credential stuffing protections on login and OTP generation.

The sections below document the exact state of all security mechanisms categorized into **IMPLEMENTED**, **MISSING**, **PARTIALLY IMPLEMENTED**, **INSECURE**, **DUPLICATE**, and **NEEDS REFACTOR**.

---

## 1. Audit Matrix by Category

### IMPLEMENTED
- **Password Hashing**: `User.ts` uses `bcrypt.hash(password, 12)` in a pre-save hook. Passwords are never saved in plaintext.
- **Password Comparison**: `user.comparePassword(password)` method using `bcrypt.compare`.
- **OTP Generation & Hashing**: 6-digit cryptographically secure numeric OTPs generated via `crypto.randomInt(100000, 1000000)` and hashed using SHA-256 with salt at rest in `EmailVerificationChallenge`.
- **OTP Expiration (TTL Index)**: `EmailVerificationChallenge` has a MongoDB TTL index on `expiresAt` (10 minutes) for automatic database purging.
- **OTP Attempt Limiter**: Maximum 5 attempts enforced before challenge invalidation.
- **OTP Resend Cooldown**: 60-second cooldown enforced on server-side (`lastSentAt` check in `resendEmailOtp`).
- **Encrypted Team Chat**: AES-256-CBC encryption with unique IVs for project chat messages in `utils/crypto.ts` and `Message.ts`.
- **File Upload Type & Size Filtering**: Multer memory storage configured with 5MB size limit and MIME/extension whitelist for avatar uploads.
- **GridFS Avatar Storage**: Safe server-generated filenames (`avatar_{userId}_{timestamp}.ext`) stored in MongoDB GridFS instead of executable web directories.
- **Role-Based Access Control (RBAC)**: `requirePermission` middleware checks project membership and role permissions (`view`, `create`, `edit`, `delete`, `manage`).

---

### MISSING
- **Server-Side Session Management**: No `Session` model existed in MongoDB to track device type, browser, OS, IP address, creation time, last active timestamp, and revocation state.
- **Refresh Token Rotation & Token Family Tracking**: No rotating refresh token mechanism existed to detect and mitigate token theft.
- **Active Sessions API & UI**: No endpoints for `GET /api/auth/sessions`, `DELETE /api/auth/sessions/:id`, or `POST /api/auth/sessions/revoke-others`.
- **Password Reset Flow**: No `forgotPassword` or `resetPassword` endpoints or token models existed.
- **Security Audit Logging**: No database collection (`SecurityLog`) to capture login successes, failed attempts, password changes, and revocations for the user activity audit trail.
- **NoSQL Injection Sanitization Middleware**: No middleware was stripping `$` or `.` prefixed keys from incoming request bodies, queries, and params.
- **CSRF Protection**: No CSRF defense for cookie-based state-changing requests.

---

### PARTIALLY IMPLEMENTED
- **CORS Configuration**: CORS was present in `server.ts`, but allowed origin callback had a fallback `callback(null, true)` that allowed unlisted origins.
- **Security Headers**: `helmet` was imported with default settings and `crossOriginResourcePolicy: 'cross-origin'`, but lacked strict CSP, HSTS, and frame protections.
- **Rate Limiting**: Single global `rateLimiter` (100 req/15min) on `/api/auth`, lacking targeted brute-force limits for login (5 attempts / 15 min), OTP verification, and password reset.
- **Frontend Theme System**: `next-themes` and CSS variables configured with dark default and light mode variables, but account components had some hardcoded dark styles.

---

### INSECURE
- **Token Storage in `localStorage`**: Frontend `authStore.ts` and `api.ts` stored JWTs in browser `localStorage` (`sf_token`), exposing tokens to any script executing in the document context.
- **IDOR in Notifications**:
  - `PUT /api/notifications/:id/read` updated notification without checking `recipient: req.user._id`.
  - `DELETE /api/notifications/:id` deleted notification without checking `recipient: req.user._id`.
- **IDOR in Analytics**:
  - `GET /api/analytics/project/:projectId` and `GET /api/analytics/project/:projectId/team` did not apply `requirePermission('view')`, allowing any authenticated user to view analytics for any project ID.
- **Socket.IO Room Authorization**: Sockets could join any `project:${projectId}` room without server-side verification of project membership.
- **Account Enumeration on Login**: Failed login error revealed specifics rather than generic credentials error.

---

### DUPLICATE
- **Password Hashing Libraries**: Both `bcrypt` and `bcryptjs` were present in `backend/package.json`. Standardized on `bcryptjs` for consistent cross-platform execution without native compilation dependencies.

---

### NEEDS REFACTOR
- **Authentication Source of Truth**: Transition from Bearer token stored in `localStorage` to **HttpOnly secure cookies** (`sf_access_token` and `sf_refresh_token`) coupled with a MongoDB `Session` collection.
- **Centralized Error Handler**: Ensure database internals, Mongo error details, and stack traces are suppressed in production.
- **Frontend `api.ts` Interceptor**: Implement automatic silent refresh token rotation on 401 status codes.

---

## 2. Comprehensive Subsystem Audit

| Subsystem | Audit Status | Identified Vulnerabilities | Target Production Solution |
| :--- | :--- | :--- | :--- |
| **Authentication Routes** | Insecure | JWT in localStorage, no session model | HttpOnly cookies + Session model + silent refresh |
| **Password Hashing** | Pass | None (bcrypt cost 12 used) | Retain cost 12, enforce 8+ char password policy |
| **Session Tracking** | Missing | No DB session records | Mongo `Session` model with TTL index & device info |
| **Refresh Tokens** | Missing | No refresh tokens or rotation | SHA-256 hashed refresh tokens, rotation & reuse detection |
| **Cookies** | Insecure | No auth cookies configured | `HttpOnly: true, SameSite: 'lax', Secure: isProd, Path: '/'` |
| **Rate Limiting** | Partial | Weak generic limiter on `/api/auth` | Specific limiters for Login, OTP, Resend, and Reset |
| **OTP Security** | Pass | Plaintext storage avoided, TTL index present | Rate limit verify/resend endpoints, maintain 60s cooldown |
| **Email Verification** | Pass | OTP challenge model working | Seamlessly set HttpOnly cookies on successful OTP verify |
| **RBAC / Permissions** | Partial | Project routes protected, analytics missed | Apply `requirePermission('view')` to analytics & tasks |
| **IDOR / BOLA** | Insecure | Notifications & Analytics vulnerable | Add strict `recipient: req.user._id` & project checks |
| **NoSQL Injection** | Insecure | Raw objects accepted in queries | Add recursive `$`/`.` stripping sanitizer middleware |
| **CORS** | Partial | Permissive origin callback | Strict whitelist matching with `CLIENT_URL` |
| **CSRF Defense** | Missing | Cookie auth without CSRF header check | Double-submit / `X-Requested-With` header verification |
| **Security Headers** | Partial | Basic helmet setup | Helmet with CSP, HSTS, X-Content-Type-Options, Frameguard |
| **File Uploads** | Pass | Memory storage + GridFS + MIME check | Maintain safe filename hashing & 5MB size limit |
| **Password Reset** | Missing | No forgot password flow | Token-based reset with SHA-256 hash & 15m TTL |
| **Socket.IO** | Insecure | Unauthenticated handshake, unvalidated joins | Handshake JWT verify + project membership verification |
| **Audit Logging** | Missing | No security activity persistence | `SecurityLog` model for login/password/session events |
| **Account Center UI** | Partial | UI mockups for sessions & activity | Connect to real sessions & security audit trail APIs |
| **Error Handling** | Partial | Stack traces exposed in non-prod | Centralized production-safe error sanitizer |

---

## 3. Recommended Remediation Order
1. Install `cookie-parser` and setup `Session`, `PasswordResetToken`, `SecurityLog` models.
2. Implement sanitization, CSRF, targeted rate limiters, and cookie utilities.
3. Update `authController.ts` with cookie handling, session management, token rotation, password reset, and activity logs.
4. Fix IDOR in `notificationController.ts` and `analytics.ts`.
5. Secure Socket.IO handshake and project room joins in `socket/index.ts`.
6. Update frontend `api.ts`, `authStore.ts`, `SessionsTab.tsx`, `AccountActivityTab.tsx`, and `login/page.tsx`.
7. Execute automated security test suite and produce `SECURITY_STATUS.md`.
