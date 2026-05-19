import 'dotenv/config';
import { createServer } from 'node:http';

import * as config from './config.mjs';
import { MongoStore } from './store.mjs';
import { createStacksClient } from './stacks.mjs';
import { createRouter } from './router.mjs';
import { specs } from './swagger.js';
import { sendJson } from './middleware/http.mjs';

if (!config.PRIVATE_KEY) {
  throw new Error('STACKS_PRIVATE_KEY is required to run the backend signer.');
}
if (!config.MONGODB_URI) {
  throw new Error('MONGODB_URI is required to run the backend.');
}

const store = await new MongoStore(config.MONGODB_URI).init();
const stacks = createStacksClient({
  network: config.NETWORK,
  contractAddress: config.CONTRACT_ADDRESS,
  contractName: config.CONTRACT_NAME,
  privateKey: config.PRIVATE_KEY,
});

const dispatch = createRouter({ store, stacks, config, specs });

const server = createServer(async (req, res) => {
  try {
    await dispatch(req, res);
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown server error',
    });
  }
});

server.listen(config.PORT, '0.0.0.0', () => {
  console.log(`PredictStack backend listening on http://0.0.0.0:${config.PORT}`);
});

async function checkTxStatus(txId) {
  try {
    const base = config.NETWORK === 'mainnet'
      ? 'https://api.hiro.so'
      : 'https://api.testnet.hiro.so';
    const res = await fetch(`${base}/extended/v1/tx/${txId}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.tx_status; // 'success' | 'abort_by_response' | 'pending' | etc.
  } catch {
    return null;
  }
}

async function reconcileIntents() {
  const state = store.getState();
  let dirty = false;

  for (const bet of Object.values(state.bets || {})) {
    if (bet.status === 'intent' && bet.txId) {
      const txStatus = await checkTxStatus(bet.txId);
      if (txStatus === 'success') {
        bet.status = 'confirmed';
        bet.updatedAt = new Date().toISOString();
        dirty = true;
      } else if (txStatus && txStatus !== 'pending') {
        bet.status = 'failed';
        bet.updatedAt = new Date().toISOString();
        dirty = true;
      }
    }
  }

  for (const claim of Object.values(state.claims || {})) {
    if (claim.status === 'intent' && claim.txId) {
      const txStatus = await checkTxStatus(claim.txId);
      if (txStatus === 'success') {
        claim.status = 'confirmed';
        claim.updatedAt = new Date().toISOString();
        dirty = true;
      } else if (txStatus && txStatus !== 'pending') {
        claim.status = 'failed';
        claim.updatedAt = new Date().toISOString();
        dirty = true;
      }
    }
  }

  if (dirty) await store.save();
}

const RECONCILE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const reconcileTimer = setInterval(reconcileIntents, RECONCILE_INTERVAL_MS);

async function shutdown() {
  clearInterval(reconcileTimer);
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
