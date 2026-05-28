#!/usr/bin/env node
/**
 * Validates that required environment variables are set before starting.
 * Run: node scripts/validate-env.mjs
 */

const REQUIRED = [
  'MONGODB_URI',
  'STACKS_PRIVATE_KEY',
  'NEXT_PUBLIC_BACKEND_URL',
  'NEXT_PUBLIC_CONTRACT_ADDRESS',
  'NEXT_PUBLIC_CONTRACT_NAME',
  'NEXT_PUBLIC_NETWORK',
];

const OPTIONAL = [
  'PINATA_API_KEY',
  'PINATA_SECRET_KEY',
  'PORT',
];

let hasError = false;

console.log('\n🔍  Validating environment variables…\n');

for (const key of REQUIRED) {
  const val = process.env[key];
  if (!val || val.startsWith('YOUR_') || val.startsWith('<')) {
    console.error(`  ❌  ${key} — missing or placeholder`);
    hasError = true;
  } else {
    console.log(`  ✅  ${key}`);
  }
}

console.log('');

for (const key of OPTIONAL) {
  const val = process.env[key];
  if (!val) {
    console.warn(`  ⚠️   ${key} — not set (optional)`);
  } else {
    console.log(`  ✅  ${key}`);
  }
}

console.log('');

if (hasError) {
  console.error('Environment validation failed. Set the missing variables and retry.\n');
  process.exit(1);
}

console.log('All required variables are set.\n');
