#!/usr/bin/env node
/**
 * skill-forge SkillOpt engine
 * Implements the rollout→reflect→aggregate→select→update→evaluate cycle
 * for continuous prompt engineering self-improvement.
 *
 * Treats each SKILL.md as trainable parameters. After skills are used,
 * outcome signals accumulate. When sufficient data exists, proposes
 * and applies prompt deltas to improve skill behavior.
 *
 * Usage:
 *   node skillopt.js --record --skill <name> --task "..." --outcome <good|poor|mixed> [--details "..."]
 *   node skillopt.js --analyze [--skill <name>]
 *   node skillopt.js --apply --skill <name> --delta-id <id>
 *   node skillopt.js --rollback --skill <name> --delta-id <id>
 *   node skillopt.js --status
 */

const fs = require('fs');
const path = require('path');
const { ensureMemoryInitialized } = require('./lib/memory-utils');

ensureMemoryInitialized();

const MEMORY_DIR = path.join(__dirname, '..', 'memory');
const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const LOG_FILE = path.join(MEMORY_DIR, 'skillopt-log.jsonl');
const STATE_FILE = path.join(MEMORY_DIR, 'skillopt-state.json');

function loadJson(filepath) {
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function saveJson(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function appendLog(entry) {
  entry.timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
}

function ensureState() {
  if (!fs.existsSync(STATE_FILE)) {
    saveJson(STATE_FILE, {
      version: '1.0.0',
      skills: {},
      total_records: 0,
      total_deltas_applied: 0,
      total_rollbacks: 0
    });
  }
  return loadJson(STATE_FILE);
}

function ensureLogFile() {
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, '');
  }
}

// --- Phase 1: ROLLOUT (Record outcome) ---

function recordOutcome(skillName, task, outcome, details) {
  const state = ensureState();

  if (!state.skills[skillName]) {
    state.skills[skillName] = {
      outcomes: [],
      deltas: [],
      current_version: 0,
      total_uses: 0,
      quality_trend: []
    };
  }

  const skillState = state.skills[skillName];
  const record = {
    id: `${skillName}-${Date.now()}`,
    task,
    outcome,
    details: details || null,
    timestamp: new Date().toISOString()
  };

  skillState.outcomes.push(record);
  skillState.total_uses++;

  const qualityScore = outcome === 'good' ? 1.0 : outcome === 'mixed' ? 0.5 : 0.0;
  skillState.quality_trend.push(qualityScore);
  if (skillState.quality_trend.length > 20) {
    skillState.quality_trend = skillState.quality_trend.slice(-20);
  }

  state.total_records++;
  saveJson(STATE_FILE, state);

  appendLog({ event: 'rollout', skill: skillName, task, outcome, details });

  return { recorded: true, skill: skillName, total_uses: skillState.total_uses };
}

// --- Phase 2: REFLECT (Analyze what went wrong) ---

function reflectOnSkill(skillName) {
  const state = ensureState();
  const skillState = state.skills[skillName];

  if (!skillState || skillState.outcomes.length === 0) {
    return { skill: skillName, status: 'no_data', message: 'No outcomes recorded yet' };
  }

  const recent = skillState.outcomes.slice(-10);
  const poorOutcomes = recent.filter(o => o.outcome === 'poor');
  const goodOutcomes = recent.filter(o => o.outcome === 'good');
  const mixedOutcomes = recent.filter(o => o.outcome === 'mixed');

  const qualityRate = goodOutcomes.length / recent.length;
  const trend = skillState.quality_trend;
  const recentAvg = trend.slice(-5).reduce((a, b) => a + b, 0) / Math.min(trend.length, 5);
  const olderAvg = trend.slice(0, -5).reduce((a, b) => a + b, 0) / Math.max(trend.length - 5, 1);
  const improving = recentAvg > olderAvg;

  const reflection = {
    skill: skillName,
    total_uses: skillState.total_uses,
    recent_quality_rate: qualityRate,
    trend_direction: improving ? 'improving' : recentAvg === olderAvg ? 'stable' : 'degrading',
    poor_outcomes: poorOutcomes.map(o => ({
      task: o.task,
      details: o.details,
      timestamp: o.timestamp
    })),
    patterns_in_failures: identifyFailurePatterns(poorOutcomes)
  };

  return reflection;
}

function identifyFailurePatterns(poorOutcomes) {
  if (poorOutcomes.length === 0) return [];

  const patterns = [];
  const detailTexts = poorOutcomes.map(o => o.details || '').filter(Boolean);

  if (detailTexts.length === 0) return ['No failure details recorded — add --details when recording'];

  const wordFreq = {};
  for (const text of detailTexts) {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    for (const w of words) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  }

  const commonWords = Object.entries(wordFreq)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => `"${word}" appears in ${count}/${poorOutcomes.length} failures`);

  if (commonWords.length > 0) patterns.push(...commonWords);

  const taskTypes = poorOutcomes.map(o => o.task.split(' ').slice(0, 3).join(' '));
  const taskFreq = {};
  for (const t of taskTypes) { taskFreq[t] = (taskFreq[t] || 0) + 1; }
  const repeatedTasks = Object.entries(taskFreq).filter(([_, c]) => c >= 2);
  if (repeatedTasks.length > 0) {
    patterns.push(`Repeated failure context: ${repeatedTasks.map(([t]) => `"${t}..."`).join(', ')}`);
  }

  return patterns;
}

// --- Phase 3: AGGREGATE (Collect sufficient data) ---

const MIN_DATAPOINTS_FOR_DELTA = 3;

function shouldProposeDelta(skillName) {
  const state = ensureState();
  const skillState = state.skills[skillName];
  if (!skillState) return false;

  const recent = skillState.outcomes.slice(-10);
  const poorCount = recent.filter(o => o.outcome === 'poor').length;
  const mixedCount = recent.filter(o => o.outcome === 'mixed').length;

  return (poorCount + mixedCount) >= MIN_DATAPOINTS_FOR_DELTA && recent.length >= MIN_DATAPOINTS_FOR_DELTA;
}

// --- Phase 4: SELECT (Choose highest-impact improvement) ---

function selectImprovement(skillName, reflection) {
  const learnings = loadJson(path.join(MEMORY_DIR, 'learnings.json'));
  const patterns = reflection.patterns_in_failures || [];

  const improvements = [];

  if (reflection.recent_quality_rate < 0.3) {
    improvements.push({
      priority: 'critical',
      type: 'major_rewrite',
      reason: `Quality rate ${(reflection.recent_quality_rate * 100).toFixed(0)}% — skill needs significant restructuring`,
      suggestion: 'Rewrite core instructions. Compare against top-performing skills in same domain.'
    });
  }

  if (reflection.trend_direction === 'degrading') {
    improvements.push({
      priority: 'high',
      type: 'revert_recent',
      reason: 'Quality is degrading — recent changes may have hurt',
      suggestion: 'Review last applied delta. Consider rollback.'
    });
  }

  if (patterns.length > 0) {
    improvements.push({
      priority: 'medium',
      type: 'targeted_fix',
      reason: `Failure patterns detected: ${patterns[0]}`,
      suggestion: 'Add explicit handling for the detected failure pattern in SKILL.md instructions.'
    });
  }

  if (learnings) {
    const relevantLearning = (learnings.patterns || []).find(p =>
      p.description && p.description.toLowerCase().includes('behavior')
    );
    if (relevantLearning && reflection.recent_quality_rate < 0.7) {
      improvements.push({
        priority: 'medium',
        type: 'apply_learning',
        reason: `Learning "${relevantLearning.pattern}" may improve this skill`,
        suggestion: `Apply pattern: ${relevantLearning.description.slice(0, 150)}`
      });
    }
  }

  improvements.sort((a, b) => {
    const pri = { critical: 0, high: 1, medium: 2, low: 3 };
    return (pri[a.priority] || 3) - (pri[b.priority] || 3);
  });

  return improvements;
}

// --- Phase 5: UPDATE (Generate prompt delta) ---

function generateDelta(skillName, improvement) {
  const state = ensureState();
  const skillState = state.skills[skillName];

  const deltaId = `delta-${skillName}-${Date.now()}`;
  const delta = {
    id: deltaId,
    skill: skillName,
    type: improvement.type,
    priority: improvement.priority,
    reason: improvement.reason,
    suggestion: improvement.suggestion,
    status: 'proposed',
    proposed_at: new Date().toISOString(),
    applied_at: null,
    outcome_after: null
  };

  skillState.deltas.push(delta);
  saveJson(STATE_FILE, state);

  appendLog({ event: 'delta_proposed', skill: skillName, delta_id: deltaId, type: improvement.type });

  return delta;
}

// --- Phase 6: EVALUATE (Track post-update outcomes) ---

function evaluateDelta(skillName, deltaId) {
  const state = ensureState();
  const skillState = state.skills[skillName];
  if (!skillState) return { error: 'Skill not found' };

  const delta = skillState.deltas.find(d => d.id === deltaId);
  if (!delta) return { error: 'Delta not found' };

  if (!delta.applied_at) return { status: 'not_applied', delta };

  const appliedTime = new Date(delta.applied_at).getTime();
  const outcomesAfter = skillState.outcomes.filter(o =>
    new Date(o.timestamp).getTime() > appliedTime
  );

  if (outcomesAfter.length < 2) {
    return { status: 'insufficient_data', outcomes_after: outcomesAfter.length, need: 2 };
  }

  const qualityAfter = outcomesAfter.filter(o => o.outcome === 'good').length / outcomesAfter.length;
  const outcomesBefore = skillState.outcomes.filter(o =>
    new Date(o.timestamp).getTime() <= appliedTime
  ).slice(-5);
  const qualityBefore = outcomesBefore.filter(o => o.outcome === 'good').length / Math.max(outcomesBefore.length, 1);

  const improved = qualityAfter > qualityBefore;
  delta.outcome_after = improved ? 'improved' : qualityAfter === qualityBefore ? 'neutral' : 'degraded';

  saveJson(STATE_FILE, state);
  appendLog({ event: 'delta_evaluated', skill: skillName, delta_id: deltaId, result: delta.outcome_after });

  return {
    status: 'evaluated',
    delta_id: deltaId,
    quality_before: qualityBefore,
    quality_after: qualityAfter,
    result: delta.outcome_after,
    recommendation: improved ? 'keep' : 'consider_rollback'
  };
}

// --- Apply / Rollback ---

// --- Phase 7: PROMOTE (Auto-promote proven learnings) ---

const PROMOTION_THRESHOLD = 3;

function checkPromotions() {
  const state = ensureState();
  const promotions = [];

  for (const [skillName, skillState] of Object.entries(state.skills)) {
    if (skillState.total_uses < PROMOTION_THRESHOLD) continue;

    const trend = skillState.quality_trend || [];
    const recentGoodRate = trend.slice(-5).filter(s => s >= 0.8).length / Math.min(trend.length, 5);

    if (recentGoodRate >= 0.8) {
      const alreadyPromoted = (state.promotions || []).find(p => p.skill === skillName);
      if (!alreadyPromoted) {
        promotions.push({
          skill: skillName,
          uses: skillState.total_uses,
          quality_rate: recentGoodRate,
          recommendation: `Skill "${skillName}" has been used ${skillState.total_uses} times with ${(recentGoodRate * 100).toFixed(0)}% quality. Consider promoting its key pattern to CLAUDE.md as a permanent rule.`
        });
      }
    }
  }

  if (promotions.length > 0) {
    if (!state.promotions) state.promotions = [];
    for (const p of promotions) {
      state.promotions.push({ ...p, proposed_at: new Date().toISOString(), status: 'proposed' });
    }
    saveJson(STATE_FILE, state);
    appendLog({ event: 'promotions_proposed', count: promotions.length, skills: promotions.map(p => p.skill) });
  }

  return promotions;
}

function applyDelta(skillName, deltaId) {
  const state = ensureState();
  const skillState = state.skills[skillName];
  if (!skillState) return { error: 'Skill not found' };

  const delta = skillState.deltas.find(d => d.id === deltaId);
  if (!delta) return { error: 'Delta not found' };

  delta.status = 'applied';
  delta.applied_at = new Date().toISOString();
  skillState.current_version++;
  state.total_deltas_applied++;

  saveJson(STATE_FILE, state);
  appendLog({ event: 'delta_applied', skill: skillName, delta_id: deltaId });

  return { applied: true, skill: skillName, delta_id: deltaId, version: skillState.current_version };
}

function rollbackDelta(skillName, deltaId) {
  const state = ensureState();
  const skillState = state.skills[skillName];
  if (!skillState) return { error: 'Skill not found' };

  const delta = skillState.deltas.find(d => d.id === deltaId);
  if (!delta) return { error: 'Delta not found' };

  delta.status = 'rolled_back';
  state.total_rollbacks++;

  saveJson(STATE_FILE, state);
  appendLog({ event: 'delta_rollback', skill: skillName, delta_id: deltaId });

  return { rolled_back: true, skill: skillName, delta_id: deltaId };
}

// --- Full Analysis ---

function analyzeAll() {
  const state = ensureState();
  const results = [];

  for (const [skillName, skillState] of Object.entries(state.skills)) {
    if (skillState.total_uses < 1) continue;

    const reflection = reflectOnSkill(skillName);
    const shouldUpdate = shouldProposeDelta(skillName);

    const analysis = {
      skill: skillName,
      total_uses: skillState.total_uses,
      quality_rate: reflection.recent_quality_rate,
      trend: reflection.trend_direction,
      needs_update: shouldUpdate
    };

    if (shouldUpdate) {
      const improvements = selectImprovement(skillName, reflection);
      if (improvements.length > 0) {
        const delta = generateDelta(skillName, improvements[0]);
        analysis.proposed_delta = delta;
      }
    }

    results.push(analysis);
  }

  results.sort((a, b) => (a.quality_rate || 1) - (b.quality_rate || 1));
  return results;
}

function getStatus() {
  const state = ensureState();
  return {
    total_skills_tracked: Object.keys(state.skills).length,
    total_records: state.total_records,
    total_deltas_applied: state.total_deltas_applied,
    total_rollbacks: state.total_rollbacks,
    skills: Object.entries(state.skills).map(([name, s]) => ({
      name,
      uses: s.total_uses,
      pending_deltas: s.deltas.filter(d => d.status === 'proposed').length,
      quality_trend: s.quality_trend.slice(-5)
    }))
  };
}

// --- CLI ---

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--record')) {
    const skillIdx = args.indexOf('--skill');
    const taskIdx = args.indexOf('--task');
    const outcomeIdx = args.indexOf('--outcome');
    const detailsIdx = args.indexOf('--details');

    if (skillIdx < 0 || taskIdx < 0 || outcomeIdx < 0) {
      console.error('Usage: node skillopt.js --record --skill <name> --task "..." --outcome <good|poor|mixed>');
      process.exit(1);
    }

    const skill = args[skillIdx + 1];
    const task = args[taskIdx + 1];
    const outcome = args[outcomeIdx + 1];
    const details = detailsIdx >= 0 ? args[detailsIdx + 1] : null;

    if (!['good', 'poor', 'mixed'].includes(outcome)) {
      console.error('Outcome must be: good, poor, or mixed');
      process.exit(1);
    }

    ensureLogFile();
    const result = recordOutcome(skill, task, outcome, details);
    console.log(JSON.stringify(result, null, 2));

  } else if (args.includes('--analyze')) {
    const skillIdx = args.indexOf('--skill');
    ensureLogFile();

    if (skillIdx >= 0) {
      const skill = args[skillIdx + 1];
      const reflection = reflectOnSkill(skill);
      const improvements = shouldProposeDelta(skill) ? selectImprovement(skill, reflection) : [];
      console.log(JSON.stringify({ reflection, improvements }, null, 2));
    } else {
      const results = analyzeAll();
      console.log(JSON.stringify({ analysis: results, count: results.length }, null, 2));
    }

  } else if (args.includes('--apply')) {
    const skillIdx = args.indexOf('--skill');
    const deltaIdx = args.indexOf('--delta-id');
    if (skillIdx < 0 || deltaIdx < 0) {
      console.error('Usage: node skillopt.js --apply --skill <name> --delta-id <id>');
      process.exit(1);
    }
    const result = applyDelta(args[skillIdx + 1], args[deltaIdx + 1]);
    console.log(JSON.stringify(result, null, 2));

  } else if (args.includes('--rollback')) {
    const skillIdx = args.indexOf('--skill');
    const deltaIdx = args.indexOf('--delta-id');
    if (skillIdx < 0 || deltaIdx < 0) {
      console.error('Usage: node skillopt.js --rollback --skill <name> --delta-id <id>');
      process.exit(1);
    }
    const result = rollbackDelta(args[skillIdx + 1], args[deltaIdx + 1]);
    console.log(JSON.stringify(result, null, 2));

  } else if (args.includes('--status')) {
    ensureLogFile();
    const status = getStatus();
    const promotions = checkPromotions();
    if (promotions.length > 0) status.pending_promotions = promotions;
    console.log(JSON.stringify(status, null, 2));

  } else if (args.includes('--evaluate')) {
    const skillIdx = args.indexOf('--skill');
    const deltaIdx = args.indexOf('--delta-id');
    if (skillIdx < 0 || deltaIdx < 0) {
      console.error('Usage: node skillopt.js --evaluate --skill <name> --delta-id <id>');
      process.exit(1);
    }
    const result = evaluateDelta(args[skillIdx + 1], args[deltaIdx + 1]);
    console.log(JSON.stringify(result, null, 2));

  } else {
    console.error('skill-forge SkillOpt — Prompt Engineering Self-Improvement Loop');
    console.error('');
    console.error('Commands:');
    console.error('  --record   Record a skill usage outcome');
    console.error('  --analyze  Analyze skill performance and propose improvements');
    console.error('  --apply    Mark a proposed delta as applied');
    console.error('  --rollback Roll back a previously applied delta');
    console.error('  --evaluate Evaluate a delta\'s impact on quality');
    console.error('  --status   Show overall SkillOpt status');
    process.exit(1);
  }
}

main();
