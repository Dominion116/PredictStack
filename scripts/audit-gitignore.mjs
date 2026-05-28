#!/usr/bin/env node
/**
 * Audits the repository for common sensitive files that should be in .gitignore.
 * Usage: node scripts/audit-gitignore.mjs
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

const SENSITIVE_PATTERNS = [
  /^\.env$/,
  /^\.env\..+$/,
  /\.pem$/,
  /\.key$/,
  /id_rsa/,
  /id_ed25519/,
  /secret/i,
  /credentials\.json$/,
  /serviceAccount\.json$/,
  /config\.bat$/,
];

const GITIGNORE_PATH = '.gitignore';

console.log('\n🔍  Auditing .gitignore coverage…\n');

const gitignore = existsSync(GITIGNORE_PATH)
  ? readFileSync(GITIGNORE_PATH, 'utf-8')
  : '';

// Get all tracked files
let tracked = [];
try {
  tracked = execSync('git ls-files', { encoding: 'utf-8' }).trim().split('\n');
} catch {
  console.error('Not a git repository or git not available.');
  process.exit(1);
}

const warnings = [];
for (const file of tracked) {
  for (const pattern of SENSITIVE_PATTERNS) {
    const basename = file.split('/').pop() ?? '';
    if (pattern.test(basename) || pattern.test(file)) {
      warnings.push({ file, pattern: pattern.toString() });
      break;
    }
  }
}

if (warnings.length === 0) {
  console.log('No obviously sensitive files are tracked by git. ✅\n');
} else {
  console.warn(`Found ${warnings.length} potentially sensitive tracked file(s):\n`);
  for (const { file, pattern } of warnings) {
    console.warn(`  ⚠️  ${file}  (matched: ${pattern})`);
  }
  console.log('\nConsider adding these to .gitignore and removing from tracking.\n');
}

// Check for .env.production specifically
const envProd = tracked.find(f => f.endsWith('.env.production'));
if (envProd) {
  console.warn(`  🔴  .env.production is tracked! Add it to .gitignore immediately.\n`);
}
