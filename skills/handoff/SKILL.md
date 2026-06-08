---
name: handoff
description: >-
  Compact the current conversation into a handoff document so another agent or
  future session can continue the work without losing context. Use when ending a
  session, switching tasks, the context is getting long, or user says handoff,
  wrap up, save progress, or "continue this later".
---

## Overview

Create a structured document capturing everything needed to continue work in a fresh session — in under 50 lines.

## Process

Write a handoff document capturing everything needed to continue this work.

## What to Include

```
1. GOAL — what we're building/fixing (one sentence)
2. CURRENT STATE — what's done, what's in progress, what's blocked
3. KEY DECISIONS MADE — choices that shouldn't be re-litigated
4. OPEN QUESTIONS — unresolved decisions awaiting input
5. NEXT STEPS — exact actions to take (not vague "continue working")
6. FILES TOUCHED — paths modified this session
7. SUGGESTED SKILLS — which skills the next session should invoke
```

## What NOT to Include

- Full code (reference by file path instead)
- Conversation history (this is a SUMMARY not a transcript)
- Sensitive info (API keys, passwords, PII)
- Resolved dead ends (only include what's RELEVANT going forward)

## Where to Save

Save to the OS temp directory (not the workspace):
- Windows: `$env:TEMP/handoff-{project}-{date}.md`
- macOS/Linux: `/tmp/handoff-{project}-{date}.md`

Tell the user the path so they can reference it next session.

## Common Mistakes

- Including full code instead of file paths (bloats the handoff, makes it unreadable)
- Forgetting open questions (next session re-litigates decisions)
- Writing vague next steps like "continue working" (be SPECIFIC: which file, which function, which test)
- Saving to the workspace (pollutes the project — use temp directory)

## Format

Keep it SHORT. Under 50 lines. A good handoff is one page a new agent can scan in 10 seconds and know exactly what to do.

## Example

```markdown
## Handoff — skill-forge v1.2.0

**Goal:** Add TF-IDF semantic routing to replace token-overlap matching.

**State:** Route-task.js rewritten and passing. 98 tests green. Not yet pushed.

**Decisions Made:**
- TF-IDF + cosine similarity (not embedding API — zero dependencies)
- Compound routing: combine top 3-5 skills when overlap < 40%
- Indexed learnings surfaced alongside skill matches

**Open Questions:**
- Should RL weights be per-skill or per-category? (currently per-category)

**Next Steps:**
1. Run `node tests/run-tests.js` — confirm all pass
2. Push with `git -c http.version=HTTP/1.1 push origin main`
3. Update SKILL.md Phase 4 to reference new routing

**Files:** scripts/route-task.js, memory/indexed-learnings.json, tests/run-tests.js
**Skills for next session:** /prove-it, /self-review
```
