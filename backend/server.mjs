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

async function shutdown() {
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
