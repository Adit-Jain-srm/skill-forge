# AGENTS.md — skill-forge

## Instructions

This is a self-improving skill collection. The meta-agent (root SKILL.md) discovers, devours, and creates new skills autonomously.

### For AI Agents Using This Repo

1. Read `CONTEXT.md` first — it defines the project vocabulary
2. Skills live in `skills/` — each has a SKILL.md with YAML frontmatter
3. The meta-agent's memory lives in `memory/` — state files that persist between sessions
4. Run `/setup` on first use to configure user preferences
5. Quality bar: every skill must pass `node scripts/validate-skill.js`

### Available Skills

| Skill | Slash Command | Solves |
|-------|--------------|--------|
| setup | /setup | First-time configuration |
| ai-debt-detector | /ai-debt-detector | "AI code has hidden bugs nobody catches" |
| grill | /grill | "Building the wrong thing" |
| prove-it | /prove-it | "Agent says 'done' but it's NOT" |
| diagnose | /diagnose | "Something broken, don't know why" |
| self-review | /self-review | "Agent shows buggy first drafts" |
| zoom-out | /zoom-out | "Lost in unfamiliar code" |
| handoff | /handoff | "Need to continue later" |
| session-guard | /session-guard | "Long sessions degrade" |
| context-builder | /context-builder | "Agent doesn't speak my language" |
| dynamic-workflow | /dynamic-workflow | "Complex task needs parallel work" |
| mcp-conductor | /mcp-conductor | "Agent uses one tool when it should chain five" |
| git-workflow | /git-workflow | "Drowning in git complexity" |
| web-perf | /web-perf | "Site is slow, don't know why" |
| error-resilience | /error-resilience | "Code breaks in production" |
| arch-from-code | /arch-from-code | "Nobody knows how codebase works" |
| db-schema | /db-schema | "Database breaks at scale" |

### Automation Scripts

| Script | Purpose |
|--------|---------|
| `scripts/route-task.js` | TF-IDF semantic routing with compound skill matching |
| `scripts/index-memory.js` | Build indexed learnings (category + keyword + apply_to) |
| `scripts/skillopt.js` | SkillOpt self-improvement loop (record → analyze → propose → apply) |
| `scripts/orchestrate.js` | End-to-end project orchestration (7-phase guided plan) |
| `scripts/discover.js` | Multi-strategy skill discovery |
| `scripts/self-improve.js` | Monitor repos + weakness detection |
| `scripts/rl-update.js` | Reinforcement learning signal processing |
| `scripts/validate-skill.js` | Quality validation for skills |

### Self-Check Protocol

After every action, the agent runs a mandatory self-check (see root SKILL.md Phase 5). This is not optional.

## Learned User Preferences

- No lazy implementation — throw compute at quality, never cut corners
- Use installed skills as a pipeline (route → grill → create → prove-it → self-review)
- README frames skills as PROBLEMS not features

## Learned Workspace Facts

- Git push requires HTTP/1.1: `git -c http.version=HTTP/1.1 push` (HTTP/2 fails intermittently)
- Permanent Cursor install uses directory junction: `~/.cursor/skills/skill-forge` → this repo
- Tests must pass (98 tests): `node tests/run-tests.js`
- All skills must validate with 0 warnings: `node scripts/validate-skill.js skills/<name>`
- Marketplace install: `/plugin marketplace add Adit-Jain-srm/skill-forge`
- Memory index must be rebuilt after changing learnings: `node scripts/index-memory.js`
- SkillOpt records outcomes: `node scripts/skillopt.js --record --skill <name> --task "..." --outcome <good|poor|mixed>`
- Publishing target: GitHub under `Adit-Jain-srm` org
- Context compaction survival: hooks are ineffective post-compaction; behavioral self-enforcement (recite rules at checkpoints, re-read key files) is the only reliable countermeasure
