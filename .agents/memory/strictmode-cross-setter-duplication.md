---
name: Never call one setState from inside another's updater
description: Why calling setB(...) inside setA(prev => {...}) duplicates the side effect under React 18 StrictMode, and how it manifests as paired/duplicated records (e.g. delete producing two trash entries).
---

Anti-pattern: `setCustomers(prev => { const target = prev.find(...); setTrash(t => [...t, target]); return prev.filter(...); })` — calling a second state setter as a side effect from inside the first setter's updater function.

**Why it matters:** React 18 `StrictMode` intentionally invokes updater functions twice (in dev) to help surface impure updaters. If the updater's body has a side effect — like calling another setState — that side effect (the nested `setTrash` call) runs twice too. This silently duplicates whatever the nested call was doing: e.g. deleting a customer inserts it into the trash array *twice* (both entries share the same `id`), so a later restore brings back two entries and a permanent-delete-by-id removes both at once — looking like "delete/restore duplicates records" to the user, with no visible error.

**How to apply:** when two pieces of state need to move data between each other (delete→trash, restore→customers, etc.), resolve the target from current state via closure *before* calling setters, then call each setter independently exactly once — never nest one setState call inside another's updater callback. As extra protection, make the receiving setter idempotent (e.g. skip insert if an item with that id already exists).

**Aftermath:** once this bug has run in production, real duplicate-id records are already persisted (e.g. in localStorage). Fixing the live code isn't enough — add a one-time normalize/dedupe-by-id pass at every point saved data is loaded (boot, backup restore) so existing corrupted data self-heals instead of requiring a manual wipe.
