# skill-forge

**Autonomous self-improving AI agent that devours skills across the internet, learns from every one, identifies gaps, creates novel skills, and publishes them.**

> If it lacks something — find it. If nothing seems missing — find something to reveal what's missing.

## What This Is

skill-forge is a Cursor Skill (`SKILL.md`) that operates as a meta-agent:

1. **Discovers** — Vacuums GitHub, skills.sh, LobeHub, Exa, Bright Data for new skills
2. **Analyzes** — Reads each skill, extracts patterns, philosophy, novel ideas, scores novelty
3. **Learns** — Accumulates knowledge in a persistent memory system with RL-weighted preferences
4. **Identifies Gaps** — Runs anti-laziness scans ("what's missing that SHOULD exist?")
5. **Creates** — Generates high-quality skills that fill identified gaps
6. **Publishes** — Ships repos to GitHub, compatible with `npx skills add`
7. **Self-Improves** — Rewrites its own heuristics based on outcomes (RL + SkillOpt-inspired training)

## Install

```bash
npx skills add Adit-Jain-srm/skill-forge
```

Or manually:
```bash
git clone https://github.com/Adit-Jain-srm/skill-forge.git
cp -r skill-forge ~/.cursor/skills/skill-forge
```

## Invocation

```
skill-forge              — Full pipeline (discover → analyze → decide → act → learn → improve)
skill-forge discover     — Vacuum all sources for new skills
skill-forge route <task> — Find best skills for a task
skill-forge create <gap> — Create and publish a skill for an identified gap
skill-forge devour       — Maximum aggression: discover all, learn all, create to fill gaps
skill-forge loop         — Continuous autonomous mode (30-min cycles)
skill-forge empire       — Portfolio review: stars, growth, strategic planning
skill-forge status       — Knowledge base stats
skill-forge improve      — Force self-improvement cycle
```

## Architecture

```
skill-forge/
├── SKILL.md              # Master orchestrator (218 lines)
├── reference.md          # Detailed pipeline docs + MCP commands
├── scripts/
│   ├── discover.js       # Multi-source discovery engine
│   ├── analyze.js        # SKILL.md reader + pattern extractor
│   ├── route-task.js     # Task-to-skill matching with RL weights
│   ├── install.js        # Skill installer (npx + manual + MCP)
│   ├── scaffold-repo.js  # New repo creation for publishing
│   ├── rl-update.js      # Reinforcement learning (EMA-based)
│   └── self-improve.js   # Monitoring + weakness analysis
├── memory/
│   ├── rl-state.json           # RL weights (sources, categories, routing)
│   ├── discovered-skills.json  # All known skills catalog
│   ├── learnings.json          # Extracted patterns + philosophies
│   ├── gaps.json               # Ecosystem gaps (creation targets)
│   ├── published.json          # Our shipped repos + metrics
│   ├── reputation-playbook.json # What makes skills get stars
│   └── evolution-log.jsonl     # Append-only self-improvement history
└── templates/skill-repo/       # Templates for new skill repos
```

## Philosophy

- **NO LIMITATIONS TO LEARNING** — The internet is the perimeter. Follow trails wherever they lead.
- **ANTI-LAZINESS** — If nothing seems missing, look harder. Everything is incomplete until proven otherwise.
- **GREED** — Stars are currency. Quantity WITH quality. Dominate categories.
- **REPUTATION** — Every published skill must trigger "I NEED this" in 5 seconds.

## Reinforcement Learning

skill-forge uses EMA-based RL to continuously improve:
- Sources that yield novel skills get higher weight
- Categories where creations succeed get prioritized
- Routing accuracy improves from feedback
- Self-improvement loops that yield measurable gains get reinforced

## Compatibility

Works with any agent supporting the [SKILL.md standard](https://agentskills.io/specification):
- Cursor
- Claude Code
- GitHub Copilot (Codex CLI)
- Windsurf
- Gemini CLI
- And 40+ others

## License

MIT
