## 2024-05-22 - [Redundant Semester Calculation]
**Learning:** `Dashboard.tsx` was recalculating semester dates by iterating over all events (O(N)), duplicating logic already present in `CalendarContext`. This highlights a pattern where components might not trust or fully utilize context data.
**Action:** Before implementing complex logic in a component, check if the data is already computed and exposed by a Provider.

## 2024-05-24 - [Sequential Grade Extraction]
**Learning:** `GradesContext.tsx` was performing AI extraction passes sequentially, doubling the latency for users.
**Action:** Replaced sequential loop with `Promise.allSettled` to parallelize independent API calls, achieving ~50% latency reduction. Always audit `await` inside loops.
