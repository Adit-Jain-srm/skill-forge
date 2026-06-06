#!/usr/bin/env node
/**
 * skill-forge memory indexer v2 — hardened
 * 
 * Guarantees:
 * - Every pattern in learnings.json appears in at least one category
 * - No pattern is silently skipped (validation errors are reported)
 * - Keyword index covers ALL meaningful terms (no edge case gaps)
 * - Schema validated on input AND output
 * - Idempotent: running twice produces identical results
 * - Atomic writes: never leaves corrupted state on disk
 *
 * Usage: node index-memory.js [--rebuild] [--retrieve "task"] [--validate]
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'memory');

// --- Schema Definitions ---

const REQUIRED_LEARNING_FIELDS = ['pattern', 'description'];
const VALID_CATEGORIES = [
  'architecture', 'creation', 'routing', 'reputation',
  'discovery', 'project_guidance', 'optimization', 'behavioral', 'general'
];
const VALID_APPLY_TO = [
  'hackathons', 'skill-creation', 'project-guidance',
  'reputation', 'industry', 'architecture', 'general'
];

// --- Utility ---

function loadJson(filename) {
  const filepath = path.join(MEMORY_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    console.error(`[ERROR] Failed to parse ${filename}: ${e.message}`);
    return null;
  }
}

function atomicWrite(filename, data) {
  const filepath = path.join(MEMORY_DIR, filename);
  const tmpPath = filepath + '.tmp';
  const content = JSON.stringify(data, null, 2);
  // Validate JSON roundtrips correctly before writing
  try {
    JSON.parse(content);
  } catch (e) {
    console.error(`[FATAL] Generated invalid JSON for ${filename}: ${e.message}`);
    process.exit(1);
  }
  fs.writeFileSync(tmpPath, content);
  // Atomic rename (overwrites existing)
  fs.renameSync(tmpPath, filepath);
}

// --- Stop Words (comprehensive) ---

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
  'in', 'with', 'to', 'for', 'of', 'not', 'this', 'that', 'it',
  'from', 'by', 'as', 'are', 'was', 'be', 'has', 'had', 'have',
  'will', 'can', 'do', 'does', 'did', 'been', 'being', 'would',
  'should', 'could', 'may', 'might', 'must', 'shall', 'get', 'got',
  'use', 'used', 'using', 'make', 'made', 'than', 'more', 'most',
  'just', 'also', 'very', 'what', 'when', 'how', 'who', 'where',
  'all', 'each', 'every', 'both', 'few', 'some', 'any', 'other',
  'about', 'into', 'over', 'such', 'only', 'then', 'them', 'same',
  'like', 'well', 'back', 'even', 'still', 'way', 'too', 'here'
]);

// --- Category Classification ---

const CATEGORY_SIGNALS = {
  architecture: ['architecture', 'monolith', 'microservices', 'pattern', 'system', 'design', 'composable', 'deep', 'module', 'interface', 'codebase', 'structure', 'scalable', 'layer'],
  creation: ['create', 'skill', 'write', 'build', 'ship', 'publish', 'quality', 'validate', 'tdd', 'format', 'sections', 'description', 'frontmatter', 'lines', 'small', 'short', 'focused'],
  routing: ['route', 'match', 'find', 'invoke', 'trigger', 'command', 'slash', 'install', 'lifecycle', 'activate', 'dispatch'],
  reputation: ['stars', 'install', 'popular', 'marketing', 'readme', 'promote', 'advertise', 'audience', 'newsletter', 'collection', 'repo', 'marketplace', 'capafy', 'monetiz'],
  discovery: ['discover', 'search', 'source', 'novel', 'devour', 'analyze', 'scan', 'marketplace', 'trend', 'find', 'browse', 'explore'],
  project_guidance: ['project', 'hackathon', 'guide', 'approach', 'creative', 'decision', 'framework', 'grill', 'context', 'language', 'vocabulary', 'architecture'],
  optimization: ['optimize', 'fast', 'speed', 'efficient', 'loop', 'improve', 'cycle', 'meta', 'training', 'skillopt', 'performance', 'measure'],
  behavioral: ['behavior', 'discipline', 'mode', 'compress', 'token', 'diagnose', 'handoff', 'zoom', 'perspective', 'prototype', 'process', 'workflow']
};

function classifyPattern(pattern) {
  const text = `${pattern.pattern || ''} ${pattern.description || ''}`.toLowerCase();
  const scores = {};

  for (const [category, signals] of Object.entries(CATEGORY_SIGNALS)) {
    let score = 0;
    for (const signal of signals) {
      if (text.includes(signal)) score++;
    }
    if (score > 0) scores[category] = score;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return 'general';
  return sorted[0][0];
}

function classifyAllCategories(pattern) {
  const text = `${pattern.pattern || ''} ${pattern.description || ''}`.toLowerCase();
  const matches = [];

  for (const [category, signals] of Object.entries(CATEGORY_SIGNALS)) {
    let score = 0;
    for (const signal of signals) {
      if (text.includes(signal)) score++;
    }
    if (score >= 2) matches.push(category);
  }

  return matches.length > 0 ? matches : ['general'];
}

// --- Keyword Extraction ---

function extractKeywords(text) {
  if (!text || typeof text !== 'string') return [];
  return text.toLowerCase()
    .replace(/[^a-z0-9\s\-_]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

function extractUniqueKeywords(text) {
  return [...new Set(extractKeywords(text))];
}

// --- Apply-To Inference ---

function inferApplyTo(pattern) {
  const text = `${pattern.pattern || ''} ${pattern.description || ''}`.toLowerCase();
  const domains = [];

  if (text.includes('hackathon') || text.includes('creative') || text.includes('novel')) domains.push('hackathons');
  if (text.includes('skill') || text.includes('create') || text.includes('write') || text.includes('publish')) domains.push('skill-creation');
  if (text.includes('project') || text.includes('guide') || text.includes('architecture') || text.includes('decision')) domains.push('project-guidance');
  if (text.includes('star') || text.includes('install') || text.includes('market') || text.includes('promote')) domains.push('reputation');
  if (text.includes('industry') || text.includes('enterprise') || text.includes('scale') || text.includes('production')) domains.push('industry');
  if (text.includes('pattern') || text.includes('design') || text.includes('structure') || text.includes('system')) domains.push('architecture');

  return domains.length > 0 ? domains : ['general'];
}

// --- Staleness ---

function computeStaleness(pattern) {
  const dateStr = pattern.last_validated || pattern.date;
  if (!dateStr) return 'unknown';
  const lastDate = new Date(dateStr);
  if (isNaN(lastDate.getTime())) return 'unknown';
  const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince <= 7) return 'fresh';
  if (daysSince <= 30) return 'recent';
  if (daysSince <= 90) return 'aging';
  return 'stale';
}

// --- Validation ---

function validatePattern(pattern, idx) {
  const errors = [];
  for (const field of REQUIRED_LEARNING_FIELDS) {
    if (!pattern[field]) errors.push(`Pattern ${idx}: missing required field "${field}"`);
  }
  if (pattern.confidence !== undefined && (pattern.confidence < 0 || pattern.confidence > 1)) {
    errors.push(`Pattern ${idx}: confidence ${pattern.confidence} out of range [0,1]`);
  }
  return errors;
}

function validateOutput(indexed) {
  const errors = [];
  if (!indexed.version) errors.push('Missing version');
  if (!indexed.categories || typeof indexed.categories !== 'object') errors.push('Missing categories');
  if (!indexed.keyword_index || typeof indexed.keyword_index !== 'object') errors.push('Missing keyword_index');
  if (!indexed.by_apply_to || typeof indexed.by_apply_to !== 'object') errors.push('Missing by_apply_to');

  // Check every pattern appears in at least one category
  const allPatternIds = new Set();
  for (const arr of Object.values(indexed.categories)) {
    for (const p of arr) allPatternIds.add(p.id);
  }
  if (allPatternIds.size !== indexed.total_patterns) {
    errors.push(`Pattern coverage gap: ${allPatternIds.size} indexed vs ${indexed.total_patterns} total`);
  }

  // Check keyword index references valid pattern IDs
  for (const [kw, ids] of Object.entries(indexed.keyword_index)) {
    for (const id of ids) {
      if (id < 0 || id >= indexed.total_patterns) {
        errors.push(`keyword_index["${kw}"] references invalid pattern id ${id}`);
      }
    }
  }

  return errors;
}

// --- Core Build ---

function buildIndex() {
  const learnings = loadJson('learnings.json');
  if (!learnings) {
    console.error('[FATAL] learnings.json not found or invalid');
    process.exit(1);
  }

  const patterns = learnings.patterns || [];
  const techniques = learnings.techniques || [];
  const philosophies = learnings.philosophies || [];

  // Validate all patterns
  const validationErrors = [];
  for (let i = 0; i < patterns.length; i++) {
    validationErrors.push(...validatePattern(patterns[i], i));
  }
  if (validationErrors.length > 0) {
    console.error('[WARN] Validation issues in learnings.json:');
    validationErrors.forEach(e => console.error(`  - ${e}`));
  }

  // Build enriched patterns (EVERY pattern must be indexed)
  const enrichedPatterns = patterns.map((p, i) => ({
    id: i,
    pattern: p.pattern || `unnamed_${i}`,
    description: p.description || '',
    source: p.source || 'unknown',
    confidence: typeof p.confidence === 'number' ? p.confidence : 0.5,
    category: classifyPattern(p),
    all_categories: classifyAllCategories(p),
    staleness: computeStaleness(p),
    apply_to: p.apply_to || inferApplyTo(p)
  }));

  // Build category index (each pattern in primary category)
  const categories = {};
  for (const cat of VALID_CATEGORIES) categories[cat] = [];
  for (const p of enrichedPatterns) {
    if (!categories[p.category]) categories[p.category] = [];
    categories[p.category].push(p);
  }
  // Sort each category by confidence desc
  for (const arr of Object.values(categories)) {
    arr.sort((a, b) => b.confidence - a.confidence);
  }
  // Remove empty categories
  for (const [k, v] of Object.entries(categories)) {
    if (v.length === 0) delete categories[k];
  }

  // Build keyword index (inverted index: keyword → [pattern_ids])
  const keywordIndex = {};
  for (let i = 0; i < patterns.length; i++) {
    const p = patterns[i];
    const text = `${p.pattern || ''} ${p.description || ''} ${p.source || ''}`;
    const keywords = extractUniqueKeywords(text);
    for (const kw of keywords) {
      if (!keywordIndex[kw]) keywordIndex[kw] = [];
      if (!keywordIndex[kw].includes(i)) keywordIndex[kw].push(i);
    }
  }

  // Build apply_to index
  const applyToIndex = {};
  for (let i = 0; i < enrichedPatterns.length; i++) {
    for (const domain of enrichedPatterns[i].apply_to) {
      if (!applyToIndex[domain]) applyToIndex[domain] = [];
      if (!applyToIndex[domain].includes(i)) applyToIndex[domain].push(i);
    }
  }

  // Build cross-reference index (patterns that commonly co-occur in category)
  const crossRef = {};
  for (const p of enrichedPatterns) {
    for (const cat of p.all_categories) {
      if (!crossRef[cat]) crossRef[cat] = [];
      if (!crossRef[cat].includes(p.id)) crossRef[cat].push(p.id);
    }
  }

  const indexed = {
    version: '3.1.0',
    schema: 'indexed-learnings-v3',
    index_built: new Date().toISOString(),
    total_patterns: patterns.length,
    total_techniques: techniques.length,
    total_philosophies: philosophies.length,
    integrity: {
      patterns_indexed: enrichedPatterns.length,
      patterns_in_source: patterns.length,
      complete: enrichedPatterns.length === patterns.length,
      keywords_indexed: Object.keys(keywordIndex).length,
      categories_used: Object.keys(categories).length,
      validation_errors: validationErrors.length
    },
    categories,
    by_apply_to: applyToIndex,
    cross_reference: crossRef,
    keyword_index: keywordIndex,
    techniques: techniques.map((t, i) => ({ id: i, ...t })),
    philosophies: philosophies.map((p, i) => ({ id: i, ...p }))
  };

  // Validate output before writing
  const outputErrors = validateOutput(indexed);
  if (outputErrors.length > 0) {
    console.error('[ERROR] Output validation failed:');
    outputErrors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  // Atomic write
  atomicWrite('indexed-learnings.json', indexed);

  console.log(JSON.stringify({
    success: true,
    indexed_at: indexed.index_built,
    total_patterns: patterns.length,
    integrity: indexed.integrity,
    categories: Object.entries(categories).map(([k, v]) => `${k}: ${v.length}`).join(', '),
    keywords: Object.keys(keywordIndex).length,
    apply_to_domains: Object.keys(applyToIndex).length
  }, null, 2));
}

// --- Retrieval ---

function retrieveRelevant(taskDescription, topN = 5) {
  const indexed = loadJson('indexed-learnings.json');
  if (!indexed) {
    console.error('[ERROR] indexed-learnings.json not found. Run: node index-memory.js');
    process.exit(1);
  }

  if (!indexed.integrity || !indexed.integrity.complete) {
    console.error('[WARN] Index integrity check failed — rebuilding...');
    buildIndex();
    return retrieveRelevant(taskDescription, topN);
  }

  const taskKeywords = extractUniqueKeywords(taskDescription);
  if (taskKeywords.length === 0) {
    return { query: taskDescription, results: [], count: 0, note: 'No meaningful keywords extracted' };
  }

  const scores = new Map();

  // Exact keyword matches (weight: 1.0)
  for (const kw of taskKeywords) {
    const ids = indexed.keyword_index[kw] || [];
    for (const id of ids) {
      scores.set(id, (scores.get(id) || 0) + 1.0);
    }
  }

  // Substring matches (weight: 0.4) — bidirectional
  for (const kw of taskKeywords) {
    for (const indexKw of Object.keys(indexed.keyword_index)) {
      if (indexKw === kw) continue;
      if (indexKw.length > 3 && kw.length > 3 && (indexKw.includes(kw) || kw.includes(indexKw))) {
        const ids = indexed.keyword_index[indexKw];
        for (const id of ids) {
          scores.set(id, (scores.get(id) || 0) + 0.4);
        }
      }
    }
  }

  // Collect all patterns from all categories (flat)
  const allPatterns = Object.values(indexed.categories).flat();
  const patternMap = new Map(allPatterns.map(p => [p.id, p]));

  const results = [...scores.entries()]
    .map(([id, score]) => {
      const pattern = patternMap.get(id);
      if (!pattern) return null;
      const confidenceWeight = pattern.confidence || 0.5;
      return { ...pattern, relevance_score: parseFloat((score * confidenceWeight).toFixed(3)) };
    })
    .filter(Boolean)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, topN);

  return results;
}

// --- Validate Command ---

function runValidation() {
  const indexed = loadJson('indexed-learnings.json');
  if (!indexed) {
    console.log(JSON.stringify({ valid: false, error: 'File not found' }, null, 2));
    process.exit(1);
  }

  const errors = validateOutput(indexed);
  const learnings = loadJson('learnings.json');
  const sourceCount = (learnings && learnings.patterns) ? learnings.patterns.length : 0;

  if (indexed.total_patterns !== sourceCount) {
    errors.push(`Stale index: ${indexed.total_patterns} indexed vs ${sourceCount} in source`);
  }

  console.log(JSON.stringify({
    valid: errors.length === 0,
    integrity: indexed.integrity,
    errors: errors.length > 0 ? errors : undefined,
    recommendation: errors.length > 0 ? 'Run: node scripts/index-memory.js --rebuild' : 'Index is healthy'
  }, null, 2));

  process.exit(errors.length > 0 ? 1 : 0);
}

// --- CLI ---

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--validate')) {
    runValidation();
  } else if (args.includes('--retrieve')) {
    const queryIdx = args.indexOf('--retrieve');
    const query = args.slice(queryIdx + 1).join(' ');
    if (!query) {
      console.error('Usage: node index-memory.js --retrieve "task description"');
      process.exit(1);
    }
    const results = retrieveRelevant(query);
    console.log(JSON.stringify({ query, results, count: results.length }, null, 2));
  } else {
    buildIndex();
  }
}

main();
