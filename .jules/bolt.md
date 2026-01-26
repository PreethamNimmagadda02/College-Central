## 2024-05-22 - [Redundant Semester Calculation]
**Learning:** `Dashboard.tsx` was recalculating semester dates by iterating over all events (O(N)), duplicating logic already present in `CalendarContext`. This highlights a pattern where components might not trust or fully utilize context data.
**Action:** Before implementing complex logic in a component, check if the data is already computed and exposed by a Provider.

## 2024-05-24 - [Parallel PDF Page Extraction]
**Learning:** `CalendarUploader.tsx` was extracting PDF pages sequentially, causing significant delay for multi-page documents. Parallelizing the extraction with `Promise.all` reduced processing time by ~12x (250ms -> 20ms for 50 pages).
**Action:** When performing independent asynchronous operations (like fetching pages from a document), always prefer `Promise.all` over sequential `await` loops unless memory constraints or order dependencies strictly forbid it.
