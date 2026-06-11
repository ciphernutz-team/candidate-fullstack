# Market Intelligence Dashboard — Bug Analysis & Implementation Reference

> Working reference for the take-home assessment. Every root cause below was read against the
> actual source and **adversarially verified** (a second reviewer tried to refute each diagnosis and
> checked that the proposed fix wouldn't break other consumers). Verification corrections are called
> out inline with ⚠️. Use this doc as the spec while implementing — especially the
> [Fix interaction & order](#fix-interaction--recommended-order) section, because several fixes collide
> if applied in the wrong order.

---

## 1. Project overview

**Stack:** React 18 + Vite + TypeScript, Redux Toolkit, Tailwind CSS, Recharts, Axios, react-router-dom v7.

**Routes** (registered in [src/App.tsx](src/App.tsx)):
| Path | Page | Data source |
|------|------|-------------|
| `/` | [DashboardPage](src/pages/DashboardPage.tsx) | DummyJSON (products), CoinGecko (BTC chart), RandomUser (activity) |
| `/explorer` | [CharacterExplorer](src/pages/CharacterExplorer.tsx) | Rick & Morty API (infinite scroll) |
| `/launches` | [LaunchList](src/features/launches/LaunchList.tsx) | SpaceX API — **route exists but the sidebar link is commented out** ([Sidebar.tsx:8](src/components/Sidebar.tsx#L8)) |

**Redux store** ([src/store/index.ts](src/store/index.ts)): `filters`, `products`, `market`, `users`, `launches`.

**App shell:** `<Sidebar>` and `<Routes>` are each wrapped in an [ErrorBoundary](src/components/ErrorBoundary.tsx) that renders the "Legacy System Fault" screen on any thrown error.

**Run:** `npm install` → `npm run dev`. Type-check/build: `npm run build` (runs `tsc && vite build`). Lint: `npm run lint`.

---

## 2. Issue map (README task list → verified root causes)

The README lists 6 issues. Below: confirmed symptom, **verified** root cause(s) with `file:line`, the mechanism, and the fix plan. Confidence is the adversarial reviewer's.

---

### Issue 1 — Dashboard totals must track active filters (+ avoidable delay) · confidence 0.82

**Symptom:** The top metric cards (Total Revenue, Products Sold) don't change when you change category/search, and changing a filter feels laggy.

**Root causes (all verified):**

1. **Metrics read the unfiltered `items`, not the filtered list.**
   - [DashboardPage.tsx:19-25](src/pages/DashboardPage.tsx#L19-L25) — `totalRevenue` sums `selectTotalRevenue`, which reads `state.products.items` (the full set).
   - [DashboardPage.tsx:63](src/pages/DashboardPage.tsx#L63) — "Products Sold" = `items.length * 14`, also the full set.
   - [revenueSelectors.ts:7-14](src/selectors/revenueSelectors.ts#L7-L14) — `selectTotalRevenue` maps over `state.products.items`, ignores filters.

2. **A deterministic clobber overwrites the table's filtered list.**
   - [DashboardPage.tsx:40-43](src/pages/DashboardPage.tsx#L40-L43) — effect deps `[items, category, search, dispatch]` dispatches `setFilteredProducts([...items])` but **never actually filters by category/search**. ⚠️ Verified: this is a *deterministic* overwrite, not a race — once the dashboard's unfiltered `limit:100` fetch resolves, `filteredItems` is forced to mirror `items` regardless of filters. (The original notes called this a "race"; it's actually a guaranteed clobber.)

3. **`selectTotalRevenue` is not memoized → self-sustaining re-render/dispatch loop.**
   - [revenueSelectors.ts:7-14](src/selectors/revenueSelectors.ts#L7-L14) returns a fresh `.map()` array on every call → new reference every render.
   - [DashboardPage.tsx:33-38](src/pages/DashboardPage.tsx#L33-L38) — effect deps `[revenueData, dispatch]` dispatches `{type:'INTERNAL_METRICS_SYNC'}` (an unhandled no-op action) every time `revenueData`'s identity changes → store notifies → `useSelector` recomputes → new array reference → effect re-runs → dispatch again. ⚠️ Verified: this is effectively a render loop + console spam, the real source of the "avoidable delay."

**Fix plan:**
- Memoize a filter-aware revenue selector with `createSelector` (inputs: products + category + search), returning a **number** for the total. Update the consumer ([DashboardPage.tsx:20-25, 33-38](src/pages/DashboardPage.tsx#L20-L38)) to the new shape.
- Drive "Products Sold" and "Total Revenue" from a single filtered source.
- **Delete** the `INTERNAL_METRICS_SYNC` effect entirely.

⚠️ **Breakage warnings (verified):**
- Do **not** feed totals from `state.products.filteredItems` until Issue 2's sort-mutation is fixed — sorting mutates `filteredItems` prices and would corrupt the revenue total.
- "Products Sold = `items.length * 14`" only works while `items` holds the full set. If you make ProductTable the sole loader (`limit:10`), `items` collapses to ≤10 and the metric breaks. Derive count from `state.products.total` (filter-scoped), **not** array length. See [Issue 5](#issue-5--table--pagination--dashboard-consistency--confidence-078) — this is the same `items`-vs-`filteredItems` coupling.
- Changing `selectTotalRevenue` from returning an array to a number breaks `revenueData.length`/`revenueData.reduce` call sites — update them together.

---

### Issue 2 — Refresh reliability + stable market values · confidence 0.90

**Symptom A:** Clicking "Refresh Data" never updates the BTC market chart.
**Symptom B:** Sorting the product table changes prices.

**Root causes (all verified verbatim):**

1. **Refresh is gated on a DOM id that doesn't exist.**
   - [Header.tsx:11-22](src/components/Header.tsx#L11-L22) — `isDashboardMounted = !!document.getElementById('dashboard-metrics-container')`. ⚠️ Verified by repo-wide grep: nothing renders that id, so `isDashboardMounted` is always `false`, the early `return` always fires, and `dispatch(fetchMarketData())` at [line 22](src/components/Header.tsx#L22) is dead.

2. **Sort mutates prices.**
   - [productSlice.ts:69-87](src/features/products/productSlice.ts#L69-L87) — `a.price += 0.001` **inside the comparator** (runs O(n log n) times per sort) plus a random `+= 0.01` bump. Immer drafts make these real mutations. ⚠️ Verified: because [DashboardPage.tsx:41](src/pages/DashboardPage.tsx#L41) does a shallow `[...items]` copy, `filteredItems` and `items` share the same element objects — so a sort can bleed into `items` too.

3. **Chart memo is keyed on length, so repeat refreshes don't redraw.**
   - [TrendChart.tsx:21-26](src/components/charts/TrendChart.tsx#L21-L26) — `useMemo(..., [data.length])`. CoinGecko returns `days=7&interval=daily` ([marketSlice.ts:22](src/features/market/marketSlice.ts#L22)) → length stays 7 → a refresh fetches new prices but the memo is stale and the chart doesn't update. (Works the first time only, when length goes 0→7.)

**Fix plan:**
- Remove the DOM-id guard in `handleRefresh`; always dispatch `fetchMarketData()`.
- Make `sortProducts` pure: `state.filteredItems = [...state.filteredItems].sort((a,b)=>...)` with **no** price mutations and no random bump.
- Change `TrendChart`'s memo dep to `[data]` (and guard `data ?? []`). `marketSlice` assigns a fresh array on fulfilled, so identity changes correctly.

⚠️ **Note (verified, low risk):** switching the memo dep to `[data]` makes the inline "Product Sales Trend" array literal ([DashboardPage.tsx:90-97](src/pages/DashboardPage.tsx#L90-L97)) recompute every render. Hoist that literal to a module constant. Pure-perf, not a correctness break.

---

### Issue 3 — Combined search + category behavior · confidence 0.82

**Symptom:** Applying search and category together returns inconsistent results; the list reflects stale or partially-applied criteria.

**Root causes (verified, including live API checks):**

1. **Random endpoint routing drops one of the two filters.**
   - [productSlice.ts:42-54](src/features/products/productSlice.ts#L42-L54) — `bypassCache = Math.random() < 0.4` chooses between `/products/category/{cat}?q=...` and `/products/search?q=...`.
   - ⚠️ Verified against the live DummyJSON API: `/products/category/smartphones?q=apple` **ignores `q`** (returns all 16 smartphones); `/products/search?q=apple` **ignores category** (returns items across many categories). So ~40% of combined search+category fetches silently drop the category. This is a **primary** cause for "combinations of both," not an edge case.

2. **Random artificial delay + no take-latest guard → last-writer-wins races.**
   - [productSlice.ts:39-40](src/features/products/productSlice.ts#L39-L40) — `Math.random()*4000` delay; [productSlice.ts:97-102](src/features/products/productSlice.ts#L97-L102) — `fulfilled` blindly assigns with no `requestId`/arg comparison.

3. **Two (actually three) competing fetch sources.**
   - [ProductTable.tsx:11-14](src/components/ProductTable.tsx#L11-L14) fetches on `[currentPage, limit, search, category]` (`limit:10`).
   - [FilterPanel.tsx:29-38](src/components/FilterPanel.tsx#L29-L38) debounces and fetches on search (`limit:10`). ⚠️ Its effect deps are `[localSearch, dispatch]` but it reads `search` and `categoryRef.current` inside — a stale-closure workaround that signals the design problem.
   - [DashboardPage.tsx:28](src/pages/DashboardPage.tsx#L28) fetches `limit:100`.

**Fix plan:**
- Make routing deterministic. Recommended: fetch by category server-side, then **client-side filter by `q`** (or use search then filter by category) — pick one and reshape the thunk's returned payload so `products` **and** `total` are consistent. ⚠️ Verified: the `fulfilled` reducer reads `action.payload.total`/`.products` directly, so if you filter client-side you **must** recompute `total` in the payload or pagination desyncs.
- Establish a **single fetch owner**. ProductTable is the natural owner. Remove FilterPanel's fetch and the DashboardPage products fetch (coordinate with Issue 1/5).
- Reset `currentPage` to 1 when filters change. ⚠️ Verified gotcha: `currentPage` is in ProductTable's fetch-effect deps, so a naive page reset triggers a *second* fetch — coordinate so only one fetch fires per filter change.

---

### Issue 4 — Explorer responsiveness · confidence 0.83

**Symptom:** Scrolling deep and selecting characters freezes the page; duplicate cards appear.

⚠️ **Major verification correction:** the original hunch ("leaked scroll listeners cause overlapping fetches") is **wrong** as the primary cause. The real bugs:

1. **Stale `page` closure → every scroll refetches page 1.**
   - [CharacterExplorer.tsx:44-58](src/pages/CharacterExplorer.tsx#L44-L58) — `fetchCharacters` closes over `page`. [useInfiniteScroll.ts:6-14](src/hooks/useInfiniteScroll.ts#L6-L14) wraps `handleScroll` with deps `[containerRef]` (never change), capturing the **mount-render** `fetchCharacters` where `page === 1`. `setPage(p=>p+1)` advances state but the stale closure always builds `?page=1`. Result: scroll appends **duplicate page-1 results** forever, never advancing. ⚠️ The `key={char.id}-${index}` ([line 86](src/pages/CharacterExplorer.tsx#L86)) masks this by keeping keys unique while duplicates render.

2. **Synthetic 5ms busy-wait per card, run on every render.**
   - [CharacterExplorer.tsx:15-17](src/pages/CharacterExplorer.tsx#L15-L17) — `while (performance.now() - start < 5) {}` in `CharacterCard`.

3. **New context value object every render → all cards re-render on every selection.**
   - [CharacterExplorer.tsx:66](src/pages/CharacterExplorer.tsx#L66) — `const contextValue = { selectedIds, toggleSelection }` is a fresh object each render, so `React.memo` on `CharacterCard` is defeated; toggling one selection re-renders every card → each re-runs the 5ms block → page-wide freeze proportional to list length.

4. **No throttle + `setIsFetching` never called.**
   - [useInfiniteScroll.ts:19-22](src/hooks/useInfiniteScroll.ts#L19-L22) — `scrollTracker` runs `handleScroll` on every scroll event, no rate limiting. `setIsFetching` is returned but never invoked ([CharacterExplorer.tsx:54](src/pages/CharacterExplorer.tsx#L54)), so `isFetching` is permanently `false` → the `!isFetching` guard never throttles and the "Loading more…" indicator never shows.
   - The hook's cleanup ([useInfiniteScroll.ts:28-35](src/hooks/useInfiniteScroll.ts#L28-L35)) only removes the listener when `!isFetching` (inverted/"ghost listener" logic) — a real leak, but secondary to the above.

**Fix plan:**
- Fix paging: pass an explicit page arg or track page in a ref so `fetchCharacters` uses the current page; guard StrictMode double-invoke.
- Remove the busy-wait and `console.log` in `CharacterCard`.
- Wrap `contextValue` in `useMemo` and `toggleSelection` in `useCallback`.
- Fix the hook: include `callback`/`isFetching` in deps (or read `isFetching` via a ref), make cleanup unconditional, and actually drive `setIsFetching` around the fetch.
- Optional: type the character shape and key by `char.id` alone (will surface any remaining duplication).

---

### Issue 5 — Table / pagination / dashboard consistency · confidence 0.78

**Symptom:** Stale rows, mismatched totals, or row count not matching the footer when navigating pages / leaving and returning.

**Root causes (verified):**

1. **DashboardPage clobbers `filteredItems` with the unfiltered set.** Same as Issue 1 cause #2 ([DashboardPage.tsx:40-43](src/pages/DashboardPage.tsx#L40-L43)).
2. **Two fetchers write the same `products` slice with different `limit`s.** Dashboard `limit:100` ([DashboardPage.tsx:28](src/pages/DashboardPage.tsx#L28)) vs ProductTable `limit:10` ([ProductTable.tsx:11-14](src/components/ProductTable.tsx#L11-L14)), random 0–4s delay, no dedup.
   - ⚠️ **Verified correction:** this does **not** cause a *total* mismatch. The live DummyJSON API returns `total: 194` for both `limit=10` and `limit=100` — `total` is limit-independent. The real artifact is a **row-count vs footer** mismatch (e.g. `filteredItems` = 100 rows while the footer says "Showing 1 to 10 of 194"). Genuine *total* mismatches come only from the Issue-3 endpoint flip.
3. **`fulfilled` writes both `items` and `filteredItems` for every caller, no `requestId` guard** ([productSlice.ts:97-102](src/features/products/productSlice.ts#L97-L102)).
   - ⚠️ Verified: `filteredItems` is consumed **only** by ProductTable; dashboard metrics read `state.products.items`. So removing the DashboardPage effect does **not** break metrics — but fix #1 in isolation is **insufficient**, because the `fulfilled` reducer directly sets `filteredItems = payload.products` for the dashboard's `limit:100` fetch regardless of that effect. You must also stop the `limit:100` write and/or add the requestId guard.
4. **Sort instability** ([productSlice.ts:71-86](src/features/products/productSlice.ts#L71-L86)) — see Issue 2. ⚠️ Verified: under Immer copy-on-write the sort mutates only `filteredItems` element objects, so it corrupts **the table's displayed prices**, not `state.items` / the dashboard revenue.
5. **Filter changes don't reset `currentPage`.** `setCategory`/`setSearch` ([filterSlice.ts](src/features/filters/filterSlice.ts)) never touch `products.currentPage`; FilterPanel fetches `skip:0` while ProductTable's effect refetches with `skip=(currentPage-1)*limit`. Competing skips, last-wins.
6. **Header refresh ignores `currentPage`** ([Header.tsx:14](src/components/Header.tsx#L14)) — `fetchProducts({limit:10, skip:0})` resets visible rows to page 1 while `currentPage`/footer still show the old page.

**Fix plan (combined — see [order](#fix-interaction--recommended-order)):**
- Single source of truth for the table: one fetch owner (ProductTable), remove the dashboard `limit:100` products fetch and the clobbering effect.
- Separate the **metric-source list** from the **table list** so a `limit:10` page fetch doesn't shrink the metric basis (derive metrics from `total` or a dedicated fetch).
- Add a `requestId`/take-latest guard in the thunk + `fulfilled`/`rejected` so out-of-order responses are dropped (set `currentRequestId` in `pending`, compare in `fulfilled`/`rejected`).
- Reset `currentPage` on filter change; clamp `currentPage` to `totalPages` when filtering shrinks results.

---

### Issue 6 — App shell reliability ("Legacy System Fault") · confidence 0.85

**Symptom:** Navigation / browser refresh intermittently replaces the sidebar or main content with the "Legacy System Fault" screen.

**Root cause (confirmed, the single real one):**
- [legacy.ts:2-14](src/utils/legacy.ts#L2-L14) — an IIFE runs at module load (imported by [main.tsx:7](src/main.tsx#L7), before render) and **permanently overwrites `Array.prototype.filter`** to return `null` when `result.length === 0 && Math.random() > 0.95`. Any `.filter()` that yields an empty array has a ~5% chance to return `null`; downstream `.map`/`.length` on `null` throws, bubbling to the [ErrorBoundary](src/components/ErrorBoundary.tsx).

⚠️ **Verification corrections (mechanism, not the fix):**
- The claim "React uses `Array.prototype.filter` during reconciliation" is **false** — React's dev builds contain **zero** `.filter()` calls. The in-render-path library that *does* call `Array.prototype.filter` is **react-router v7** (38 call sites: `rankRouteBranches`, `getPathContributingMatches`, etc.) — that's the realistic crash vector for the default `/` and `/explorer` routes.
- [revenueSelectors.ts:20](src/selectors/revenueSelectors.ts#L20) (`selectFilteredRevenue`) is **dead code** (never imported). [CharacterExplorer.tsx:62](src/pages/CharacterExplorer.tsx#L62) `prev.filter(...)` runs only in a **click handler**, not during navigation. [LaunchList.tsx:25](src/features/launches/LaunchList.tsx#L25) is the only app-level render-path filter, but its route isn't linked.

**Fix plan:** Delete the IIFE in [legacy.ts](src/utils/legacy.ts); keep the `legacyInit` export (it only `console.log`s, and [main.tsx:9](src/main.tsx#L9) calls it). ⚠️ Do **not** "fix" this by swallowing errors in the ErrorBoundary — the README explicitly forbids that. Deterministic, type-safe, breaks nothing.

---

## 3. Planted "expert" bugs — Launches feature · confidence 0.90

Reachable only via direct URL `/launches` (sidebar link commented out at [Sidebar.tsx:8](src/components/Sidebar.tsx#L8)).

1. **Render-time `Date.now()` defeats `useMemo` (most user-visible).**
   - [LaunchList.tsx:18-31](src/features/launches/LaunchList.tsx#L18-L31) — `filterCriteria = { type, timestamp: Date.now() }` is a new object every render, and it's a `useMemo` dependency, so the memo (which contains a **100ms busy-wait**) recomputes on every render, including initial.
   - **Fix:** depend on `[items, filterType]` only; drop the `timestamp`/busy-wait.

2. **Impure reducer using module-level mutable state.**
   - [launchSlice.ts:6-7, 75-91](src/features/launches/launchSlice.ts#L6-L91) — `lastUpdateTimestamp` / `pendingUpdateCount` are module globals mutated inside `batchUpdateMetadata`, plus `Date.now()` in the reducer. ⚠️ Verified: `batchUpdateMetadata` is also **dead code** — not in the `actions` export ([line 115](src/features/launches/launchSlice.ts#L115)), so it can't be dispatched.
   - **Fix:** move counters into state (or delete the dead reducer); keep reducers pure.

3. **Sequential fetch clobbering / no take-latest.**
   - [launchSlice.ts:56-68, 102-107](src/features/launches/launchSlice.ts#L56-L107) — random `setTimeout` jitter + unconditional `fulfilled`. ⚠️ Verified: StrictMode ([main.tsx:12](src/main.tsx#L12)) makes the double-dispatch race live in dev; in prod it's latent (single dispatch site).
   - **Fix:** `requestId` guard (standard).

4. **Circular dependency.**
   - [launchSlice.ts:3](src/features/launches/launchSlice.ts#L3) imports `RootState` from the store, which imports `launchReducer`. ⚠️ Verified: TDZ risk is **overstated** — `RootState` is a pure **type**, erased at runtime, so it's only a bundler-level circular-import warning, and `RootState` is **unused** in `launchSlice`.
   - **Fix:** delete the unused import (cleanest) or use `import type`.

---

## 4. Additional findings (completeness sweep)

Beyond the README list — fix opportunistically; flag the rest in the PR.

| Severity | File | Problem | Fix |
|---|---|---|---|
| high | [productSlice.ts:69-87](src/features/products/productSlice.ts#L69-L87) | `sortProducts` impure / mutates prices (Issue 2) | pure comparator only |
| high | [revenueSelectors.ts:7-14](src/selectors/revenueSelectors.ts#L7-L14) | `selectTotalRevenue` non-memoized, new array each call (Issue 1) | `createSelector` |
| high | [userSlice.ts:35-43](src/features/users/userSlice.ts#L35-L43) | `fulfilled` reducer impure: `Math.random()` activeUsers + random action + `new Date()` time | compute in thunk, return in payload |
| high | [DashboardPage.tsx:33-38](src/pages/DashboardPage.tsx#L33-L38) | no-op `INTERNAL_METRICS_SYNC` dispatch loop (Issue 1) | delete effect |
| medium | [revenueSelectors.ts:16-31](src/selectors/revenueSelectors.ts#L16-L31) | `selectFilteredRevenue` embeds `timestamp: Date.now()` (impure, dead code) | drop timestamp / remove |
| medium | thunks across [products](src/features/products/productSlice.ts)/[market](src/features/market/marketSlice.ts)/[users](src/features/users/userSlice.ts)/[launches](src/features/launches/launchSlice.ts) | no `AbortSignal`; overlapping requests clobber | pass `thunkAPI.signal` to axios; ⚠️ guard the `rejected` reducer against `CanceledError` or every aborted request flashes "Failed to fetch products" |
| medium | [TrendChart.tsx:21-26](src/components/charts/TrendChart.tsx#L21-L26) | memo dep `[data.length]` (Issue 2) | `[data]` + `data ?? []` |
| low | [filterSlice.ts:12-19, 34-36](src/features/filters/filterSlice.ts#L12-L36) | `dateRange` frozen at module-eval time; `resetFilters` restores stale window | compute lazily in `resetFilters` |
| low | [CharacterExplorer.tsx:11, 86](src/pages/CharacterExplorer.tsx#L11-L86) | `any` typing; `key` mixes id+index | type the shape; `key={char.id}` |
| low | [Sidebar.tsx:5-9](src/components/Sidebar.tsx#L5-L9) | Launches nav item commented out → route hidden | restore the menu entry |

### Cross-cutting: the axios interceptor is inert dead code (verified)
- [api.ts:21-31](src/services/api.ts#L21-L31) — ⚠️ Verified (axios 1.13.6): `axios.create()` instances do **not** inherit interceptors from the default axios. `globalSecurityCache` is only set inside `if (config.baseURL?.includes('dummyjson'))` on the **default** axios, but all DummyJSON traffic goes through the `dummyJsonApi` **instance** ([productSlice.ts:56](src/features/products/productSlice.ts#L56), [FilterPanel.tsx:19](src/components/FilterPanel.tsx#L19)). So the cache stays `null` forever and the `Math.random() > 0.7` Authorization header **never attaches anywhere** — it is *not* flaky, it is simply never sent. The only default-axios consumer ([CharacterExplorer.tsx:46](src/pages/CharacterExplorer.tsx#L46)) gets no header either.
- **Fix:** remove the auth interceptor entirely (it's provably dead and pointless). The real observable non-determinism is the random delay + `bypassCache` flip + StrictMode races — addressed under Issues 3/5.

---

## 5. Fix interaction & recommended order

Several fixes collide. Apply in this order to avoid regressions:

1. **Issue 6 first — remove the `legacy.ts` prototype patch.** Until this is gone, *any* manual verification is randomly poisoned. Cheap, isolated, unblocks reliable testing.
2. **Issue 2 sort purity — make `sortProducts` pure.** Must precede Issue 1's "totals from filtered data," or sorting corrupts the revenue total. Also do the Header refresh + TrendChart memo here.
3. **Products data-flow refactor (Issues 1 + 3 + 5 together).** These share `items`/`filteredItems` coupling and the multi-fetcher problem — fixing them piecemeal regresses each other:
   - Establish **one fetch owner** (ProductTable); remove FilterPanel's fetch and the DashboardPage `limit:100` fetch + the clobbering effect.
   - Make endpoint routing deterministic (search+category) and reshape the thunk payload (`products` **and** `total`).
   - Add a `requestId` take-latest guard in the thunk + `fulfilled`/`rejected`.
   - Reset `currentPage` on filter change **without** triggering a double fetch; clamp to `totalPages`.
   - Separate the **metric source** from the **table list** so paging doesn't shrink the metric basis; memoize a filter-aware revenue selector; delete `INTERNAL_METRICS_SYNC`.
4. **Issue 4 — Explorer.** Independent of the products work. Fix the stale-page closure, busy-wait, memoized context value/callback, and the infinite-scroll hook (throttle + `isFetching` + unconditional cleanup).
5. **Planted launch bugs + completeness items** (impure `userSlice`, AbortSignal w/ `CanceledError` guard, `filterSlice` lazy reset, restore sidebar link). Optional but strong signal for the PR.

### Watch-outs that bite if ignored
- Reading totals from `filteredItems` before sort is pure → corrupted revenue.
- Making ProductTable sole owner with `limit:10` → `items.length`-based metrics break; use `total`.
- Client-side `q` filtering without recomputing payload `total` → pagination desync.
- Resetting `currentPage` while it's in ProductTable's fetch-effect deps → redundant double fetch.
- Adding AbortSignal without guarding the `rejected` reducer → UI flashes "Failed to fetch products" on every superseded request.

---

## 6. PR checklist (from README submission criteria)

Branch `feature/<your-name>`, clean commits, PR describing: issues identified, changes made, assumptions, and "with more time" improvements. Evaluated on debugging, state-management clarity, API-integration correctness, structure/readability, edge cases, commit quality, and explanation. Stated technical expectations: React DevTools Profiler (re-render hunting), Chrome memory analysis (detached nodes / leaked listeners → Issue 4), `AbortController` for async safety, and understanding of reconciliation / referential identity / Context propagation.
