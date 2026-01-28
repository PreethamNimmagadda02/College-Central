## 2024-05-22 - Form Accessibility in Complex Components
**Learning:** Complex interactive components like `CGPAForecaster` often miss basic accessibility attributes (labels) for inputs that are visually implicit but programmatically disconnected.
**Action:** When auditing complex forms, explicitly check `htmlFor`/`id` associations and `aria-label` for inputs that lack visible text labels.
