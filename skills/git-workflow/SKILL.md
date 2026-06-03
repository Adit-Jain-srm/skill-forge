---
name: git-workflow
description: >-
  Automate advanced git workflows beyond basic commits. Smart branching strategies,
  PR description generation, changelog automation, release management, monorepo
  navigation, conflict resolution, and commit archaeology. Use when the user
  mentions git workflow, branching strategy, release management, PR templates,
  changelog generation, monorepo, git history, rebase strategy, or asks about
  git best practices beyond basic add/commit/push.
---

# Git Workflow Automation

Advanced git workflows that AI agents should know but usually don't.

## Branching Strategies

### When to Use What

| Strategy | Team Size | Deploy Frequency | Use When |
|----------|-----------|-----------------|----------|
| **Trunk-based** | Any | Multiple/day | CI/CD mature, feature flags available |
| **GitHub Flow** | 2-10 | Daily-weekly | Simple PRs, one production branch |
| **GitFlow** | 10+ | Scheduled releases | Enterprise, multiple versions supported |
| **Release branches** | 5+ | Bi-weekly+ | Need release stabilization period |

### Trunk-Based (Recommended Default)

```bash
# Short-lived feature branch (< 2 days)
git checkout -b feat/add-auth
# ... work ...
git push -u origin feat/add-auth
gh pr create --title "feat: add auth" --body "..."
# Merge same day or next day. Delete branch.
```

Rules:
- Branches live < 2 days
- Feature flags for incomplete work
- CI must pass before merge
- Squash merge to keep history clean

## PR Description Generation

When creating a PR, generate the description from the diff:

```bash
# Get the diff summary for PR body
git log --oneline main..HEAD
git diff --stat main..HEAD

# Template:
## What
# [One sentence: what changed]

## Why  
# [Context: why this change was needed]

## How
# [Key technical decisions]

## Testing
# [How this was verified]
```

## Changelog Automation

### Conventional Commits → Changelog

```bash
# Categorize commits since last tag
git log --pretty=format:"%s" v1.2.0..HEAD | sort

# Group by type:
# feat: → ## Features
# fix: → ## Bug Fixes  
# perf: → ## Performance
# BREAKING CHANGE: → ## Breaking Changes
```

### Automated Version Bump

```bash
# Determine version bump from commits
# feat → minor, fix → patch, BREAKING → major
git log --pretty=format:"%s" $(git describe --tags --abbrev=0)..HEAD

# Apply:
npm version patch  # or minor/major
git push --follow-tags
```

## Release Management

### Release Checklist

```bash
# 1. Ensure clean state
git status  # must be clean
git pull origin main

# 2. Run full test suite
npm test && npm run lint && npm run build

# 3. Update changelog
# (automated from conventional commits)

# 4. Bump version
npm version minor -m "release: v%s"

# 5. Push with tags
git push origin main --follow-tags

# 6. Create GitHub release
gh release create v$(node -p "require('./package.json').version") \
  --generate-notes --latest
```

## Monorepo Navigation

### Finding What Changed

```bash
# Which packages changed since last release?
git diff --name-only v1.0.0..HEAD | grep "^packages/" | cut -d/ -f2 | sort -u

# Only run tests for changed packages
CHANGED=$(git diff --name-only origin/main...HEAD | grep "^packages/" | cut -d/ -f2 | sort -u)
for pkg in $CHANGED; do
  cd "packages/$pkg" && npm test && cd ../..
done
```

### Dependency-Aware Changes

```bash
# If package A changed, find all packages that depend on A
# Then test those too (blast radius)
grep -rl "\"package-a\"" packages/*/package.json | cut -d/ -f2
```

## Conflict Resolution Strategies

### Before Resolving

```bash
# Understand what diverged
git log --oneline --graph main..HEAD
git log --oneline --graph HEAD..main

# See which files conflict
git diff --name-only --diff-filter=U
```

### Resolution Patterns

| Conflict Type | Strategy |
|---------------|----------|
| Both modified same function | Understand BOTH intents, merge manually |
| One refactored, one added | Apply addition to refactored version |
| Package lock conflicts | Accept theirs, re-run install |
| Auto-generated files | Regenerate after resolving source |

## Commit Archaeology

### Finding When/Why Something Changed

```bash
# Who last changed this line?
git blame -L 42,42 src/auth.ts

# When was this function introduced?
git log --diff-filter=A --all -- "**/functionName*"

# Full history of a file (even renames)
git log --follow -p -- src/auth.ts

# Find the commit that broke something
git bisect start
git bisect bad HEAD
git bisect good v1.0.0
# git bisect runs binary search to find the breaking commit
```

## Common Mistakes

- Committing directly to main (use branch protection)
- Merge commits that pollute history (use squash merge)
- Not rebasing before PR review (causes unnecessary conflicts)
- Force-pushing shared branches (data loss)
- Huge PRs that are impossible to review (keep < 400 lines)
- Not using conventional commits (breaks changelog automation)
- Ignoring `.gitattributes` for binary files and line endings
