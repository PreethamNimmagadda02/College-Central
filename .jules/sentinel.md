# Sentinel's Journal 🛡️

## 2025-10-26 - Broken Access Control in Storage Rules
**Vulnerability:** The `hero-images` path in Firebase Storage allowed any authenticated user to write and delete files. The rules explicitly stated that admin validation was "enforced at the application layer", which is insecure as it can be bypassed by direct API calls.
**Learning:** Client-side checks are never a replacement for server-side security rules. Even if a feature is only exposed in the Admin UI, the underlying storage bucket is accessible to anyone with valid credentials unless protected by rules.
**Prevention:** Always enforce role-based access control (RBAC) in `storage.rules`. Use `firestore.get()` to cross-reference user roles from the database if custom claims are not available.

## 2025-10-26 - Admin Email List Exposure
**Vulnerability:** The list of admin emails was stored in a publicly readable `appConfig` collection, exposing sensitive information and potential targets for phishing.
**Learning:** Security by obscurity (hiding the list in UI but making it public in DB) is not security. Client-side promotion logic (checking if user is in a list) is insecure and prone to spoofing.
**Prevention:** Store sensitive configuration in a restricted `privateConfig` collection. Use server-side validation (Firestore Rules) to enforce role assignments based on this secure list, rather than trusting the client.

## 2025-10-27 - Missing Tenant Isolation in Firestore
**Vulnerability:** The application relied on client-side checks to restrict access to users from a specific email domain (e.g., `@iitism.ac.in`). Firestore rules only checked `request.auth != null`, allowing any authenticated user (including those from personal Gmail accounts) to read sensitive data like user directories and analytics.
**Learning:** Authentication != Authorization. Just because a user is logged in via Google doesn't mean they belong to the organization. Multi-tenant or restricted apps must enforce domain boundaries at the database level.
**Prevention:** Implement `isAuthorizedDomain()` in `firestore.rules` to cross-reference the user's email domain against a secured configuration document before granting access.

## 2025-10-27 - Missing Content Security Policy
**Vulnerability:** The application lacked a `Content-Security-Policy` (CSP) meta tag, leaving it vulnerable to Cross-Site Scripting (XSS) and data injection attacks by allowing resources to be loaded from any origin.
**Learning:** Modern frontend tooling (like Vite) does not enforce CSP by default. Developers often focus on functional permissions (like Firebase Rules) and overlook browser-level security boundaries, assuming the build process handles security.
**Prevention:** Always explicitly define allowed content sources using a CSP meta tag in `index.html` or HTTP headers. Start with a restrictive policy (`default-src 'self'`) and whitelist strictly necessary external services (e.g., Firebase, Google Maps).
## 2025-10-28 - Client-Side Analytics Data Leak
**Vulnerability:** The `locationAnalytics` feature relies on the client fetching the entire collection to compute "crowd levels", requiring `read` access for all users to all location data.
**Learning:** Client-side aggregation of sensitive data (PII) forces insecure rules.
**Prevention:** Aggregation must happen server-side (Cloud Functions or scheduled jobs) writing to a public summary document. Do not expose raw event streams to clients.
## 2025-10-28 - Exposure of Admin Credentials via Source Control
**Vulnerability:** The `serviceAccountKey.json` file, required by `scripts/addAdmin.ts` for admin privilege escalation, was missing from `.gitignore`. This file contains sensitive Firebase Admin SDK credentials which, if committed, would grant full database access to anyone with the repository.
**Learning:** Utility scripts often require high-privilege credentials that are not needed by the main application. Documentation or scripts instructing developers to create/download these keys must be paired with immediate `.gitignore` updates.
**Prevention:** Audit all scripts in the `scripts/` directory for credential usage. Ensure any file paths used for secrets are explicitly ignored in `.gitignore` before the script is even written.

## 2025-10-29 - Firestore Collection Query Permissions
**Vulnerability:** Attempting to restrict read access to specific documents (e.g., `superAdmins`) within a public collection (`appConfig`) can cause client-side applications to break if they fetch the entire collection (e.g., `db.collection('appConfig').onSnapshot()`).
**Learning:** Firestore security rules filter data *before* returning it. If a client query requests a set of documents (like "all in collection") and *any* of them are denied by rules, the *entire query* fails with "Missing or insufficient permissions". You cannot rely on rules to simply "filter out" hidden documents from a broad query.
**Prevention:** Structure data such that public and private data are in separate collections (e.g., `appConfig` vs `privateConfig`). If mixed, the client MUST use filtered queries (e.g., `.where('public', '==', true)`) matching the rule constraints.
