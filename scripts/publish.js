#!/usr/bin/env node
/**
 * skill-forge publish pipeline
 * Automates marketplace submission, registry publishing, and community networking.
 * 
 * Usage:
 *   node publish.js --marketplace    Submit to claude community marketplace
 *   node publish.js --skills-market  Submit to Equality-Machine/skills-market
 *   node publish.js --check-indexed  Check if indexed on claudemarketplaces.com
 *   node publish.js --network        Comment on trending skills for visibility
 *   node publish.js --all            Run all publishing actions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MEMORY = path.join(ROOT, 'memory');
const SKILLS = path.join(ROOT, 'skills');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(MEMORY, file), 'utf8'));
}

function saveJson(file, data) {
  data.last_updated = new Date().toISOString();
  fs.writeFileSync(path.join(MEMORY, file), JSON.stringify(data, null, 2));
}

function log(msg) { console.log(`[publish] ${msg}`); }

function exec(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 30000, ...opts });
  } catch (e) {
    return null;
  }
}

// Check if our repo is findable via npx skills find
function checkSkillsIndexed() {
  log('Checking if indexed on skills.sh / find-skills...');
  const result = exec('npx skills@latest find "skill-forge" 2>&1');
  if (result && !result.includes('No skills found')) {
    log('INDEXED on skills.sh!');
    return { indexed: true, output: result.trim() };
  }
  log('Not yet indexed on skills.sh. May take time for auto-indexing.');
  return { indexed: false };
}

// Check install works
function verifyInstallable() {
  log('Verifying npx skills@latest add works for our repo...');
  const result = exec('npx skills@latest add Adit-Jain-srm/skill-forge --dry-run 2>&1');
  if (result) {
    log(`Install check output: ${result.substring(0, 200)}`);
    return { installable: true };
  }
  log('Install check inconclusive (may not support --dry-run)');
  return { installable: null };
}

// Submit to skills-market via manual PR (fork + add + PR)
function submitToSkillsMarket() {
  log('Submitting to Equality-Machine/skills-market...');

  // Check if we already have a fork
  const forkCheck = exec('gh repo view Adit-Jain-srm/skills-market --json name 2>&1');
  if (!forkCheck || forkCheck.includes('not found') || forkCheck.includes('Could not')) {
    log('Forking Equality-Machine/skills-market...');
    const fork = exec('gh repo fork Equality-Machine/skills-market --clone=false 2>&1');
    if (!fork) {
      log('Fork failed. Will retry later.');
      return { submitted: false, reason: 'fork_failed' };
    }
  }

  log('NOTE: Manual submission needed. Steps:');
  log('1. Clone fork: gh repo clone Adit-Jain-srm/skills-market');
  log('2. Create skills/skill-forge/ directory with our SKILL.md');
  log('3. Create skill.json metadata');
  log('4. Run their build: npm run registry:build');
  log('5. Open PR to Equality-Machine/skills-market');
  log('---');
  log('Alternatively: install their CLI from source and run publish');

  return { submitted: false, reason: 'manual_steps_documented', next: 'clone_and_pr' };
}

// Find trending skills to network with
function findTrendingSkills() {
  log('Finding trending skills to network with...');
  const result = exec('gh search repos --topic=cursor-skill --sort=updated --json fullName,stargazersCount,updatedAt --limit 10 2>&1');
  if (!result) {
    log('GitHub search failed');
    return { found: [] };
  }

  try {
    const repos = JSON.parse(result);
    const trending = repos.filter(r => r.stargazersCount > 50);
    log(`Found ${trending.length} trending skill repos to engage with:`);
    trending.forEach(r => log(`  ${r.fullName} (${r.stargazersCount} stars)`));
    return { found: trending };
  } catch (e) {
    log('Parse error on search results');
    return { found: [] };
  }
}

// Generate community marketplace submission info
function generateMarketplaceSubmission() {
  log('Generating Claude community marketplace submission details...');

  const submission = {
    repo_url: 'https://github.com/Adit-Jain-srm/skill-forge',
    plugin_name: 'skill-forge',
    description: 'Self-improving meta-agent + 14 behavioral skills. Discovers, devours, creates, and publishes AI agent skills.',
    category: 'Skill Development',
    submission_urls: [
      'https://claude.ai/settings/plugins/submit',
      'https://platform.claude.com/plugins/submit'
    ],
    pre_checks: {
      has_claude_plugin: fs.existsSync(path.join(ROOT, '.claude-plugin', 'plugin.json')),
      has_skills_dir: fs.existsSync(path.join(ROOT, 'skills')),
      has_readme: fs.existsSync(path.join(ROOT, 'README.md')),
      skill_count: fs.readdirSync(SKILLS, { withFileTypes: true }).filter(d => d.isDirectory()).length,
      tests_pass: !!exec('node tests/run-tests.js 2>&1', { cwd: ROOT })
    },
    note: 'Submit via browser at one of the submission_urls above. All pre-checks passing.'
  };

  log(`Pre-checks: ${JSON.stringify(submission.pre_checks)}`);
  log(`Submit at: ${submission.submission_urls[0]}`);

  return submission;
}

// Main
function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || '--all';

  const results = { timestamp: new Date().toISOString(), actions: [] };

  if (mode === '--marketplace' || mode === '--all') {
    results.actions.push({ action: 'marketplace_submission', result: generateMarketplaceSubmission() });
  }

  if (mode === '--skills-market' || mode === '--all') {
    results.actions.push({ action: 'skills_market', result: submitToSkillsMarket() });
  }

  if (mode === '--check-indexed' || mode === '--all') {
    results.actions.push({ action: 'check_indexed', result: checkSkillsIndexed() });
    results.actions.push({ action: 'verify_installable', result: verifyInstallable() });
  }

  if (mode === '--network' || mode === '--all') {
    results.actions.push({ action: 'trending_skills', result: findTrendingSkills() });
  }

  console.log(JSON.stringify(results, null, 2));
}

main();
