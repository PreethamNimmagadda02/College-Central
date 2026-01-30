## 2024-05-22 - Form Accessibility in Complex Components
**Learning:** Complex interactive components like `CGPAForecaster` often miss basic accessibility attributes (labels) for inputs that are visually implicit but programmatically disconnected.
**Action:** When auditing complex forms, explicitly check `htmlFor`/`id` associations and `aria-label` for inputs that lack visible text labels.

## 2024-05-23 - Interactive Card Patterns
**Learning:** Animated cards (using `motion.div`) often act as buttons but lack semantic HTML and keyboard accessibility. Refactoring to `motion.button` retains animation capabilities while providing native accessibility (focus, enter/space activation).
**Action:** Replace clickable `div`s with `button`s in grid layouts, ensuring `w-full text-left` classes are added to maintain visual alignment.
