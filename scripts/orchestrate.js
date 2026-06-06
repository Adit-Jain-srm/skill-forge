#!/usr/bin/env node
/**
 * skill-forge project orchestrator
 * Coordinates end-to-end project guidance by combining multiple skills
 * and learnings into a structured execution plan.
 *
 * Phases: grill → research → architect → route → guide → review → learn
 *
 * Usage:
 *   node orchestrate.js "build a SaaS invoicing platform"
 *   node orchestrate.js --phase architect "real-time chat with CRDT"
 *   node orchestrate.js --status
 *
 * Output: Structured JSON orchestration plan
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MEMORY_DIR = path.join(__dirname, '..', 'memory');
const SCRIPTS_DIR = __dirname;

function loadJson(filename) {
  const filepath = path.join(MEMORY_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function saveJson(filename, data) {
  const filepath = path.join(MEMORY_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// --- Phase 1: GRILL (Extract project constraints) ---

function generateGrillQuestions(projectDescription) {
  const questions = {
    constraints: [
      'What is the timeline? (days/weeks/months)',
      'Team size and skill levels?',
      'Budget constraints? (hosting, services, tools)',
      'Must-have vs nice-to-have features?'
    ],
    technical: [
      'What scale do you expect? (users, requests/sec, data volume)',
      'Any existing tech stack commitments? (language, framework, cloud)',
      'Real-time requirements? (WebSocket, SSE, polling)',
      'Data consistency requirements? (eventual, strong, CRDT)'
    ],
    scope: [
      'What is the MVP — minimum to prove the idea works?',
      'Who are the users? (developers, end-users, enterprise)',
      'What does "done" look like for v1?',
      'What is explicitly OUT of scope?'
    ]
  };

  const contextual = [];
  const desc = projectDescription.toLowerCase();

  if (desc.includes('real-time') || desc.includes('collab')) {
    contextual.push('Conflict resolution strategy? (last-write-wins, OT, CRDT)');
    contextual.push('Offline support needed?');
  }
  if (desc.includes('saas') || desc.includes('platform')) {
    contextual.push('Multi-tenancy model? (shared DB, schema-per-tenant, DB-per-tenant)');
    contextual.push('Pricing model? (freemium, per-seat, usage-based)');
  }
  if (desc.includes('ai') || desc.includes('llm') || desc.includes('agent')) {
    contextual.push('Which models? (OpenAI, Anthropic, open-source)');
    contextual.push('Latency budget for AI calls?');
  }
  if (desc.includes('mobile') || desc.includes('app')) {
    contextual.push('Platforms? (iOS, Android, both, PWA)');
    contextual.push('Native vs cross-platform? (React Native, Flutter, native)');
  }

  if (contextual.length > 0) questions.contextual = contextual;

  return questions;
}

// --- Phase 2: RESEARCH (Find approaches) ---

function generateResearchPlan(projectDescription) {
  const keywords = projectDescription.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const searches = [];

  searches.push({
    source: 'exa',
    query: `best architecture for ${projectDescription} 2026`,
    purpose: 'Find current best practices'
  });

  searches.push({
    source: 'exa',
    query: `${keywords.slice(0, 3).join(' ')} open source production-ready`,
    purpose: 'Find existing implementations to learn from'
  });

  searches.push({
    source: 'learnings',
    method: 'indexed-memory retrieval',
    purpose: 'Surface relevant patterns from accumulated knowledge'
  });

  searches.push({
    source: 'github',
    query: `${keywords.slice(0, 2).join(' ')} stars:>100`,
    purpose: 'Find high-quality repos solving similar problems'
  });

  return searches;
}

// --- Phase 3: ARCHITECT (Propose architectures) ---

function proposeArchitectures(projectDescription, learnings) {
  const architectures = [];
  const desc = projectDescription.toLowerCase();

  const baseArch = {
    name: 'Pragmatic Monolith',
    philosophy: 'Start with a well-structured monolith, extract services only when proven necessary',
    pros: ['Faster to build', 'Easier to debug', 'Lower operational complexity'],
    cons: ['May need refactoring at scale', 'Team coordination in single codebase'],
    best_for: 'Teams < 5, timeline < 3 months, uncertain requirements',
    feasibility: 0.9,
    novelty: 0.3
  };

  const microArch = {
    name: 'Event-Driven Services',
    philosophy: 'Loosely coupled services communicating via events, each owning their data',
    pros: ['Independent scaling', 'Team autonomy', 'Fault isolation'],
    cons: ['Distributed complexity', 'Eventual consistency', 'Higher operational overhead'],
    best_for: 'Teams > 5, known scale requirements, clear domain boundaries',
    feasibility: 0.6,
    novelty: 0.5
  };

  const edgeArch = {
    name: 'Edge-First Serverless',
    philosophy: 'Compute at the edge, serverless functions, global distribution by default',
    pros: ['Low latency globally', 'Zero server management', 'Pay-per-use'],
    cons: ['Cold starts', 'Limited compute time', 'Vendor lock-in risk'],
    best_for: 'Global user base, bursty traffic, API-focused products',
    feasibility: 0.7,
    novelty: 0.7
  };

  architectures.push(baseArch, microArch, edgeArch);

  if (desc.includes('real-time') || desc.includes('collab')) {
    architectures.push({
      name: 'CRDT-Native Distributed',
      philosophy: 'Conflict-free replicated data types at the core, offline-first with sync',
      pros: ['True offline support', 'No conflict resolution logic', 'P2P capable'],
      cons: ['Limited data model flexibility', 'Memory overhead', 'Debugging complexity'],
      best_for: 'Collaborative editing, offline-first apps, distributed systems',
      feasibility: 0.5,
      novelty: 0.9
    });
  }

  if (desc.includes('ai') || desc.includes('agent')) {
    architectures.push({
      name: 'Agent Mesh',
      philosophy: 'Multiple specialized AI agents coordinated by an orchestrator, with human-in-the-loop',
      pros: ['Modular AI capabilities', 'Easy to add new abilities', 'Graceful degradation'],
      cons: ['Coordination complexity', 'Cost of multiple LLM calls', 'Latency stacking'],
      best_for: 'Complex AI workflows, multi-step reasoning, tool-using agents',
      feasibility: 0.6,
      novelty: 0.8
    });
  }

  for (const arch of architectures) {
    arch.score = (arch.feasibility * 0.4 + arch.novelty * 0.3 + 0.3).toFixed(2);
  }

  architectures.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
  return architectures.slice(0, 3);
}

// --- Phase 4: ROUTE (Map to skills) ---

function routeToSkills(projectDescription) {
  try {
    const result = execSync(
      `node "${path.join(SCRIPTS_DIR, 'route-task.js')}" "${projectDescription.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', timeout: 10000 }
    );
    return JSON.parse(result);
  } catch (e) {
    return { error: 'Routing failed', message: e.message };
  }
}

// --- Phase 5: GUIDE (Execution plan) ---

function generateExecutionPlan(projectDescription, architecture, skills) {
  const phases = [
    {
      phase: 1,
      name: 'Foundation',
      duration: '1-2 days',
      tasks: [
        'Set up repository with proper structure',
        'Configure development environment',
        'Define data models / schema',
        `Apply architecture: ${architecture.name}`
      ],
      skills_needed: ['git-workflow', 'db-schema']
    },
    {
      phase: 2,
      name: 'Core Implementation',
      duration: '3-7 days',
      tasks: [
        'Implement primary business logic',
        'Build API layer',
        'Create data access layer',
        'Add error handling and resilience'
      ],
      skills_needed: ['error-resilience', 'prove-it']
    },
    {
      phase: 3,
      name: 'Integration & Polish',
      duration: '2-4 days',
      tasks: [
        'Connect frontend to backend',
        'Add authentication/authorization',
        'Performance optimization',
        'Testing and validation'
      ],
      skills_needed: ['web-perf', 'self-review']
    },
    {
      phase: 4,
      name: 'Ship & Learn',
      duration: '1-2 days',
      tasks: [
        'Deploy to production',
        'Set up monitoring',
        'Document architecture decisions',
        'Extract learnings for next project'
      ],
      skills_needed: ['arch-from-code', 'handoff']
    }
  ];

  return {
    total_estimated_duration: '7-15 days',
    architecture: architecture.name,
    phases,
    checkpoints: [
      'After Phase 1: Does the foundation support the chosen architecture?',
      'After Phase 2: Does core logic handle edge cases? (run prove-it)',
      'After Phase 3: Performance meets requirements? (run web-perf)',
      'After Phase 4: Can another developer continue this? (run handoff)'
    ]
  };
}

// --- Phase 7: LEARN (Extract for next time) ---

function generateLearningPrompt(projectDescription) {
  return {
    questions: [
      'What architectural decision proved most impactful?',
      'What would you do differently on day 1?',
      'Which skill was most valuable? Which was unused?',
      'What took longer than expected? Why?',
      'What novel pattern emerged that should be captured?'
    ],
    format: {
      pattern: 'Describe the learning',
      serves_self_improvement: 'How this makes future orchestrations better',
      serves_reputation: 'Could this become a new skill?',
      apply_to: ['projects', 'skill-creation'],
      immediate_action: 'What changes right now because of this?'
    }
  };
}

// --- Main Orchestration ---

function orchestrate(projectDescription, targetPhase) {
  const plan = {
    project: projectDescription,
    orchestrated_at: new Date().toISOString(),
    phases: {}
  };

  const phases = ['grill', 'research', 'architect', 'route', 'guide', 'review', 'learn'];
  const startIdx = targetPhase ? phases.indexOf(targetPhase) : 0;
  const endIdx = targetPhase ? startIdx + 1 : phases.length;

  for (let i = startIdx; i < endIdx; i++) {
    const phase = phases[i];
    switch (phase) {
      case 'grill':
        plan.phases.grill = {
          status: 'questions_generated',
          questions: generateGrillQuestions(projectDescription),
          instruction: 'Ask these ONE AT A TIME. Wait for answer before next question.'
        };
        break;

      case 'research':
        plan.phases.research = {
          status: 'plan_generated',
          searches: generateResearchPlan(projectDescription),
          instruction: 'Execute these searches. Synthesize findings before moving to architect phase.'
        };
        break;

      case 'architect': {
        const learnings = loadJson('indexed-learnings.json');
        plan.phases.architect = {
          status: 'proposals_generated',
          architectures: proposeArchitectures(projectDescription, learnings),
          instruction: 'Present these ranked by score. Let user choose or combine.'
        };
        break;
      }

      case 'route':
        plan.phases.route = {
          status: 'skills_matched',
          routing: routeToSkills(projectDescription),
          instruction: 'Use primary skill for core work. Compound skills for full coverage.'
        };
        break;

      case 'guide': {
        const archs = proposeArchitectures(projectDescription);
        plan.phases.guide = {
          status: 'plan_generated',
          execution: generateExecutionPlan(projectDescription, archs[0], []),
          instruction: 'Follow phase by phase. Run checkpoint validation after each.'
        };
        break;
      }

      case 'review':
        plan.phases.review = {
          status: 'criteria_defined',
          criteria: [
            'Does output match architecture decision?',
            'Are all edge cases handled?',
            'Is performance acceptable?',
            'Would you star this if you found it on GitHub?'
          ],
          instruction: 'Run self-review and prove-it skills on output.'
        };
        break;

      case 'learn':
        plan.phases.learn = {
          status: 'template_ready',
          extraction: generateLearningPrompt(projectDescription),
          instruction: 'Answer these questions. Record in learnings.json. Apply immediately.'
        };
        break;
    }
  }

  return plan;
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--status')) {
    const state = loadJson('skillopt-state.json');
    console.log(JSON.stringify({ orchestrator: 'ready', skillopt_state: state }, null, 2));
    return;
  }

  const phaseIdx = args.indexOf('--phase');
  const targetPhase = phaseIdx >= 0 ? args[phaseIdx + 1] : null;

  const projectArgs = args.filter((a, i) => {
    if (a.startsWith('--')) return false;
    if (i > 0 && args[i - 1] === '--phase') return false;
    return true;
  });

  const projectDescription = projectArgs.join(' ');

  if (!projectDescription) {
    console.error('Usage: node orchestrate.js "project description"');
    console.error('       node orchestrate.js --phase <grill|research|architect|route|guide|review|learn> "description"');
    console.error('       node orchestrate.js --status');
    process.exit(1);
  }

  const plan = orchestrate(projectDescription, targetPhase);
  console.log(JSON.stringify(plan, null, 2));
}

main();
