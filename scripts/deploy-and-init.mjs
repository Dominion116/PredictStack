#!/usr/bin/env node
/**
 * Deploys predictstacksv2 and initialises it with the deployer
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
import { STACKS_TESTNET, STACKS_MAINNET, createNetwork } from '@stacks/network';

const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY;
const CONTRACT_NAME = process.env.CONTRACT_NAME || 'predictstacksv2';
const CONTRACT_PATH = process.env.CONTRACT_PATH || `contracts/${CONTRACT_NAME}.clar`;
const NETWORK_ENV = process.env.NETWORK || 'testnet';
const PLATFORM_FEE_MICRO = Number(process.env.PLATFORM_FEE_MICRO || 10_000);
const MIN_BET_MICRO = 20_000;
const MAX_BET_MICRO = 100_000;

if (!PRIVATE_KEY) {
  console.error('Error: STACKS_PRIVATE_KEY is not set in .env');
  process.exit(1);
}

const isMainnet = NETWORK_ENV === 'mainnet';
const network = createNetwork(isMainnet ? STACKS_MAINNET : STACKS_TESTNET);
const deployer = getAddressFromPrivateKey(PRIVATE_KEY, isMainnet ? 'mainnet' : 'testnet');
const INIT_ONLY = process.argv.includes('--init');
const ADMIN_PRINCIPAL = process.env.ADMIN_PRINCIPAL || deployer;
const ORACLE_PRINCIPAL = process.env.ORACLE_PRINCIPAL || deployer;
const TREASURY_PRINCIPAL = process.env.TREASURY_PRINCIPAL || deployer;

const ADMIN_ADDRESSES = [
  'SP2RVJGCGABWB5G0WEPE936G270D1RKF1WV2GD7SM',
  'SP2WCKWN7A7HBHEHCQPQ8RFWSH1XKDP54TAE7KDQ2',
  'SPWNGG8E2F9TBFQWVD3JJZP23HMWAVTNY34FFBB6',
  'SPJY043NRW86A9SVMHPC6AZ1CWCXV21KCDC42P2N',
  'SP4M1E1W3VKAFPARARGYM37VQP0YHD3MAWJZJHAK',
  'SP3XR5PCCV557KE2ZZB3W04B91F6042HKZ8KNX1ZS',
  'SPCVN53XEJ7XGV571VXG2Y04RDAWEVK4JJEBGDWN',
  'SP1VWYTPKTY8W4AWNYR00YD4E914RSWGM70VKVCAY',
  'SPESCH9H4NHZ9YB6FS4BAH0F456MQ6PF9B8176TF',
  'SP1ZDHDT2D6EH9CTJZA2FMTV8FJGTBSQBJQ46ABEN',
  'SP1VQAZCJ0QG4E3ZH7A4KWGM0HAXFQ6H0CRSC1WG7',
  'SP1RGC5S7AVMSQ5VMV7553KRDBQ3A3PYQAPAXMYZ',
  'SP2M4KFTK44T9D1DDMQYAWRDEV8WJCTFA3YEV0XH0',
  'SP1XFHC8VHZ343RJ1VTCPV03VCN7VTQ3E49H6B8G7',
  'SP1N987N2RF3YSSP17A5Q4Z1E5XTBX49HWJ3AWGFJ',
  'SP2SX1JGSQQJF23NQ526PHCPMCGHGZJV02GT8YZ0Z',
  'SP0MJXT37BKWJZWBAECFGY71A3WREC2EHH3H8Y0',
  'SP2FRFTJPAX8FTZ531K6C9NYB82YW10Q43YBDRMX6',
  'SP1EM6HQFSV15WYS4G9BRMM3YF4TH9Y4437YCKTG1',
  'SP1HCK50FDRC50F7VWRZJ9747V2EB38YA8FXGRXNC',
  'SPTY43XCCTF13W3T1X85TAWM11DV2K22T1BCBWJG',
  'SP3HF104GHP6CBE5SPNHWAMDT0QCEQEN3MZABC3S7',
  'SP37Y64G6T0YTBNR1EDHZSSJ296XFENS7V7VT4G4',
  'SP3E6C0ZZ1BYY3JV1T0Z9ZYR5KYAG941SY8MET12N',
  'SP2V7ZP3MXVNG5G58ZGEN0GE91G2Y0ZWT5APG4RPD',
];

console.log(`Deployer: ${deployer}`);
console.log(`Contract: ${deployer}.${CONTRACT_NAME}`);
console.log(`Mode:     ${INIT_ONLY ? 'init only' : 'deploy + init'}\n`);

async function broadcast(tx, label) {
  const result = await broadcastTransaction({ transaction: tx, network });
  if (result.error) {
    throw new Error(`${label} failed: ${result.reason ?? result.error}`);
  }
  console.log(`${label} TX: https://explorer.hiro.so/txid/${result.txid}?chain=${isMainnet ? 'mainnet' : 'testnet'}`);
  return result.txid;
}

async function waitForConfirmation(txid, label) {
  const apiUrl = isMainnet ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so';
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
  const codeBody = await readFile(CONTRACT_PATH, 'utf8');
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
    Cl.principal(ADMIN_PRINCIPAL),
    Cl.principal(ORACLE_PRINCIPAL),
    Cl.principal(TREASURY_PRINCIPAL),
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

const networkPrefix = isMainnet ? 'SP' : 'ST';
const filteredAdmins = ADMIN_ADDRESSES.filter(address => address.startsWith(networkPrefix));
const uniqueAdmins = Array.from(new Set([...filteredAdmins, deployer]));

for (const adminAddress of uniqueAdmins) {
  const addAdminTx = await makeContractCall({
    contractAddress: deployer,
    contractName: CONTRACT_NAME,
    functionName: 'add-admin',
    functionArgs: [Cl.principal(adminAddress)],
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    validateWithAbi: false,
  });

  const addAdminTxid = await broadcast(addAdminTx, `Add admin (${adminAddress})`);
  await waitForConfirmation(addAdminTxid, `Add admin (${adminAddress})`);
}

console.log('Done. Contract is deployed and initialized.');
console.log(`Admin:    ${ADMIN_PRINCIPAL}`);
console.log(`Oracle:   ${ORACLE_PRINCIPAL}`);
console.log(`Treasury: ${TREASURY_PRINCIPAL}`);
console.log(`Platform fee: ${PLATFORM_FEE_MICRO} microSTX`);
console.log(`Bet range:    ${MIN_BET_MICRO} – ${MAX_BET_MICRO} microSTX`);
