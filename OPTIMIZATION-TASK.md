# skill-forge Optimization Task — Full Context Prompt

## TASK

Optimize skill-forge's memory storage, access patterns, and decision-making capabilities. When invoked with a task or project description, skill-forge must have instant access to ALL accumulated knowledge — novel thinking approaches, optimization patterns, end-to-end project guidance. It must find, install, and USE the best skills effectively.

Additionally: introduce a prompt engineering self-improvement loop that continuously upgrades skills for better output, performance, research, decision-making, self-validation, and testing. No lazy implementation — throw compute at getting the BEST output, not just completing a checklist.

---

## CONTEXT (from prior session)

### What skill-forge IS

Location: `C:\Users\aditj\.cursor\skills\skill-forge\SKILL.md` (344 lines)
Repo: `C:\Users\aditj\New Projects\skill-forge` (GitHub: Adit-Jain-srm/skill-forge)

An intelligence amplifier with TWO objectives:
1. **Self-improvement** — faster, better each cycle
2. **Reputation (stars)** — create skills people switch for

### Current State
- 16 skills in `skills/` directory
- 40 devoured reference skills in `.agents/skills/`
- 82 tests passing
- 9 scripts (discover, analyze, route-task, install, scaffold-repo, rl-update, self-improve, validate-skill, publish, capafy-publish)
- CLI: `bin/skill-forge.js`
- Memory: `memory/` (rl-state.json, learnings.json, discovered-skills.json, gaps.json, published.json, reputation-playbook.json, evolution-log.jsonl, self-checks.jsonl)
- Platform: .cursor-plugin, .claude-plugin, AGENTS.md, CLAUDE.md, CONTEXT.md
- Published on GitHub, Capafy (pending review), skills-market PR #3

### Key Learnings Accumulated (30+ patterns, apply ALL)

1. **SHORT skills win** — grill-me is 10 lines (50K installs). mattpocock's most popular skills are 10-110 lines. Verbose = bad.
2. **Problem→Fix framing** — frame as pain elimination, not feature description
3. **BEHAVIORAL > REFERENCE** — skills that change HOW agent operates beat reference tables
4. **CSO (Claude Search Optimization)** — description = WHEN to use only, NEVER summarize workflow (agents shortcut descriptions, skip body)
5. **Priority tables with prefixes** — Supabase/Vercel pattern: `| Priority | Category | Impact | Prefix |` for instant scanning
6. **references/ for depth** — SKILL.md stays concise, detail lives in reference files
7. **Rationalization resistance** — discipline skills need: Red Flags + Rationalization table (excuse→reality)
8. **Validate against the absolute best** — before shipping anything, find the best, study it, surpass it
9. **Use installed skills as pipeline** — grill before creating, writing-skills TDD for authoring, verification before claiming done
10. **SkillOpt training loop** (Microsoft) — rollout→reflect→aggregate→select→update→evaluate
11. **CONTEXT.md = glossary ONLY** — never implementation details, never specs
12. **Promote actively** — find GitHub issues our skills solve, comment authentically
13. **Collections > single files** — ecosystem with docs, tests, CLI, manifests gets stars
14. **First-mover on new features** — target platform features announced THIS WEEK (zero competition window: 1-2 weeks)
15. **Each cycle must be FASTER than the last** — RL penalizes regression

### Architecture

```
skill-forge/
├── SKILL.md                 # Intelligence amplifier (344 lines)
├── CONTEXT.md               # Shared vocabulary
├── AGENTS.md, CLAUDE.md     # Agent instructions
├── skills/                  # 16 behavioral skills
│   ├── prove-it/            # Evidence before completion claims
│   ├── self-review/         # Auto-review before presenting
│   ├── grill/               # Decision tree before building
│   ├── diagnose/            # Systematic debugging loop
│   ├── context-builder/     # Generate CONTEXT.md for any project
│   ├── zoom-out/            # Perspective before modifying
│   ├── handoff/             # Session continuity
│   ├── session-guard/       # Prevent long-session corruption
│   ├── dynamic-workflow/    # Fan-out parallel subagents
│   ├── mcp-conductor/       # Multi-MCP orchestration
│   ├── git-workflow/        # Enforced git discipline
│   ├── web-perf/            # Core Web Vitals loop
│   ├── error-resilience/    # Retry, circuit breakers
│   ├── arch-from-code/      # Architecture from codebase
│   ├── db-schema/           # Queries-first schema design
│   └── setup/               # One-time configuration
├── .agents/skills/          # 40 devoured reference skills
├── scripts/                 # 9+ automation scripts
├── memory/                  # Persistent RL state + learnings
├── evals/                   # Behavioral proof scenarios
├── tests/                   # 82-test validation suite
├── bin/                     # CLI
└── docs/                    # Setup guides
```

### What Needs To Be Done (the optimization task)

1. **Memory optimization** — learnings.json is flat. Needs: indexed access by category, fast retrieval for routing, priority ordering, staleness detection. When user describes a task, relevant learnings should surface INSTANTLY.

2. **Decision-making upgrade** — current pipeline is sequential. Should: score multiple approaches simultaneously, use ALL devoured skills as reference patterns, propose architectures based on what worked for 116K-star repos.

3. **Prompt engineering self-improvement loop** — after every skill is used, measure: did it produce EXCELLENT output? If not, what prompt change would improve it? Apply the change. SkillOpt-inspired (rollout→reflect→aggregate→select→update→evaluate).

4. **Skill routing upgrade** — current `route-task.js` uses basic token matching. Should: semantic matching against all 40+ devoured skills, compound routing (combine 3-5 skills for complex tasks), discover external skills on-the-fly if nothing installed matches.

5. **End-to-end project mode** — when user describes a project, skill-forge should: grill → research approaches → propose architecture → route to best skills → guide implementation → review output → improve for next time. Not just "find a skill" — ORCHESTRATE the whole thing.

6. **No lazy implementation** — every optimization should be validated. Run tests. Prove it works. Self-check. If it's not excellent, fix it before moving on.

### Critical Files to Read First

- `C:\Users\aditj\New Projects\skill-forge\SKILL.md` — the main skill (read for current pipeline)
- `C:\Users\aditj\New Projects\skill-forge\memory\learnings.json` — all 30+ accumulated patterns
- `C:\Users\aditj\New Projects\skill-forge\memory\evolution-log.jsonl` — what changed and why
- `C:\Users\aditj\New Projects\skill-forge\scripts\route-task.js` — current routing (needs upgrade)
- `C:\Users\aditj\New Projects\skill-forge\scripts\self-improve.js` — current self-improvement (needs expansion)
- `C:\Users\aditj\New Projects\skill-forge\.agents\skills\skill-creator\SKILL.md` — Anthropic's approach to eval + improve loops (485 lines of methodology)
- `C:\Users\aditj\New Projects\skill-forge\.agents\skills\grill-with-docs\SKILL.md` — mattpocock's CONTEXT.md technique
- `C:\Users\aditj\New Projects\skill-forge\.agents\skills\vercel-react-best-practices\SKILL.md` — priority-table + prefix pattern
- `C:\Users\aditj\New Projects\skill-forge\.agents\skills\supabase-postgres-best-practices\SKILL.md` — same pattern, different domain

### Constraints

- SKILL.md must stay under 500 lines (progressive disclosure for depth)
- All changes must pass: `node tests/run-tests.js` (currently 82 tests)
- All skills must pass: `node scripts/validate-skill.js skills/<name>`
- Use `writing-skills` TDD methodology for any new skill creation
- Apply CSO rules to all descriptions
- GitHub: push to `Adit-Jain-srm/skill-forge` on main branch
- Network: use `git -c http.version=HTTP/1.1 push` (HTTP/2 fails intermittently)

### Install Command for This Skill
```bash
npx skills@latest add Adit-Jain-srm/skill-forge
```

---

## INSTRUCTIONS FOR THE NEW SESSION

1. Read the SKILL.md and memory files first
2. Apply the `grill` pattern to yourself: what exactly needs to change? Why? What's the MVP?
3. Implement the memory optimization (indexed access, category tagging, instant retrieval)
4. Implement the prompt engineering self-improvement loop (SkillOpt-inspired)
5. Upgrade route-task.js to semantic matching with compound routing
6. Add end-to-end project orchestration mode
7. After EACH change: run tests, validate, self-check
8. Push to GitHub when stable
9. Update SKILL.md if the pipeline changes

NO LAZY IMPLEMENTATION. Throw compute at quality. Every decision validated. Every output excellent.
