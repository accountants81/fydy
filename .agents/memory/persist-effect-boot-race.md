---
name: Guard localStorage persist effects during boot load
description: An unguarded useEffect that writes state to localStorage on every change can wipe saved data if it fires before an async/delayed boot-loading effect has read that data back in.
---

Pattern: app state (e.g. `customers`) starts as an empty default (`[]`), a boot effect asynchronously loads the real saved value from `localStorage` (e.g. after an artificial loading delay), and a separate `useEffect(() => localStorage.setItem(key, JSON.stringify(state)), [state])` persists on every change.

**Why it matters:** React runs effects after the initial render too. The persist effect fires immediately on mount with the still-default empty state, writing over the real saved data in localStorage *before* the boot effect's delayed read completes. Every fresh page load/refresh silently erases previously saved data. This can masquerade as unrelated symptoms (e.g. "search doesn't find anything" because the underlying dataset was just wiped).

**How to apply:** guard any persist-on-change effect with a loading/hydration flag (e.g. `if (isAppLoading) return;`) and include that flag in the dependency array, so persistence only starts after the real data has been loaded once.
