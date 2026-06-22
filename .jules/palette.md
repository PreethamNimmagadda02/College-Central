## 2024-05-23 - Offline Indicator Accessibility
**Learning:** Dynamic status messages like "You're offline" or "Back online" are often missed by screen readers if they lack `role="status"` or `aria-live`. Adding these attributes makes the app state much more transparent to non-visual users.
**Action:** Always wrap transient status messages in a live region or use `role="status"` to ensure they are announced when they appear in the DOM.
## 2024-05-22 - Form Accessibility in Complex Components
**Learning:** Complex interactive components like `CGPAForecaster` often miss basic accessibility attributes (labels) for inputs that are visually implicit but programmatically disconnected.
**Action:** When auditing complex forms, explicitly check `htmlFor`/`id` associations and `aria-label` for inputs that lack visible text labels.

## 2024-05-24 - Status vs Alert Roles
**Learning:** For connectivity indicators, `role="alert"` is crucial for the "offline" state as it requires immediate attention, while `role="status"` with `aria-live="polite"` is better for the "back online" confirmation to avoid interrupting the user aggressively.
**Action:** Always differentiate between critical system states (alert) and informational updates (status) when implementing global notifications.
## 2024-05-23 - Interactive Card Patterns
**Learning:** Animated cards (using `motion.div`) often act as buttons but lack semantic HTML and keyboard accessibility. Refactoring to `motion.button` retains animation capabilities while providing native accessibility (focus, enter/space activation).
**Action:** Replace clickable `div`s with `button`s in grid layouts, ensuring `w-full text-left` classes are added to maintain visual alignment.

## 2025-02-12 - Implicit Labels in Date/Time Ranges
**Learning:** When using a single visual label for a group of inputs (like "Time Range" for start/end times), the individual inputs lack accessible names for screen readers.
**Action:** Always add explicit `aria-label` attributes (e.g., "Start time", "End time") to inputs that share a group label but lack individual visible labels.
