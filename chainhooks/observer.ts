import 'dotenv/config';
import path from 'path';
import {
  ChainhookEventObserver,
  type EventObserverOptions,
  type ChainhookNodeOptions,
  type OnPredicatePayloadCallback,
  type Payload,
} from '@hirosystems/chainhook-client';

import { getActivePredicates, activeNetwork } from './predicates';
import { handlePredictStackEvent } from './handlers';

// ── Validate env ─────────────────────────────────────────────────────────────
const required = [
  'CHAINHOOK_NODE_URL',
  'CHAINHOOK_AUTH_TOKEN',
  'CHAINHOOK_PUBLIC_URL',
  'HIRO_API_KEY',
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const chainhookOpts: ChainhookNodeOptions = {
  base_url: process.env.CHAINHOOK_NODE_URL!,
};

// ── Config ────────────────────────────────────────────────────────────────────
const observerOpts: EventObserverOptions = {
  hostname: '0.0.0.0',
  port: Number(process.env.PORT ?? 3001),
  auth_token: process.env.CHAINHOOK_AUTH_TOKEN!,
  external_base_url: process.env.CHAINHOOK_PUBLIC_URL!,
  // Required — file where predicate state is persisted across restarts.
  // Add chainhooks/predicates-state.json to .gitignore.
  predicate_disk_file_path: path.resolve(__dirname, 'predicates-state.json'),
  // Optional tuning
  wait_for_chainhook_node: true,
  validate_chainhook_payloads: false, // set true to debug malformed payloads
  node_type: 'chainhook',
};

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function main() {
  const predicates = getActivePredicates();

  console.log(`[chainhook] Network:    ${activeNetwork}`);
  console.log(`[chainhook] Node URL:   ${process.env.CHAINHOOK_NODE_URL} (api_key appended)`);
  console.log(`[chainhook] Public URL: ${observerOpts.external_base_url}`);
  console.log(`[chainhook] Port:       ${observerOpts.port}`);
  console.log(`[chainhook] State file: ${observerOpts.predicate_disk_file_path}`);
  console.log(`[chainhook] Registering ${predicates.length} predicates...`);

  const server = new ChainhookEventObserver(observerOpts, chainhookOpts);

  const callback: OnPredicatePayloadCallback = async (payload: Payload) => {
    const uuid = payload.chainhook?.uuid ?? 'unknown';
    await handlePredictStackEvent(uuid, payload);
  };

  await server.start(predicates, callback);

  console.log('[chainhook] Observer running. Waiting for events...\n');

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n[chainhook] ${signal} — deregistering predicates and shutting down...`);
    try {
      await server.close();
      console.log('[chainhook] Clean shutdown complete.');
    } catch (err) {
      console.error('[chainhook] Error during shutdown:', err);
    }
    process.exit(0);
  };

  process.once('SIGINT',  () => gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

  process.once('unhandledRejection', (reason) => {
    console.error('[chainhook] Unhandled rejection:', reason);
    process.exit(1);
  });
  process.once('uncaughtException', (err) => {
    console.error('[chainhook] Uncaught exception:', err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('[chainhook] Fatal startup error:', err);
  process.exit(1);
});