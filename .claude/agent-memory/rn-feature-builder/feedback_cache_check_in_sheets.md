---
name: feedback-cache-check-in-sheets
description: Prefer useQueryClient().getQueryData over a feature's useX query hook when a modal/sheet only needs a read-only snapshot of already-cached data (e.g. client-side duplicate-name validation).
metadata:
  type: feedback
---

When a sheet/modal screen (e.g. `app/(mgp-app)/new-category.tsx`) needs to check
already-cached React Query data client-side (duplicate-name validation, existence
checks) without needing loading/error states of its own, prefer
`useQueryClient().getQueryData<T>(["key"])` over mounting the feature's `useX`
query hook (e.g. `useCategories`).

**Why:** The sheet doesn't own the list — the parent/home screen does — so
subscribing via the query hook would add an unnecessary extra subscription/possible
refetch just to read a snapshot. `getQueryData` reads whatever is already cached
under the key (e.g. `["categories"]`) without side effects. This was the approach
taken for the duplicate-category-name fix in `app/(mgp-app)/new-category.tsx`
(compares `name.trim().toLowerCase()` against cached `Category[]` before firing
`productMutation`).

**How to apply:** Any time a scoped-task request says "check cached React Query
data" or "don't touch the backend/actions" inside a modal/sheet that isn't the
canonical owner of that query, reach for `getQueryData` first. Only use the full
`useX` hook if the sheet also needs live loading/error UI for that data itself.
