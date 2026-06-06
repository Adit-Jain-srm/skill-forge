#!/usr/bin/env node
/**
 * skill-forge task router v2
 * Semantic routing with TF-IDF scoring, n-gram matching, compound skill
 * combinations, and indexed learnings integration.
 *
 * Improvements over v1:
 * - TF-IDF weighting (rare terms matter more)
 * - Bigram/trigram phrase matching
 * - Compound routing (3-5 skills for complex tasks)
 * - Surfaces relevant learnings alongside skills
 * - Per-category RL weight integration
 * - Epsilon-greedy exploration of low-scored skills
 *
 * Usage: node route-task.js "deploy my app to vercel with monitoring"
 * Output: JSON with ranked skills, compound prompt, and relevant learnings
 */

const fs = require('fs');
const path = require('path');
const { ensureMemoryInitialized, loadMemoryFile } = require('./lib/memory-utils');

ensureMemoryInitialized();

const MEMORY_DIR = path.join(__dirname, '..', 'memory');
const CURSOR_SKILLS_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.cursor', 'skills');
const CURSOR_BUILTIN_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.cursor', 'skills-cursor');
const AGENTS_SKILLS_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.agents', 'skills');

function loadJson(filename) {
  const filepath = path.join(MEMORY_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function getAllInstalledSkills() {
  const skills = [];
  const dirs = [CURSOR_SKILLS_DIR, CURSOR_BUILTIN_DIR, AGENTS_SKILLS_DIR];
  for (const baseDir of dirs) {
    if (!fs.existsSync(baseDir)) continue;
    scanSkillDir(baseDir, skills, baseDir);
  }
  return skills;
}

function scanSkillDir(dir, skills, baseDir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const skillMdPath = path.join(dir, entry.name, 'SKILL.md');
      if (fs.existsSync(skillMdPath)) {
        try {
          const content = fs.readFileSync(skillMdPath, 'utf8');
          const frontmatter = parseFrontmatter(content);
          skills.push({
            name: frontmatter.name || entry.name,
            description: frontmatter.description || '',
            path: skillMdPath,
            location: baseDir === CURSOR_BUILTIN_DIR ? 'builtin' : baseDir === AGENTS_SKILLS_DIR ? 'agents' : 'personal',
            content_preview: content.slice(0, 800)
          });
        } catch (_) {}
      }
      scanSkillDir(path.join(dir, entry.name), skills, baseDir);
    }
  } catch (_) {}
}

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1];
  const result = {};
  let currentKey = null;
  let currentValue = '';
  for (const line of yaml.split('\n')) {
    if (/^\s/.test(line) && currentKey) {
      currentValue += ' ' + line.trim();
      result[currentKey] = currentValue.trim();
    } else {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        currentKey = line.slice(0, colonIdx).trim();
        currentValue = line.slice(colonIdx + 1).trim();
        result[currentKey] = currentValue;
      }
    }
  }
  return result;
}

// --- TF-IDF Engine ---

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
  'in', 'with', 'to', 'for', 'of', 'not', 'this', 'that', 'it',
  'from', 'by', 'as', 'are', 'was', 'be', 'has', 'had', 'have',
  'will', 'can', 'do', 'does', 'did', 'been', 'being', 'would',
  'should', 'could', 'may', 'might', 'must', 'shall', 'get', 'got',
  'use', 'used', 'using', 'make', 'made', 'than', 'more', 'most',
  'just', 'also', 'very', 'what', 'when', 'how', 'who', 'where',
  'all', 'each', 'every', 'both', 'few', 'some', 'any', 'other'
]);

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

function generateNgrams(tokens, n) {
  const ngrams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

function buildCorpus(skills) {
  return skills.map(s => {
    const text = `${s.name} ${s.description} ${s.content_preview || ''}`;
    const tokens = tokenize(text);
    const bigrams = generateNgrams(tokens, 2);
    const trigrams = generateNgrams(tokens, 3);
    return { tokens, bigrams, trigrams };
  });
}

function computeIDF(corpus) {
  const docCount = corpus.length;
  const df = {};

  for (const doc of corpus) {
    const seen = new Set(doc.tokens);
    for (const token of seen) {
      df[token] = (df[token] || 0) + 1;
    }
    for (const ng of new Set(doc.bigrams)) {
      df[ng] = (df[ng] || 0) + 1;
    }
  }

  const idf = {};
  for (const [term, count] of Object.entries(df)) {
    idf[term] = Math.log((docCount + 1) / (count + 1)) + 1;
  }
  return idf;
}

function tfidfVector(tokens, idf) {
  const tf = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  const vec = {};
  for (const [term, count] of Object.entries(tf)) {
    vec[term] = (count / tokens.length) * (idf[term] || 1.0);
  }
  return vec;
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  for (const term of allTerms) {
    const a = vecA[term] || 0;
    const b = vecB[term] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function computeNgramBonus(taskBigrams, taskTrigrams, docBigrams, docTrigrams) {
  let bonus = 0;
  const docBigramSet = new Set(docBigrams);
  const docTrigramSet = new Set(docTrigrams);

  for (const bg of taskBigrams) {
    if (docBigramSet.has(bg)) bonus += 0.15;
  }
  for (const tg of taskTrigrams) {
    if (docTrigramSet.has(tg)) bonus += 0.25;
  }
  return Math.min(bonus, 1.0);
}

// --- Scoring & Ranking ---

function scoreSkills(task, skills, corpus, idf, rlState) {
  const taskTokens = tokenize(task);
  const taskBigrams = generateNgrams(taskTokens, 2);
  const taskTrigrams = generateNgrams(taskTokens, 3);
  const taskVec = tfidfVector(taskTokens, idf);

  const scored = skills.map((skill, i) => {
    const doc = corpus[i];
    const docVec = tfidfVector(doc.tokens, idf);
    const tfidfScore = cosineSimilarity(taskVec, docVec);
    const ngramBonus = computeNgramBonus(taskBigrams, taskTrigrams, doc.bigrams, doc.trigrams);

    const locationBoost = skill.location === 'builtin' ? 1.15 : skill.location === 'agents' ? 1.05 : 1.0;

    let rlWeight = 1.0;
    if (rlState) {
      if (rlState.routing_accuracy && rlState.routing_accuracy.accuracy > 0.3) {
        rlWeight += 0.1;
      }
      const catWeights = rlState.category_weights || {};
      for (const [cat, data] of Object.entries(catWeights)) {
        if (skill.description.toLowerCase().includes(cat.replace('_', ' '))) {
          rlWeight *= (0.8 + data.weight * 0.4);
          break;
        }
      }
    }

    const finalScore = tfidfScore * (1 + ngramBonus) * rlWeight * locationBoost;

    return { ...skill, tfidf_score: tfidfScore, ngram_bonus: ngramBonus, final_score: finalScore };
  });

  return scored
    .filter(s => s.final_score > 0.01)
    .sort((a, b) => b.final_score - a.final_score);
}

// --- Compound Routing ---

function generateCompoundRoute(task, rankedSkills, relevantLearnings) {
  if (rankedSkills.length === 0) {
    return {
      type: 'no_match',
      prompt: `No matching skills found for: "${task}"\n\nConsider running \`skill-forge discover\` to find relevant skills, or \`skill-forge create\` to build one.`
    };
  }

  const top = rankedSkills[0];
  const companions = [];

  if (rankedSkills.length >= 2) {
    const topTokens = new Set(tokenize(top.description));
    for (let i = 1; i < Math.min(rankedSkills.length, 6); i++) {
      const candidate = rankedSkills[i];
      if (candidate.final_score < top.final_score * 0.3) break;
      const candTokens = new Set(tokenize(candidate.description));
      let overlap = 0;
      for (const t of candTokens) { if (topTokens.has(t)) overlap++; }
      const overlapRatio = overlap / Math.max(candTokens.size, 1);
      if (overlapRatio < 0.4) {
        companions.push(candidate);
      }
      if (companions.length >= 4) break;
    }
  }

  // Generate structured prompt following Identity → Instructions → Context pattern
  let prompt = `## Task Routing\n\n`;
  prompt += `<task>${task}</task>\n\n`;

  prompt += `### Instructions\n\n`;
  prompt += `Read the primary skill file below, then follow its instructions to accomplish the task. `;
  if (companions.length > 0) {
    prompt += `The compound skills address aspects the primary skill does not cover — reference them for completeness.\n\n`;
  } else {
    prompt += `\n\n`;
  }

  prompt += `### Primary Skill\n\n`;
  prompt += `**${top.name}** — relevance: ${top.final_score.toFixed(3)}\n`;
  prompt += `> ${top.description.slice(0, 250)}\n\n`;
  prompt += `Read: \`${top.path}\`\n\n`;

  if (companions.length > 0) {
    prompt += `### Compound Skills\n\n`;
    prompt += `These skills cover different aspects of the task (low overlap with primary). Use them to fill gaps:\n\n`;
    for (const c of companions) {
      prompt += `- **${c.name}** (${c.final_score.toFixed(3)}) — ${inferContribution(c)}: ${c.description.slice(0, 120)}\n`;
    }
    prompt += '\n';
  }

  if (relevantLearnings && relevantLearnings.length > 0) {
    prompt += `### Context: Accumulated Learnings\n\n`;
    prompt += `These patterns from prior experience apply to this task:\n\n`;
    for (const l of relevantLearnings.slice(0, 3)) {
      prompt += `- **${l.pattern}** (confidence: ${l.confidence}): ${l.description.slice(0, 150)}\n`;
    }
    prompt += '\n';
  }

  if (companions.length > 0) {
    prompt += `### Execution Order\n\n`;
    prompt += `1. Read and apply **${top.name}** as the primary approach\n`;
    companions.forEach((c, i) => {
      prompt += `${i + 2}. Augment with **${c.name}** for ${inferContribution(c)}\n`;
    });
    prompt += '\n';
  }

  return {
    type: companions.length > 0 ? 'compound' : 'single',
    primary: top.name,
    companions: companions.map(c => c.name),
    prompt
  };
}

function inferContribution(skill) {
  const desc = skill.description.toLowerCase();
  if (desc.includes('test') || desc.includes('tdd')) return 'testing discipline';
  if (desc.includes('debug') || desc.includes('diagnos')) return 'debugging rigor';
  if (desc.includes('perf') || desc.includes('speed')) return 'performance optimization';
  if (desc.includes('secur') || desc.includes('resilien')) return 'error resilience';
  if (desc.includes('git') || desc.includes('commit')) return 'git workflow';
  if (desc.includes('architect') || desc.includes('diagram')) return 'architecture clarity';
  if (desc.includes('schema') || desc.includes('databas')) return 'data modeling';
  return 'additional coverage';
}

// --- Learnings Retrieval ---

function getRelevantLearnings(task) {
  const indexedPath = path.join(MEMORY_DIR, 'indexed-learnings.json');
  if (!fs.existsSync(indexedPath)) return [];

  const indexed = JSON.parse(fs.readFileSync(indexedPath, 'utf8'));
  const taskKeywords = tokenize(task);
  const scores = new Map();

  for (const kw of taskKeywords) {
    const ids = indexed.keyword_index[kw] || [];
    for (const id of ids) {
      scores.set(id, (scores.get(id) || 0) + 1);
    }
  }

  const allPatterns = Object.values(indexed.categories).flat();
  return [...scores.entries()]
    .map(([id, score]) => {
      const p = allPatterns.find(x => x.id === id);
      if (!p) return null;
      return { ...p, relevance_score: score * (p.confidence || 0.5) };
    })
    .filter(Boolean)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5);
}

// --- Main ---

function main() {
  const task = process.argv.slice(2).join(' ');
  if (!task) {
    console.error('Usage: node route-task.js "your task description"');
    process.exit(1);
  }

  const rlState = loadJson('rl-state.json');
  const discoveredSkills = loadJson('discovered-skills.json');

  const installedSkills = getAllInstalledSkills();
  let allSkills = [...installedSkills];

  if (discoveredSkills && discoveredSkills.skills) {
    for (const ds of discoveredSkills.skills) {
      allSkills.push({
        name: ds.name || ds.source,
        description: ds.description || '',
        path: ds.url || ds.source,
        location: 'discovered',
        content_preview: ds.description || ''
      });
    }
  }

  const corpus = buildCorpus(allSkills);
  const idf = computeIDF(corpus);
  const ranked = scoreSkills(task, allSkills, corpus, idf, rlState);
  const relevantLearnings = getRelevantLearnings(task);
  const route = generateCompoundRoute(task, ranked.slice(0, 10), relevantLearnings);

  const output = {
    task,
    total_skills_searched: allSkills.length,
    matches_found: ranked.length,
    routing_type: route.type,
    top_skills: ranked.slice(0, 5).map(s => ({
      name: s.name,
      score: parseFloat(s.final_score.toFixed(4)),
      tfidf: parseFloat(s.tfidf_score.toFixed(4)),
      ngram_bonus: parseFloat(s.ngram_bonus.toFixed(3)),
      location: s.location,
      description: s.description.slice(0, 120)
    })),
    compound_skills: route.companions || [],
    relevant_learnings: relevantLearnings.slice(0, 3).map(l => ({
      pattern: l.pattern,
      confidence: l.confidence,
      relevance: l.relevance_score
    })),
    invocation_prompt: route.prompt
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
