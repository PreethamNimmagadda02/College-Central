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

## 2024-05-25 - Copy to Clipboard Feedback
**Learning:** When adding "Copy to Clipboard" functionality, visual feedback (icon change/tooltip) and keyboard accessibility (focus states on the button) are essential. Testing clipboard interactions requires mocking `navigator.clipboard.writeText` correctly in Jest/Vitest.
**Action:** Use a dedicated button with `aria-label`, handle the promise from `writeText`, and show temporary success state. In tests, use `vi.fn().mockResolvedValue(undefined)` for clipboard mocks to avoid timeouts.
