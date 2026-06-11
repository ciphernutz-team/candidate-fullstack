# Frontend Practical Assessment (2 Hours)

:pushpin: Overview

This repository contains a partially implemented **Market Intelligence Dashboard** application built using:

*   **Framework**: React + Vite
*   **Language**: TypeScript
*   **State Management**: Redux Toolkit
*   **Styling**: Tailwind CSS
*   **Data Fetching**: Axios
*   **Charts**: Recharts
*   **Icons**: Lucide React

The application includes a dashboard table view, real-time activity logs, and trend charts. It aggregates data from multiple public APIs.

However, the codebase has accumulated significant "technical debt," and several bugs have been reported.

:hourglass_flowing_sand: Time Limit

You have 2 hours to complete this assessment.
Focus on:
- Correctness
- Clean implementation
- Proper state handling
Avoid over-engineering.

:hammer_and_wrench: Setup Instructions

:one: Install dependencies
```bash
npm install
```

:two: Run frontend
```bash
npm run dev
```

:globe_with_meridians: API Information

This application aggregates data from multiple public APIs:
- **DummyJSON**: For product inventory and category data. (https://dummyjson.com)
- **RandomUser**: For simulating real-time user activity logs. (https://randomuser.me)
- **CoinGecko**: For fetching live market price trends (BTC/USD). (https://api.coingecko.com)


:clipboard: Tasks To Complete

Your task is to identify and resolve the following **6 core issues**. These range from simple logic errors to deep architectural "legacy" bombs.

### Issue 1 – Dashboard Totals vs Active Filters
The summary numbers at the top of the dashboard should stay aligned with the products currently being shown. Check category changes, search changes, and combinations of both. While doing this, also pay attention to any avoidable delay when filters change.

### Issue 2 – Refresh and Stable Market Values
The refresh action should reliably update the market chart when new data is requested. Sorting or rearranging table rows should not unexpectedly alter values that are supposed to represent fetched or derived market data.


### Issue 3 – Combined Search and Category Behavior
Search and category selection should work together predictably. Reproduce flows where the user changes one control after the other, and make sure the final product list reflects the current controls rather than stale or partially applied criteria.


### Issue 4 – Explorer Responsiveness
The Entity Explorer should remain usable during longer sessions. Scrolling deeper into the list and selecting characters should not cause unnecessary page-wide work or visible freezes.


### Issue 5 – Table and Dashboard Consistency
The table, pagination, and dashboard state should stay consistent when users move between pages, apply controls, leave the dashboard, and come back. Watch for stale rows, mismatched totals, or state that no longer represents the visible data.


### Issue 6 – App Shell Reliability
Normal navigation and browser refreshes should not cause the sidebar or main content to disappear behind the "Legacy System Fault" screen. Find the condition that triggers this and fix it without simply hiding all errors.


---

:package: Submission Instructions

1. Fork this repository.
2. Create a new branch: `feature/your-name`
3. Make clean and meaningful commits.
4. Push your fork.
5. Create a Pull Request.
6. In PR description include:
   - What issues you identified
   - What changes you made
   - Any assumptions
   - What improvements you would make with more time

:bar_chart: Evaluation Criteria

You will be evaluated on:
- Debugging ability
- State management clarity
- API integration correctness
- Code structure & readability
- Edge case handling
- Commit quality
- Explanation in PR

:dart: What We Are Looking For

This assessment evaluates:
- Your ability to work with an existing codebase
- Your problem-solving approach
- Your understanding of React state & API flow
- Your ability to implement features cleanly
- Your engineering maturity

Technical expectations:
- **Profiling**: Using React DevTools Profiler to hunt re-renders.
- **Memory Analysis**: Finding detached nodes and leaked listeners in Chrome DevTools.
- **Architectural Depth**: Implementing `AbortController` or similar for async safety.
- **Internal Knowledge**: Understanding React's reconciliation, referential identity, and Context propagation.

Good luck!
