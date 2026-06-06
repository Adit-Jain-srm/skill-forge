/**
 * Shared utilities for skill-forge scripts.
 * Handles memory initialization, graceful loading, and path resolution.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MEMORY_DIR = path.join(ROOT, 'memory');
const DEFAULTS_DIR = path.join(MEMORY_DIR, 'defaults');

const REQUIRED_MEMORY_FILES = [
  'rl-state.json',
  'discovered-skills.json',
  'learnings.json',
  'gaps.json',
  'published.json',
  'reputation-playbook.json',
  'installed-skills.json',
  'anti-laziness-findings.json'
];

/**
 * Ensures all required memory files exist.
 * Copies from defaults/ if missing. Creates defaults/ structure if nothing exists.
 * Safe to call multiple times (idempotent).
 */
function ensureMemoryInitialized() {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }

  for (const file of REQUIRED_MEMORY_FILES) {
    const targetPath = path.join(MEMORY_DIR, file);
    if (!fs.existsSync(targetPath)) {
      const defaultPath = path.join(DEFAULTS_DIR, file);
      if (fs.existsSync(defaultPath)) {
        fs.copyFileSync(defaultPath, targetPath);
      } else {
        // Minimal valid structure if no default exists
        const minimal = file.endsWith('.json') ? '{}' : '';
        fs.writeFileSync(targetPath, minimal);
      }
    }
  }

  // Ensure JSONL files exist (append-only, can be empty)
  const jsonlFiles = ['evolution-log.jsonl', 'self-checks.jsonl', 'skillopt-log.jsonl'];
  for (const file of jsonlFiles) {
    const targetPath = path.join(MEMORY_DIR, file);
    if (!fs.existsSync(targetPath)) {
      fs.writeFileSync(targetPath, '');
    }
  }
}

/**
 * Load a JSON file from memory, with graceful fallback.
 * Returns default value (or null) if file missing/corrupt.
 */
function loadMemoryFile(filename, defaultValue = null) {
  const filepath = path.join(MEMORY_DIR, filename);
  if (!fs.existsSync(filepath)) {
    // Try copying from defaults
    const defaultPath = path.join(DEFAULTS_DIR, filename);
    if (fs.existsSync(defaultPath)) {
      fs.copyFileSync(defaultPath, filepath);
    } else {
      return defaultValue;
    }
  }
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    if (!content.trim()) return defaultValue;
    return JSON.parse(content);
  } catch (e) {
    console.error(`[WARN] Failed to parse ${filename}: ${e.message}. Using default.`);
    return defaultValue;
  }
}

/**
 * Save JSON to memory with atomic write.
 */
function saveMemoryFile(filename, data) {
  const filepath = path.join(MEMORY_DIR, filename);
  const tmpPath = filepath + '.tmp';
  data.last_updated = new Date().toISOString();
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, filepath);
}

module.exports = {
  ROOT,
  MEMORY_DIR,
  DEFAULTS_DIR,
  REQUIRED_MEMORY_FILES,
  ensureMemoryInitialized,
  loadMemoryFile,
  saveMemoryFile
};
