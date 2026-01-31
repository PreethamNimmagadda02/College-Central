## 2024-05-22 - Form Accessibility in Complex Components
**Learning:** Complex interactive components like `CGPAForecaster` often miss basic accessibility attributes (labels) for inputs that are visually implicit but programmatically disconnected.
**Action:** When auditing complex forms, explicitly check `htmlFor`/`id` associations and `aria-label` for inputs that lack visible text labels.

## 2024-05-24 - Status vs Alert Roles
**Learning:** For connectivity indicators, `role="alert"` is crucial for the "offline" state as it requires immediate attention, while `role="status"` with `aria-live="polite"` is better for the "back online" confirmation to avoid interrupting the user aggressively.
**Action:** Always differentiate between critical system states (alert) and informational updates (status) when implementing global notifications.
