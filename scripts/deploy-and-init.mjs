#!/usr/bin/env node
/**
 * Deploys predictionmarketv7 to testnet and initialises it with the deployer
 * address as admin, oracle, and treasury.
 *
 * Usage:
 *   node scripts/deploy-and-init.mjs          # deploy + init
 *   node scripts/deploy-and-init.mjs --init   # init only (contract already deployed)
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import {
  AnchorMode,
  PostConditionMode,
  broadcastTransaction,
  getAddressFromPrivateKey,
  makeContractCall,
  makeContractDeploy,
  Cl,
} from '@stacks/transactions';
import { STACKS_TESTNET, createNetwork } from '@stacks/network';

const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY;
const CONTRACT_NAME = process.env.CONTRACT_NAME || 'predictionmarketv7';
const PLATFORM_FEE_MICRO = Number(process.env.PLATFORM_FEE_MICRO || 10_000);
const MIN_BET_MICRO = 20_000;
const MAX_BET_MICRO = 100_000;

if (!PRIVATE_KEY) {
  console.error('Error: STACKS_PRIVATE_KEY is not set in .env');
  process.exit(1);
}

const network = createNetwork(STACKS_TESTNET);
const deployer = getAddressFromPrivateKey(PRIVATE_KEY, 'testnet');
const INIT_ONLY = process.argv.includes('--init');

console.log(`Deployer: ${deployer}`);
console.log(`Contract: ${deployer}.${CONTRACT_NAME}`);
console.log(`Mode:     ${INIT_ONLY ? 'init only' : 'deploy + init'}\n`);

async function broadcast(tx, label) {
  const result = await broadcastTransaction({ transaction: tx, network });
  if (result.error) {
    throw new Error(`${label} failed: ${result.reason ?? result.error}`);
  }
  console.log(`${label} TX: https://explorer.hiro.so/txid/${result.txid}?chain=testnet`);
  return result.txid;
}

async function waitForConfirmation(txid, label) {
  const apiUrl = 'https://api.testnet.hiro.so';
  console.log(`Waiting for ${label} to confirm…`);
  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise(r => setTimeout(r, 15_000));
    const res = await fetch(`${apiUrl}/extended/v1/tx/${txid}`);
    if (!res.ok) continue;
    const data = await res.json();
    if (data.tx_status === 'success') {
      console.log(`  ✓ ${label} confirmed (block ${data.block_height})\n`);
      return;
    }
    if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
      throw new Error(`${label} aborted on-chain: ${JSON.stringify(data.tx_result)}`);
    }
    process.stdout.write('.');
  }
  throw new Error(`${label} did not confirm within 10 minutes — check the explorer link above`);
}

// ── Deploy ────────────────────────────────────────────────────────────────────
if (!INIT_ONLY) {
  const codeBody = await readFile('contracts/predictionmarketv7.clar', 'utf8');
  const deployTx = await makeContractDeploy({
    contractName: CONTRACT_NAME,
    codeBody,
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  });

  const deployTxid = await broadcast(deployTx, 'Deploy');
  await waitForConfirmation(deployTxid, 'Deploy');
}

// ── Initialize ────────────────────────────────────────────────────────────────
const initTx = await makeContractCall({
  contractAddress: deployer,
  contractName: CONTRACT_NAME,
  functionName: 'initialize',
  functionArgs: [
    Cl.principal(deployer),   // admin
    Cl.principal(deployer),   // oracle
    Cl.principal(deployer),   // treasury
    Cl.uint(PLATFORM_FEE_MICRO),
    Cl.uint(MIN_BET_MICRO),
    Cl.uint(MAX_BET_MICRO),
  ],
  senderKey: PRIVATE_KEY,
  network,
  anchorMode: AnchorMode.Any,
  postConditionMode: PostConditionMode.Allow,
  validateWithAbi: false,
});

const initTxid = await broadcast(initTx, 'Initialize');
await waitForConfirmation(initTxid, 'Initialize');

console.log('Done. Contract is deployed and initialized.');
console.log(`Admin / Oracle / Treasury: ${deployer}`);
console.log(`Platform fee: ${PLATFORM_FEE_MICRO} microSTX`);
console.log(`Bet range:    ${MIN_BET_MICRO} – ${MAX_BET_MICRO} microSTX`);
