# skill-forge

**Production-grade AI agent skills + an autonomous engine that discovers, learns from, and creates more.**

5 specialized skills covering MCP orchestration, web performance, git workflows, and database design — plus a self-improving meta-agent that continuously expands the collection.

---

## Skills

| Skill | What It Does | Key Triggers |
|-------|-------------|-------------|
| [`mcp-conductor`](skills/mcp-conductor/) | Orchestrate multiple MCP servers in research/analysis pipelines | multi-source, research, combine tools |
| [`web-perf`](skills/web-perf/) | Diagnose and fix Core Web Vitals (LCP, INP, CLS) | slow page, lighthouse, page speed, bundle size |
| [`git-workflow`](skills/git-workflow/) | Advanced git: branching, releases, monorepos, archaeology | branching strategy, release, monorepo, git history |
| [`db-schema`](skills/db-schema/) | Production database design: indexes, migrations, multi-tenancy | schema, migration, indexing, multi-tenant |

Each skill follows the [anatomy standard](docs/skill-anatomy.md) — actionable, code-heavy, battle-tested.

---

## Quick Start

<details>
<summary><b>Cursor</b></summary>

```bash
npx skills add Adit-Jain-srm/skill-forge
```

Or manually copy `skills/` to `~/.cursor/skills/`.

</details>

<details>
<summary><b>Claude Code</b></summary>

```bash
git clone https://github.com/Adit-Jain-srm/skill-forge.git
claude --plugin-dir ./skill-forge
```

</details>

<details>
<summary><b>Codex CLI</b></summary>

```bash
git clone https://github.com/Adit-Jain-srm/skill-forge.git
# Add skills/ path to your AGENTS.md or ~/.codex/skills/
```

</details>

<details>
<summary><b>Gemini CLI</b></summary>

```bash
gemini skills install https://github.com/Adit-Jain-srm/skill-forge.git --path skills
```

</details>

<details>
<summary><b>Windsurf</b></summary>

Copy any `SKILL.md` from `skills/` into your Windsurf rules directory.

</details>

---

## The Meta-Agent

The root `SKILL.md` is itself a skill — an autonomous discovery and creation engine:

```
skill-forge              — Full pipeline (discover → analyze → decide → act → learn)
skill-forge discover     — Vacuum the internet for new skills
skill-forge route <task> — Find the best skill for your task
skill-forge create       — Generate and publish a new skill
skill-forge devour       — Maximum learning + creation mode
```

It uses:
- **Exa MCP** for semantic web search
- **Bright Data MCP** for scraping any URL
- **GitHub CLI** for repo discovery and publishing
- **Reinforcement Learning** (EMA-based) to improve over time

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [Getting Started](docs/getting-started.md) | Installation for all platforms |
| [Skill Anatomy](docs/skill-anatomy.md) | How skills are structured |
| [Contributing](CONTRIBUTING.md) | How to add new skills |

---

## Quality Bar

Every skill is validated against:
- Under 500 lines (progressive disclosure for depth)
- Valid YAML frontmatter with trigger conditions
- Actionable code examples (not pseudocode)
- Common mistakes section (what NOT to do)
- No vague advice — every instruction answers "what do I DO?"

Run validation: `node scripts/validate-skill.js skills/<name>`

---

## Project Structure

```
skill-forge/
├── SKILL.md              # Meta-agent (discovery + creation engine)
├── skills/               # The skill collection
│   ├── mcp-conductor/    # Multi-MCP orchestration
│   ├── web-perf/         # Core Web Vitals optimization
│   ├── git-workflow/     # Advanced git workflows
│   └── db-schema/        # Production database design
├── scripts/              # Automation (discovery, analysis, validation, RL)
├── memory/               # Persistent state (RL weights, learnings, gaps)
├── templates/            # Templates for new skill repos
└── docs/                 # Setup guides + contributing standards
```

---

## Philosophy

- **Anti-laziness:** If it lacks something — find it, use it. If nothing seems missing — look harder.
- **No limitations:** Follow trails wherever they lead. Blog → paper → code → community → synthesis.
- **Quality over speed:** One excellent skill > ten mediocre ones.
- **User perspective:** Every skill must make the agent MEASURABLY better at the task.

---

## License

MIT
