---
name: session-guard
description: >-
  Prevents long-session corruption by monitoring session health signals and
  triggering proactive splits before degradation hits. Addresses the #1 reliability
  issue of 2026: hallucinated tool results, instruction drift, and false progress
  in sessions exceeding ~50 tool calls. Use when working on complex multi-step
  tasks, when a session is getting long, when the agent starts repeating itself,
  or when output quality seems to degrade.
---

# Session Guard

Prevent session corruption before it happens. Long sessions degrade — this keeps them healthy.

## Persistence

ACTIVE every session. Passively monitors session health. Escalates when signals trigger.

## The Problem (June 2026, confirmed)

After ~50-85 tool calls in one session:
- Tool results can be hallucinated (content that doesn't match files on disk)
- Tool results can be duplicated (same read echoed 2-8x across distinct calls)
- Instructions drift (agent stops following constraints set earlier)
- False progress (agent claims "done" for work not actually completed)
- Reasoning quality drops as context fills

This is a PLATFORM limitation, not a user error. But smart session management mitigates it completely.

## Health Signals (monitor these)

| Signal | Threshold | Action |
|--------|-----------|--------|
| Tool call count this session | >40 | WARN: approaching degradation zone |
| Tool call count this session | >60 | SPLIT: create handoff, start fresh |
| Repeated failed tool calls | 3+ same error | PAUSE: diagnose before continuing |
| Agent contradicts earlier statement | Any | SPLIT: context has drifted |
| File read returns unexpected content | Any | VERIFY: re-read the file explicitly |
| Task scope exceeds original request | Growing unbounded | SPLIT: one task per session |

## Protocol

### Green Zone (0-40 tool calls)
Normal operation. No intervention needed.

### Yellow Zone (40-60 tool calls)
```
1. CHECKPOINT — summarize progress so far in one paragraph
2. ASSESS — is the current task almost done? If yes, push through. If no, prepare split.
3. REDUCE — stop opening new files unnecessarily. Use targeted reads, not exploratory ones.
4. BATCH — combine multiple small operations into fewer tool calls where possible.
```

### Red Zone (60+ tool calls OR any corruption signal)
```
1. STOP — do not make more tool calls until acknowledged
2. CHECKPOINT — write current state to a handoff document
3. VERIFY — re-read any file you're about to modify (don't trust earlier reads)
4. SPLIT — if significant work remains, create handoff and suggest fresh session
```

## Session Split Protocol

When splitting:

```markdown
## Handoff — Session Split

**Why split:** [signal that triggered — e.g., "60+ tool calls, approaching corruption zone"]
**Progress:** [what's done]
**Current state:** [what files are modified, what tests pass]
**Next steps:** [exact actions for fresh session — numbered, specific]
**Critical context:** [decisions made that must not be re-litigated]

Start fresh session with: "Continue from handoff: [summary]"
```

## Anti-Patterns

- "I'll just keep going, it's fine" — NO. The corruption is INVISIBLE until it causes damage.
- "I'll re-read everything to be safe" — This ADDS tool calls, making it worse. Be targeted.
- "The session seems fine" — Check the count. Feelings don't detect statistical degradation.
- "I'll split later" — Split BEFORE symptoms. Once corruption appears, damage is already done.

## Why This Matters

The #1 reported issue in Claude Code (June 2026): hallucinated tool results in long sessions causing the agent to write files based on fabricated content. This single discipline — monitoring session health and splitting proactively — eliminates the entire failure category.

The cost of splitting: 30 seconds to write a handoff.
The cost of NOT splitting: hours of debugging corrupted output you didn't know was corrupted.
