## 2024-05-23 - Offline Indicator Accessibility
**Learning:** Dynamic status messages like "You're offline" or "Back online" are often missed by screen readers if they lack `role="status"` or `aria-live`. Adding these attributes makes the app state much more transparent to non-visual users.
**Action:** Always wrap transient status messages in a live region or use `role="status"` to ensure they are announced when they appear in the DOM.
## 2024-05-22 - Form Accessibility in Complex Components
**Learning:** Complex interactive components like `CGPAForecaster` often miss basic accessibility attributes (labels) for inputs that are visually implicit but programmatically disconnected.
**Action:** When auditing complex forms, explicitly check `htmlFor`/`id` associations and `aria-label` for inputs that lack visible text labels.
