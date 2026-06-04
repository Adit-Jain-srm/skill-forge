#!/usr/bin/env node
/**
 * skill-forge Capafy publishing automation
 * Prepares skills for Capafy marketplace monetization.
 * 
 * Capafy model: 80% to publisher, 20% platform fee.
 * Three modes: Subscribe (recurring), Rent (hourly), Download (one-time).
 * 
 * Usage:
 *   node capafy-publish.js --skill <name> --mode download --price 0
 *   node capafy-publish.js --skill <name> --mode subscribe --price 4.99
 *   node capafy-publish.js --list   (show all publishable skills with pricing recommendations)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKILLS = path.join(ROOT, 'skills');

function getSkillInfo(skillName) {
  const skillPath = path.join(SKILLS, skillName, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return null;
  const content = fs.readFileSync(skillPath, 'utf8');
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  const description = fmMatch ? (fmMatch[1].match(/description:[\s\S]*?(?=\n\w|$)/)?.[0] || '') : '';
  return { name: skillName, path: skillPath, lines: content.split('\n').length, description: description.replace(/^description:\s*>?-?\s*/, '').trim() };
}

function recommendPricing(skill) {
  // Free skills build reputation → paid premium skills later
  // Strategy: offer core skills FREE on download (reputation), premium collection as subscription
  const freeSkills = ['grill', 'zoom-out', 'handoff', 'setup', 'prove-it'];
  const premiumSkills = ['session-guard', 'dynamic-workflow', 'mcp-conductor', 'context-builder'];
  
  if (freeSkills.includes(skill.name)) {
    return { mode: 'download', price: 0, reason: 'Free builds reputation. Users install → discover paid skills.' };
  }
  if (premiumSkills.includes(skill.name)) {
    return { mode: 'download', price: 2.99, reason: 'Unique value (first-mover or solves confirmed #1 pain). Worth paying for.' };
  }
  return { mode: 'download', price: 0, reason: 'Free in collection. Premium value comes from the compound set.' };
}

function generateCapafyListing(skill, pricing) {
  return {
    name: `skill-forge: ${skill.name}`,
    description: skill.description.slice(0, 200),
    category: 'Development',
    tags: ['cursor-skill', 'agent-skills', 'behavioral', 'productivity', skill.name],
    pricing_mode: pricing.mode,
    price_usd: pricing.price,
    support_email: 'aditjain2005@gmail.com',
    test_case: {
      input: `Invoke /${skill.name} in a coding session`,
      expected: `Agent activates ${skill.name} behavioral pattern and maintains it throughout session`
    },
    repo: `https://github.com/Adit-Jain-srm/skill-forge/tree/main/skills/${skill.name}`,
    install: `npx skills@latest add Adit-Jain-srm/skill-forge --skill ${skill.name}`
  };
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--list')) {
    console.log('\n📦 Capafy Publishing Plan\n');
    console.log('Strategy: Free core skills (reputation) + Premium unique skills (revenue)\n');
    console.log('Publisher gets 80%. Platform takes 20%. Downloads have no infra fee.\n');
    
    const skills = fs.readdirSync(SKILLS, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => getSkillInfo(d.name))
      .filter(Boolean);
    
    console.log('| Skill | Mode | Price | Reason |');
    console.log('|-------|------|-------|--------|');
    
    let totalFree = 0, totalPaid = 0;
    for (const skill of skills) {
      const pricing = recommendPricing(skill);
      console.log(`| ${skill.name} | ${pricing.mode} | $${pricing.price} | ${pricing.reason.slice(0, 60)} |`);
      if (pricing.price === 0) totalFree++;
      else totalPaid++;
    }
    
    console.log(`\nTotal: ${totalFree} free (reputation) + ${totalPaid} paid (revenue)`);
    console.log(`\nFull collection subscription (all 16 skills): $9.99/month recommended`);
    console.log(`  → You earn: $9.99 × 80% = $7.99/month per subscriber`);
    console.log(`  → At 100 subscribers: $799/month passive income\n`);
    
    console.log('To publish: Visit https://capafy.ai/earn and use Publisher Skill');
    console.log('Or install Capafy publisher: copy https://api.capafy.ai/install-user-skill.md\n');
    return;
  }
  
  const skillIdx = args.indexOf('--skill');
  if (skillIdx < 0) {
    console.log('Usage: node capafy-publish.js --list');
    console.log('       node capafy-publish.js --skill <name> [--mode download|subscribe] [--price N]');
    return;
  }
  
  const skillName = args[skillIdx + 1];
  const skill = getSkillInfo(skillName);
  if (!skill) { console.error(`Skill not found: ${skillName}`); process.exit(1); }
  
  const pricing = recommendPricing(skill);
  const listing = generateCapafyListing(skill, pricing);
  
  console.log('\n📦 Capafy Listing Draft\n');
  console.log(JSON.stringify(listing, null, 2));
  console.log('\n→ Submit at: https://capafy.ai/earn');
  console.log('→ Or use Publisher Skill inside Claude Code\n');
}

main();
