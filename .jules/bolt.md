## 2024-05-22 - [Redundant Semester Calculation]
**Learning:** `Dashboard.tsx` was recalculating semester dates by iterating over all events (O(N)), duplicating logic already present in `CalendarContext`. This highlights a pattern where components might not trust or fully utilize context data.
**Action:** Before implementing complex logic in a component, check if the data is already computed and exposed by a Provider.

## 2024-05-23 - [Parallel AI Extraction]
**Learning:** `GradesContext.tsx` was executing independent AI API calls sequentially in a loop, causing linear increase in processing time with the number of passes.
**Action:** Replaced sequential loop with `Promise.all` to run extraction passes concurrently, reducing total time to the duration of the slowest request. Confirmed with benchmarks.
