# CLAUDE.md — skill-forge

Read `CONTEXT.md` for project vocabulary. Read `AGENTS.md` for available skills and scripts.

## Identity

This is a self-improving skill collection with two objectives: (1) make itself better each cycle, (2) produce skills that earn stars. The meta-agent in root SKILL.md orchestrates discovery, creation, routing, and improvement.

## Key Facts

- Skills are in `skills/` directory, each with a SKILL.md
- Memory/state persists in `memory/*.json` (indexed via `scripts/index-memory.js`)
- Quality validation: `node scripts/validate-skill.js skills/<name>` — must pass with 0 warnings
- Self-check runs after every action (Phase 5 in root SKILL.md)
- Self-improvement: `node scripts/skillopt.js` tracks outcomes and proposes prompt deltas
- Routing: `node scripts/route-task.js "task"` — TF-IDF semantic matching with compound skills
- Publishing target: GitHub under Adit-Jain-srm org
- Install: `npx skills@latest add Adit-Jain-srm/skill-forge`

## When Modifying

- Never ship a skill without validation passing (0 warnings)
- Run `node tests/run-tests.js` after any structural change (must pass all 98 tests)
- Always update CONTEXT.md if adding new domain terms
- Learnings go in `memory/learnings.json` and must change BEHAVIOR not just exist
- After using a skill, record outcome: `node scripts/skillopt.js --record --skill <name> --task "..." --outcome <good|poor|mixed>`
- README frames skills as PROBLEMS not features

## Reasoning Approach

When making decisions about skill creation, routing, or improvement:
1. State the specific problem being solved (not vague goals)
2. Consider what already exists (check memory/learnings.json and indexed-learnings.json)
3. Validate against the best (not "good enough" — compare to top performers)
4. Prove the result works (run tests, show evidence, never claim without verification)
