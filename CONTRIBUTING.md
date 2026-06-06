# Contributing to skill-forge

Thank you for contributing! This project ships production-grade AI agent skills.

## Quality Bar

Every skill MUST have:

### Required Structure
```
skills/skill-name/
├── SKILL.md           # Main skill (YAML frontmatter + markdown)
└── references/        # Optional: detail files for progressive disclosure
```

### SKILL.md Anatomy

Every skill follows this structure:

1. **YAML Frontmatter** — `name` (kebab-case, max 64 chars) + `description` (starts with what it does, includes "Use when" triggers)
2. **Overview** — What this skill does and why (2-3 sentences)
3. **Process/Workflow** — Step-by-step guidance with code examples
4. **Common Mistakes** — Pitfalls with fixes (3-5 items)
5. **Verification** or **Persistence** — How to confirm it worked / when it stays active

### Validation (must pass before submitting)

```bash
node scripts/validate-skill.js skills/your-skill-name
```

Must produce: `✓ VALID` with **zero warnings**.

### Quality Checks Before Submitting

- [ ] SKILL.md under 500 lines (use `references/` for detail)
- [ ] Description is third-person, includes WHAT + WHEN
- [ ] Zero validation warnings (run validator above)
- [ ] Frames a PROBLEM → FIX (not "a tool that does X")
- [ ] Behavioral: changes how the agent OPERATES, not just what it knows
- [ ] Code examples are copy-paste ready (not pseudocode)
- [ ] Tested against at least one real scenario
- [ ] Would YOU switch from your current approach to use this? Be honest.

### What NOT to Do

- Don't submit skills that are just rewritten documentation
- Don't duplicate what other skills already cover — reference them
- Don't add theory without practice (every concept needs a code example)
- Don't pad with filler to look impressive (10 excellent lines > 200 mediocre)
- Don't submit without reading 3+ existing skills first (match the quality)

## Adding a New Skill

1. Fork the repo
2. Run `node scripts/scaffold-repo.js --name "your-skill" --description "..." --dir skills/your-skill`
3. Edit `skills/your-skill/SKILL.md` following the anatomy above
4. Run `node scripts/validate-skill.js skills/your-skill` — must pass with 0 warnings
5. Run `node tests/run-tests.js` — all tests must still pass
6. Open a PR with: what gap this fills, who it helps, why existing skills don't cover it

## Running the Full Test Suite

```bash
node tests/run-tests.js          # All 98 tests
node scripts/validate-skill.js skills/<name>  # Single skill
node scripts/route-task.js "task description" # Test routing
```

## Reporting Issues

If a skill gives bad advice, open an issue with:
- Which skill
- What scenario triggered it
- What it recommended vs what should have been recommended
- Platform (Cursor, Claude Code, Codex, etc.)

## Code of Conduct

Be excellent to each other. Focus on quality, not quantity. One skill that changes how people work > ten that sit unread.
