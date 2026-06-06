#!/usr/bin/env node
/**
 * Test suite for skill-forge
 * Validates all skills, scripts, and memory integrity.
 * 
 * Usage: node tests/run-tests.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const SCRIPTS_DIR = path.join(ROOT, 'scripts');
const MEMORY_DIR = path.join(ROOT, 'memory');

let passed = 0;
let failed = 0;
let skipped = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } catch (e) {
    console.log(`  \x1b[31m✗\x1b[0m ${name}: ${e.message}`);
    failed++;
  }
}

function skip(name) {
  console.log(`  \x1b[33m○\x1b[0m ${name} (skipped)`);
  skipped++;
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// === STRUCTURE TESTS ===
console.log('\n\x1b[1mStructure Tests\x1b[0m');

test('Root SKILL.md exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'SKILL.md')));
});

test('Root SKILL.md under 500 lines', () => {
  const lines = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf8').split('\n').length;
  assert(lines <= 500, `Got ${lines} lines`);
});

test('README.md exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'README.md')));
});

test('CONTEXT.md exists (shared language)', () => {
  assert(fs.existsSync(path.join(ROOT, 'CONTEXT.md')));
});

test('AGENTS.md exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'AGENTS.md')));
});

test('CLAUDE.md exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'CLAUDE.md')));
});

test('CONTRIBUTING.md exists', () => {
  assert(fs.existsSync(path.join(ROOT, 'CONTRIBUTING.md')));
});

test('.cursor-plugin/plugin.json exists', () => {
  assert(fs.existsSync(path.join(ROOT, '.cursor-plugin', 'plugin.json')));
});

test('.claude-plugin/plugin.json exists', () => {
  assert(fs.existsSync(path.join(ROOT, '.claude-plugin', 'plugin.json')));
});

test('docs/ directory exists with guides', () => {
  assert(fs.existsSync(path.join(ROOT, 'docs', 'getting-started.md')));
  assert(fs.existsSync(path.join(ROOT, 'docs', 'skill-anatomy.md')));
});

// === SKILL VALIDATION TESTS ===
console.log('\n\x1b[1mSkill Validation Tests\x1b[0m');

const skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

test(`Skills directory contains skills (found ${skillDirs.length})`, () => {
  assert(skillDirs.length >= 5, `Only ${skillDirs.length} skills found`);
});

for (const skill of skillDirs) {
  test(`skills/${skill}/SKILL.md exists`, () => {
    assert(fs.existsSync(path.join(SKILLS_DIR, skill, 'SKILL.md')));
  });

  test(`skills/${skill}/SKILL.md has valid frontmatter`, () => {
    const content = fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf8');
    assert(content.startsWith('---'), 'Missing frontmatter start');
    assert(content.includes('\n---', 4), 'Missing frontmatter end');
    assert(/^name:/m.test(content), 'Missing name field');
    assert(/description:/m.test(content), 'Missing description field');
  });

  test(`skills/${skill}/SKILL.md under 500 lines`, () => {
    const lines = fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf8').split('\n').length;
    assert(lines <= 500, `${lines} lines exceeds limit`);
  });
}

// === SCRIPT SYNTAX TESTS ===
console.log('\n\x1b[1mScript Syntax Tests\x1b[0m');

const scripts = fs.readdirSync(SCRIPTS_DIR).filter(f => f.endsWith('.js'));

for (const script of scripts) {
  test(`scripts/${script} has valid syntax`, () => {
    execSync(`node --check "${path.join(SCRIPTS_DIR, script)}"`, { encoding: 'utf8' });
  });
}

// === MEMORY INTEGRITY TESTS ===
console.log('\n\x1b[1mMemory Integrity Tests\x1b[0m');

const expectedMemoryFiles = [
  'rl-state.json', 'discovered-skills.json', 'learnings.json',
  'gaps.json', 'published.json', 'reputation-playbook.json',
  'indexed-learnings.json', 'skillopt-state.json'
];

for (const file of expectedMemoryFiles) {
  test(`memory/${file} exists and is valid JSON`, () => {
    const filepath = path.join(MEMORY_DIR, file);
    assert(fs.existsSync(filepath), 'File missing');
    const content = fs.readFileSync(filepath, 'utf8');
    JSON.parse(content); // throws if invalid
  });
}

test('memory/evolution-log.jsonl exists and has entries', () => {
  const filepath = path.join(MEMORY_DIR, 'evolution-log.jsonl');
  assert(fs.existsSync(filepath));
  const lines = fs.readFileSync(filepath, 'utf8').trim().split('\n');
  assert(lines.length >= 1, 'No log entries');
  JSON.parse(lines[0]); // first line must be valid JSON
});

test('memory/skillopt-log.jsonl exists', () => {
  const filepath = path.join(MEMORY_DIR, 'skillopt-log.jsonl');
  assert(fs.existsSync(filepath), 'skillopt-log.jsonl missing');
});

// === INDEXED MEMORY TESTS ===
console.log('\n\x1b[1mIndexed Memory Tests\x1b[0m');

test('memory/indexed-learnings.json exists and is valid', () => {
  const filepath = path.join(MEMORY_DIR, 'indexed-learnings.json');
  assert(fs.existsSync(filepath), 'indexed-learnings.json missing');
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  assert(data.version, 'Missing version');
  assert(data.categories, 'Missing categories');
  assert(data.keyword_index, 'Missing keyword_index');
  assert(data.by_apply_to, 'Missing by_apply_to');
});

test('indexed-learnings.json has populated categories', () => {
  const data = JSON.parse(fs.readFileSync(path.join(MEMORY_DIR, 'indexed-learnings.json'), 'utf8'));
  const categoryCount = Object.keys(data.categories).length;
  assert(categoryCount >= 3, `Only ${categoryCount} categories (need 3+)`);
  const totalPatterns = Object.values(data.categories).reduce((sum, arr) => sum + arr.length, 0);
  assert(totalPatterns >= 10, `Only ${totalPatterns} indexed patterns (need 10+)`);
});

test('indexed-learnings.json keyword_index has entries', () => {
  const data = JSON.parse(fs.readFileSync(path.join(MEMORY_DIR, 'indexed-learnings.json'), 'utf8'));
  const kwCount = Object.keys(data.keyword_index).length;
  assert(kwCount >= 50, `Only ${kwCount} keywords indexed (need 50+)`);
});

// === ROUTING TESTS ===
console.log('\n\x1b[1mRouting Tests\x1b[0m');

test('route-task.js returns results for known-good query', () => {
  const result = execSync('node scripts/route-task.js "write tests for my React components"', { encoding: 'utf8', cwd: ROOT });
  const output = JSON.parse(result);
  assert(output.task, 'Missing task in output');
  assert(output.total_skills_searched > 0, 'No skills searched');
  assert(output.top_skills, 'Missing top_skills');
  assert(output.invocation_prompt, 'Missing invocation_prompt');
});

test('route-task.js includes TF-IDF scores', () => {
  const result = execSync('node scripts/route-task.js "deploy app to production with monitoring"', { encoding: 'utf8', cwd: ROOT });
  const output = JSON.parse(result);
  if (output.top_skills && output.top_skills.length > 0) {
    assert(typeof output.top_skills[0].tfidf === 'number', 'Missing tfidf score');
    assert(typeof output.top_skills[0].ngram_bonus === 'number', 'Missing ngram_bonus');
  }
});

test('route-task.js compound routing returns companions for complex tasks', () => {
  const result = execSync('node scripts/route-task.js "build secure scalable microservices with database schema design and CI/CD pipeline"', { encoding: 'utf8', cwd: ROOT });
  const output = JSON.parse(result);
  assert(output.routing_type, 'Missing routing_type');
  assert(Array.isArray(output.compound_skills), 'Missing compound_skills array');
});

// === SKILLOPT TESTS ===
console.log('\n\x1b[1mSkillOpt Tests\x1b[0m');

test('skillopt.js --status returns valid JSON', () => {
  const result = execSync('node scripts/skillopt.js --status', { encoding: 'utf8', cwd: ROOT });
  const output = JSON.parse(result);
  assert(typeof output.total_skills_tracked === 'number', 'Missing total_skills_tracked');
  assert(typeof output.total_records === 'number', 'Missing total_records');
  assert(Array.isArray(output.skills), 'Missing skills array');
});

test('skillopt.js --record creates valid outcome', () => {
  const result = execSync('node scripts/skillopt.js --record --skill test-skill --task "unit test" --outcome good', { encoding: 'utf8', cwd: ROOT });
  const output = JSON.parse(result);
  assert(output.recorded === true, 'Record failed');
  assert(output.skill === 'test-skill', 'Wrong skill name');
});

// === ORCHESTRATOR TESTS ===
console.log('\n\x1b[1mOrchestrator Tests\x1b[0m');

test('orchestrate.js --phase grill returns questions', () => {
  const result = execSync('node scripts/orchestrate.js --phase grill "build a web app"', { encoding: 'utf8', cwd: ROOT });
  const output = JSON.parse(result);
  assert(output.phases.grill, 'Missing grill phase');
  assert(output.phases.grill.questions, 'Missing questions');
  assert(output.phases.grill.questions.constraints.length > 0, 'No constraint questions');
});

test('orchestrate.js --phase architect returns proposals', () => {
  const result = execSync('node scripts/orchestrate.js --phase architect "SaaS platform"', { encoding: 'utf8', cwd: ROOT });
  const output = JSON.parse(result);
  assert(output.phases.architect, 'Missing architect phase');
  assert(output.phases.architect.architectures.length >= 2, 'Need at least 2 architecture proposals');
});

// === PLUGIN MANIFEST TESTS ===
console.log('\n\x1b[1mPlugin Manifest Tests\x1b[0m');

test('.cursor-plugin/plugin.json has required fields', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, '.cursor-plugin', 'plugin.json'), 'utf8'));
  assert(manifest.name, 'Missing name');
  assert(manifest.description, 'Missing description');
  assert(manifest.version, 'Missing version');
  assert(manifest.skills, 'Missing skills path');
});

test('.claude-plugin/plugin.json has required fields', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert(manifest.name, 'Missing name');
  assert(manifest.description, 'Missing description');
  assert(manifest.version, 'Missing version');
});

// === QUALITY TESTS (the REAL bar) ===
console.log('\n\x1b[1mQuality Tests\x1b[0m');

test('README frames skills as PROBLEMS not features', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert(readme.includes('Problem'), 'README should frame around problems');
  assert(readme.includes('Fix'), 'README should show fixes');
});

test('README has multi-platform install instructions', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert(readme.includes('Claude Code'), 'Missing Claude Code install');
  assert(readme.includes('Cursor') || readme.includes('npx skills'), 'Missing Cursor install');
});

test('README has philosophy/authority quotes', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert(readme.includes('Pragmatic Programmer') || readme.includes('Kent Beck') || readme.includes('Ousterhout'),
    'README should reference engineering authorities');
});

test('CONTEXT.md defines project vocabulary', () => {
  const ctx = fs.readFileSync(path.join(ROOT, 'CONTEXT.md'), 'utf8');
  assert(ctx.includes('## Language'), 'CONTEXT.md needs Language section');
  assert(ctx.includes('_Avoid_'), 'CONTEXT.md should specify what to avoid');
});

// === SUMMARY ===
console.log(`\n\x1b[1m${'─'.repeat(50)}\x1b[0m`);
console.log(`\x1b[1mResults: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m, \x1b[33m${skipped} skipped\x1b[0m`);
console.log(`\x1b[1m${'─'.repeat(50)}\x1b[0m\n`);

process.exit(failed > 0 ? 1 : 0);
