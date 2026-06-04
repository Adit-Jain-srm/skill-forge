<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,14,25,27&height=200&section=header&text=skill-forge&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Intelligence%20Amplifier%20%E2%80%A2%2016%20Skills%20%E2%80%A2%20Self-Improving&descSize=20&descAlignY=55" width="100%"/>
</p>

<p align="center">
  <a href="https://github.com/Adit-Jain-srm/skill-forge"><img src="https://img.shields.io/badge/version-1.1.0-blue.svg?style=for-the-badge" alt="Version"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge" alt="License"/></a>
  <a href="https://github.com/Adit-Jain-srm/skill-forge/stargazers"><img src="https://img.shields.io/github/stars/Adit-Jain-srm/skill-forge?style=for-the-badge&color=yellow" alt="Stars"/></a>
  <a href="https://github.com/Adit-Jain-srm/skill-forge"><img src="https://img.shields.io/badge/skills-16-purple.svg?style=for-the-badge" alt="Skills"/></a>
  <a href="https://github.com/Adit-Jain-srm/skill-forge"><img src="https://img.shields.io/badge/tests-82_passing-brightgreen.svg?style=for-the-badge" alt="Tests"/></a>
</p>

<p align="center">
  <b>Your agent keeps using the same stale knowledge. These skills fix that — straight from my daily workflow.</b>
</p>

---

## The Problem

Your AI coding agent has a fixed set of capabilities. Meanwhile, 20,000+ skills exist on marketplaces, new patterns emerge weekly, and the agent you set up last month is already behind.

You don't have time to browse, evaluate, and install manually. You need an agent that **feeds itself**.

## The Fix

skill-forge is a self-improving intelligence amplifier that:
1. **Hunts** — Discovers skills across GitHub, marketplaces, blogs, communities
2. **Devours** — Reads deeply, extracts philosophy and novel techniques
3. **Judges** — Validates against the absolute best, rejects mediocrity
4. **Acts** — Installs what fills gaps, creates what doesn't exist
5. **Ships** — Publishes as repos others can install
6. **Evolves** — Rewrites its own heuristics based on outcomes

---

## Quick Start

```bash
npx skills@latest add Adit-Jain-srm/skill-forge
```

<details>
<summary><b>Claude Code</b></summary>

```bash
/plugin marketplace add Adit-Jain-srm/skill-forge
/plugin install skill-forge@Adit-Jain-srm
```

Or local:
```bash
git clone https://github.com/Adit-Jain-srm/skill-forge.git
claude --plugin-dir ./skill-forge
```
</details>

<details>
<summary><b>Codex CLI</b></summary>

```bash
git clone https://github.com/Adit-Jain-srm/skill-forge.git
cp -r skill-forge/skills/* ~/.codex/skills/
```
</details>

<details>
<summary><b>Gemini CLI / Windsurf / Other</b></summary>

```bash
git clone https://github.com/Adit-Jain-srm/skill-forge.git
# Copy skills/ to your agent's skill directory
```
</details>

---

## 16 Skills — Each Solves a Named Problem

| # | Problem | Skill | What Changes |
|---|---------|-------|-------------|
| 1 | "Agent says 'done' but it's NOT" | **prove-it** | Forces evidence before any completion claim |
| 2 | "Agent shows buggy first drafts" | **self-review** | Reviews own code BEFORE presenting |
| 3 | "Building the wrong thing" | **grill** | Interview yourself until every decision is resolved |
| 4 | "Something broken, don't know why" | **diagnose** | Forced loop: reproduce → minimise → hypothesise → fix |
| 5 | "Agent doesn't speak my language" | **context-builder** | Builds shared vocabulary. 50-75% less verbosity |
| 6 | "Lost in unfamiliar code" | **zoom-out** | Forces perspective before modifying anything |
| 7 | "Need to continue later" | **handoff** | Compacts session into doc another agent picks up |
| 8 | "Long sessions degrade" | **session-guard** | Monitors health, splits proactively before corruption |
| 9 | "Complex task needs parallel work" | **dynamic-workflow** | Fan-out 10-100 subagents with verification gates |
| 10 | "Agent uses one tool, should chain 5" | **mcp-conductor** | Multi-MCP orchestration pipelines |
| 11 | "Git history is unreadable" | **git-workflow** | Enforced discipline: atomic commits, PR readiness |
| 12 | "Site is slow, don't know why" | **web-perf** | Measure-first loop: baseline → identify → fix → re-measure |
| 13 | "Code breaks in production" | **error-resilience** | Retry, circuit breakers, graceful degradation |
| 14 | "Nobody knows the architecture" | **arch-from-code** | Generates diagrams from actual codebase analysis |
| 15 | "Database breaks at scale" | **db-schema** | Queries-first discipline before every DDL |
| 16 | "First-time setup confusing" | **setup** | One-time preference config all skills consume |

---

## The Meta-Agent

The root `SKILL.md` is itself an intelligence amplifier:

```bash
skill-forge              # Full pipeline (discover → judge → act → learn → improve)
skill-forge route <task> # "What skill solves this?" → best match + invocation prompt
skill-forge create       # Validate-against-best → Create → Ship → Promote
skill-forge devour       # Maximum: learn everything, apply everything, faster each cycle
skill-forge guide <proj> # Apply ALL learnings to your project
skill-forge hackathon    # Creative ideation with latest approaches
skill-forge promote      # Advertise published skills across platforms
skill-forge improve      # Force self-check + meta-optimize
skill-forge status       # Metrics for both objectives
```

---

## Design Philosophy

> "The rate of feedback is your speed limit." — *The Pragmatic Programmer*

> "Invest in the design of the system every day." — *Kent Beck*

> "The best modules are deep: a lot of functionality through a simple interface." — *John Ousterhout*

**Applied to skills:**
- Each solves a NAMED PROBLEM (not "a tool that does X")
- Behavioral change > reference material
- Self-improvement is mandatory, not optional
- NEVER ship without validating against the absolute best
- The internet is the perimeter. NO LIMITATIONS TO LEARNING.

---

## Quality Proof

```
✓ 82 automated tests (structure, skills, scripts, memory, plugins, quality)
✓ 16/16 skills pass validation
✓ CLI with 8 commands (discover, validate, test, status, self-check, publish, monetize, route)
✓ Evals directory with behavioral proof scenarios
✓ Platform manifests (.cursor-plugin, .claude-plugin)
✓ CONTEXT.md shared vocabulary
✓ CI-ready (run: node tests/run-tests.js)
```

---

## Project Structure

```
skill-forge/
├── SKILL.md                 # Intelligence amplifier (meta-agent)
├── CONTEXT.md               # Shared vocabulary
├── AGENTS.md                # Agent instructions
├── CLAUDE.md                # Claude-specific context
├── skills/                  # 16 behavioral skills
├── scripts/                 # 9 automation scripts
├── bin/                     # CLI (npx skill-forge <cmd>)
├── memory/                  # Persistent RL state + learnings
├── evals/                   # Behavioral proof scenarios
├── hooks/                   # Cursor invocation tracking
├── tests/                   # 82-test validation suite
├── docs/                    # Setup guides + skill anatomy
├── templates/               # Scaffolding for new skills
├── .cursor-plugin/          # Cursor marketplace manifest
└── .claude-plugin/          # Claude marketplace manifest
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Key rule: every skill must solve a **named problem**, not describe a feature. See [docs/skill-anatomy.md](docs/skill-anatomy.md) for the quality bar.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Adit-Jain-srm/skill-forge&type=Date)](https://star-history.com/#Adit-Jain-srm/skill-forge&Date)

---

## License

MIT — See [LICENSE](LICENSE)

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,14,25,27&height=100&section=footer" width="100%"/>
</p>
