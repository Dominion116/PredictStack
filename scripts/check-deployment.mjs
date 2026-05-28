#!/usr/bin/env node
/**
 * Verifies a contract deployment on Stacks testnet or mainnet.
 * Usage: NETWORK=testnet node scripts/check-deployment.mjs <contract-address> <contract-name>
 */

const NETWORK = process.env.NETWORK ?? 'testnet';
const API_BASE = NETWORK === 'mainnet'
  ? 'https://api.mainnet.hiro.so'
  : 'https://api.testnet.hiro.so';

const [, , address, name] = process.argv;

if (!address || !name) {
  console.error('Usage: node scripts/check-deployment.mjs <address> <contract-name>');
  process.exit(1);
}

const url = `${API_BASE}/v2/contracts/interface/${address}/${name}`;
console.log(`\nChecking ${NETWORK}: ${address}.${name}\n`);

try {
  const res = await fetch(url);
  if (res.status === 404) {
    console.error('Contract not found. Deployment may have failed or is still pending.\n');
    process.exit(1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const info = await res.json();
  const fnCount = info.functions?.length ?? 0;
  const mapCount = info.maps?.length ?? 0;
  const varCount = info.variables?.length ?? 0;

  console.log(`Contract found on ${NETWORK}!`);
  console.log(`  Functions : ${fnCount}`);
  console.log(`  Maps      : ${mapCount}`);
  console.log(`  Variables : ${varCount}\n`);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
