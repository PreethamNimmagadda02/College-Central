## 2024-05-23 - Offline Indicator Accessibility
**Learning:** Dynamic status messages like "You're offline" or "Back online" are often missed by screen readers if they lack `role="status"` or `aria-live`. Adding these attributes makes the app state much more transparent to non-visual users.
**Action:** Always wrap transient status messages in a live region or use `role="status"` to ensure they are announced when they appear in the DOM.
