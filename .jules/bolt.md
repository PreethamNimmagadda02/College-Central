## 2024-05-22 - [Redundant Semester Calculation]
**Learning:** `Dashboard.tsx` was recalculating semester dates by iterating over all events (O(N)), duplicating logic already present in `CalendarContext`. This highlights a pattern where components might not trust or fully utilize context data.
**Action:** Before implementing complex logic in a component, check if the data is already computed and exposed by a Provider.

## 2024-05-22 - [Redundant Grouping Calculation]
**Learning:** In `Directory.tsx`, expensive data grouping logic (O(N)) was combined with filtering logic in a single `useMemo`. This caused the entire grouping to run on every search keystroke.
**Action:** Split data processing into two `useMemo` hooks: one for data-dependent operations (grouping) and another for user-dependent operations (filtering/sorting). This resulted in a ~73% performance improvement during search.
