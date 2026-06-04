# Changelog

All notable changes to skill-forge.

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
