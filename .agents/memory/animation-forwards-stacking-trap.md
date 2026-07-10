---
name: Animation forwards fill-mode traps fixed modals
description: Why a CSS entrance animation with animation-fill-mode forwards can silently break z-index and position:fixed for nested modals, even when z-index numbers look correct.
---

If a container element runs a keyframe animation like `animation: fade-in 0.3s ease-out forwards;` where the keyframe animates `transform` (even just `translateY(0)` at the end), the `forwards` fill-mode keeps that transform permanently applied after the animation finishes — `translateY(0)` is a real transform value, not `none`.

**Why it matters:** any element with a transform other than `none` (even a no-op one) creates a new CSS stacking context AND becomes the containing block for `position: fixed`/`absolute` descendants. If that container wraps a `fixed inset-0` modal:
- The modal's z-index is now only compared *within* that container's local stacking context, not against sibling elements elsewhere in the page (e.g. a fixed header) — so a modal can appear to render behind/get covered by something with a much lower z-index number.
- The modal's `fixed` positioning becomes relative to that (possibly scrolled) container instead of the real viewport, so it can appear shifted/pushed down instead of centered on screen.

Symptoms look like "z-index isn't working" or "this dialog renders in the wrong place," but the z-index values themselves are correct — the bug is the residual transform on an ancestor.

**How to apply:** when a modal/dialog renders oddly relative to a fixed header or the viewport despite correct z-index numbers, check for `animation-fill-mode: forwards` (or explicit `forwards` in a shorthand `animation` property) on any ancestor between the modal and the page root, where the keyframe's final state includes a `transform`. Fix by dropping `forwards` if the animation's end state matches the element's normal resting style (usually true for pure entrance fade/slide-ins) — the visual result is identical since the animated end value and the resting value are the same.
