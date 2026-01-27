# Sentinel's Journal 🛡️

## 2025-10-26 - Broken Access Control in Storage Rules
**Vulnerability:** The `hero-images` path in Firebase Storage allowed any authenticated user to write and delete files. The rules explicitly stated that admin validation was "enforced at the application layer", which is insecure as it can be bypassed by direct API calls.
**Learning:** Client-side checks are never a replacement for server-side security rules. Even if a feature is only exposed in the Admin UI, the underlying storage bucket is accessible to anyone with valid credentials unless protected by rules.
**Prevention:** Always enforce role-based access control (RBAC) in `storage.rules`. Use `firestore.get()` to cross-reference user roles from the database if custom claims are not available.

## 2025-10-26 - Admin Email List Exposure
**Vulnerability:** The list of admin emails was stored in a publicly readable `appConfig` collection, exposing sensitive information and potential targets for phishing.
**Learning:** Security by obscurity (hiding the list in UI but making it public in DB) is not security. Client-side promotion logic (checking if user is in a list) is insecure and prone to spoofing.
**Prevention:** Store sensitive configuration in a restricted `privateConfig` collection. Use server-side validation (Firestore Rules) to enforce role assignments based on this secure list, rather than trusting the client.
