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

## 2025-10-28 - Client-Side Analytics Data Leak
**Vulnerability:** The `locationAnalytics` feature relies on the client fetching the entire collection to compute "crowd levels", requiring `read` access for all users to all location data.
**Learning:** Client-side aggregation of sensitive data (PII) forces insecure rules.
**Prevention:** Aggregation must happen server-side (Cloud Functions or scheduled jobs) writing to a public summary document. Do not expose raw event streams to clients.
