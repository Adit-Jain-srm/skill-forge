# Changelog

All notable changes to skill-forge.

## [1.2.0] - 2026-06-06

### Added
- `scripts/index-memory.js` — category-indexed, keyword-indexed learnings with O(1) retrieval
- `scripts/skillopt.js` — SkillOpt self-improvement loop (rollout→reflect→aggregate→select→update→evaluate)
- `scripts/orchestrate.js` — end-to-end project orchestration (7-phase guided plans)
- `memory/indexed-learnings.json` — indexed memory structure (auto-generated)
- `memory/skillopt-state.json` + `memory/skillopt-log.jsonl` — improvement tracking
- 16 new regression tests (routing, indexed memory, skillopt, orchestrator)
- Compound routing: combines 3-5 skills for complex tasks
- Relevant learnings surfaced alongside routing results

### Changed
- `scripts/route-task.js` — rewritten with TF-IDF scoring, n-gram matching, cosine similarity
- All 16 skills now pass validation with 0 warnings (added Overview, Process, Common Mistakes where missing)
- `SKILL.md` — updated pipeline: indexed retrieval (Phase 0), semantic routing (Phase 4), SkillOpt (Phase 5)
- `CONTEXT.md` — added 4 new terms (Indexed Memory, SkillOpt, Compound Routing, Orchestration)
- `AGENTS.md` — added automation scripts table
- `CONTRIBUTING.md` — updated with new validation requirements and scaffold command
- `README.md` — updated badges (v1.2.0, 98 tests), structure, quality proof
- Test count: 82 → 98

## [1.1.0] - 2026-06-04

### Added
- `/grill` skill — interview yourself before building anything
- `/prove-it` skill — prevents false completion claims
- `/diagnose` skill — systematic debugging loop
- `/handoff` skill — session continuity documents
- `/zoom-out` skill — forced perspective shifts
- `evals/` directory — behavioral proof scenarios
- `bin/skill-forge.js` CLI — 7 commands (discover, validate, test, status, self-check, publish, route)
- `scripts/publish.js` — automated marketplace submission pipeline
- `CONTEXT.md` — shared vocabulary (mattpocock technique)
- `.cursor-plugin/` + `.claude-plugin/` — platform manifests

### Changed
- All skills upgraded from reference → behavioral (persistence rules, auto-triggers)
- README rewritten as narrative (problem→fix framing)
- web-perf: now measure-first loop discipline
- db-schema: now queries-first discipline
- git-workflow: now enforced discipline with auto-triggers

### Removed
- 4 standalone repos deleted (consolidated into collection)

## [1.0.0] - 2026-06-04

### Added
- Initial release with 7 skills
- Meta-agent (root SKILL.md)
- Memory system (RL state, learnings, gaps)
- Discovery engine (GitHub, Exa, Bright Data)
- Analysis + scoring pipeline
- Template system for new repos
- 53-test validation suite
