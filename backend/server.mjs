import 'dotenv/config';

import { createServer } from 'node:http';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import swaggerUi from 'swagger-ui-express';

import { JsonStore } from './store.mjs';
import { createStacksClient } from './stacks.mjs';
import { specs } from './swagger.js';

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '127.0.0.1';
const NETWORK = process.env.NETWORK || 'testnet';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY';
const CONTRACT_NAME = process.env.CONTRACT_NAME || process.env.NEXT_PUBLIC_CONTRACT_NAME || 'predictionmarketv7';
const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY;
const DATA_FILE = process.env.BACKEND_DATA_FILE || path.join(process.cwd(), 'backend', 'data', 'store.json');
const PLATFORM_FEE_MICRO = Number(process.env.PLATFORM_FEE_MICRO || 10_000);

if (!PRIVATE_KEY) {
  throw new Error('STACKS_PRIVATE_KEY is required to run the backend signer.');
}

const store = await new JsonStore(DATA_FILE).init();
const stacks = createStacksClient({
  network: NETWORK,
  contractAddress: CONTRACT_ADDRESS,
  contractName: CONTRACT_NAME,
  privateKey: PRIVATE_KEY,
});

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function sanitizeAddress(address = '') {
  return String(address).trim();
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function makeMarketRef() {
  return `mkt_${Date.now().toString(36)}_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

function computeClaimAmount(position, market) {
  if (!position || !market) return 0;
  if (market.status === 'cancelled') {
    return position.totalWageredMicro;
  }
  if (market.status !== 'resolved' || market.winningOutcome === null || market.winningOutcome === undefined) {
    return 0;
  }
  const userWinningStake = market.winningOutcome ? position.yesAmountMicro : position.noAmountMicro;
  const winningPool = market.winningOutcome ? market.yesPoolMicro : market.noPoolMicro;
  const losingPool = market.winningOutcome ? market.noPoolMicro : market.yesPoolMicro;
  if (userWinningStake <= 0 || winningPool <= 0) {
    return 0;
  }
  const userShare = Math.floor((userWinningStake * losingPool) / winningPool);
  return userWinningStake + userShare;
}

function getUserPositionRecord(state, address, contractMarketId) {
  return state.positions[address]?.[String(contractMarketId)] ?? null;
}

function upsertUser(state, address) {
  const now = new Date().toISOString();
  if (!state.users[address]) {
    state.users[address] = {
      address,
      joinedAt: now,
      updatedAt: now,
      totalInvestedMicro: 0,
      totalClaimedMicro: 0,
      totalProfitMicro: 0,
      activePredictions: 0,
      resolvedPredictions: 0,
      winCount: 0,
      lossCount: 0,
      pendingClaimCount: 0,
      totalBets: 0,
      marketIds: [],
    };
  }
  state.users[address].updatedAt = now;
  return state.users[address];
}

async function getMergedMarketByContractId(contractMarketId) {
  const state = store.getState();
  const marketId = state.marketRefsByContractId[String(contractMarketId)];
  if (!marketId) return null;
  const market = state.markets[marketId];
  if (!market) return null;

  let chain = null;
  try {
    chain = await stacks.getMarket(contractMarketId);
  } catch (error) {
    chain = null;
  }

  return {
    id: market.id,
    question: market.question,
    description: market.description,
    category: market.category,
    imageUrl: market.imageUrl,
    resolveTimeIso: market.resolveTimeIso,
    resolveBlock: market.resolveBlock,
    createdAt: market.createdAt,
    updatedAt: market.updatedAt,
    createdBy: market.createdBy,
    contractMarketId,
    contractTxId: market.contractTxId ?? null,
    resolutionTxId: market.resolutionTxId ?? null,
    marketRef: market.marketRef,
    chain: chain ?? {
      contractMarketId,
      marketRef: market.marketRef,
      creator: null,
      createdAtBlock: 0,
      resolveDateBlock: market.resolveBlock,
      yesPoolMicro: 0,
      noPoolMicro: 0,
      totalBets: 0,
      status: market.status,
      winningOutcome: market.winningOutcome ?? null,
      resolvedAtBlock: null,
    },
    status: chain?.status ?? market.status,
    winningOutcome: chain?.winningOutcome ?? market.winningOutcome ?? null,
    yesPoolMicro: chain?.yesPoolMicro ?? 0,
    noPoolMicro: chain?.noPoolMicro ?? 0,
    totalBets: chain?.totalBets ?? 0,
  };
}

async function getAllMergedMarkets() {
  const state = store.getState();
  const contractIds = Object.keys(state.marketRefsByContractId)
    .map(Number)
    .sort((a, b) => b - a);
  const markets = await Promise.all(contractIds.map(getMergedMarketByContractId));
  return markets.filter(Boolean);
}

function recomputeUser(state, address) {
  const user = upsertUser(state, address);
  const positions = Object.values(state.positions[address] ?? {});
  user.totalInvestedMicro = positions.reduce((sum, position) => sum + position.totalWageredMicro, 0);
  user.totalClaimedMicro = Object.values(state.claims)
    .filter(claim => claim.userAddress === address)
    .reduce((sum, claim) => sum + (claim.amountMicro || 0), 0);
  user.totalProfitMicro = user.totalClaimedMicro - user.totalInvestedMicro;
  user.totalBets = Object.values(state.bets).filter(bet => bet.userAddress === address && bet.status === 'confirmed').length;
  user.marketIds = positions.map(position => position.contractMarketId);

  let activePredictions = 0;
  let resolvedPredictions = 0;
  let winCount = 0;
  let lossCount = 0;
  let pendingClaimCount = 0;

  for (const position of positions) {
    const marketId = state.marketRefsByContractId[String(position.contractMarketId)];
    const market = marketId ? state.markets[marketId] : null;
    const status = market?.status ?? 'active';
    if (status === 'active') {
      activePredictions += 1;
      continue;
    }
    resolvedPredictions += 1;
    if (!position.claimed) {
      pendingClaimCount += 1;
    }
    if (status === 'resolved') {
      const didWin =
        (market.winningOutcome === true && position.yesAmountMicro > 0) ||
        (market.winningOutcome === false && position.noAmountMicro > 0);
      if (didWin) {
        winCount += 1;
      } else {
        lossCount += 1;
      }
    }
  }

  user.activePredictions = activePredictions;
  user.resolvedPredictions = resolvedPredictions;
  user.winCount = winCount;
  user.lossCount = lossCount;
  user.pendingClaimCount = pendingClaimCount;
}

function buildLeaderboard(state, limit) {
  return Object.values(state.users)
    .map(user => {
      const completedMarkets = user.winCount + user.lossCount;
      const winRate = completedMarkets > 0 ? (user.winCount / completedMarkets) * 100 : 0;
      return {
        address: user.address,
        totalProfit: Number((user.totalProfitMicro / 1_000_000).toFixed(6)),
        winRate: Number(winRate.toFixed(1)),
        totalBets: user.totalBets,
      };
    })
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

async function handleCreateMarket(req, res) {
  const state = store.getState();
  const body = await readBody(req);
  const question = String(body.question || '').trim();
  const description = String(body.description || '').trim();
  const category = String(body.category || 'General').trim();
  const imageUrl = String(body.imageUrl || '').trim();
  const resolveTimeIso = String(body.resolveDate || '').trim();
  const resolveBlock = Number(body.resolveBlock || 0);
  const createdBy = sanitizeAddress(body.createdBy || stacks.signerAddress);

  if (!question || !resolveTimeIso || !Number.isFinite(resolveBlock) || resolveBlock <= 0) {
    return sendJson(res, 400, { error: 'question, resolveDate and resolveBlock are required' });
  }

  const marketRef = makeMarketRef();
  const contractMarketId = await stacks.getNextMarketId();
  const txId = await stacks.createMarket(marketRef, resolveBlock);
  const now = new Date().toISOString();

  state.markets[marketRef] = {
    id: marketRef,
    marketRef,
    question,
    description,
    category,
    imageUrl,
    resolveTimeIso,
    resolveBlock,
    createdAt: now,
    updatedAt: now,
    createdBy,
    contractMarketId,
    contractTxId: txId,
    resolutionTxId: null,
    winningOutcome: null,
    status: 'active',
  };
  state.marketRefsByContractId[String(contractMarketId)] = marketRef;
  await store.save();

  return sendJson(res, 201, { market: await getMergedMarketByContractId(contractMarketId) });
}

async function handleResolveMarket(req, res, marketId) {
  const state = store.getState();
  const market = state.markets[marketId];
  if (!market) {
    return sendJson(res, 404, { error: 'Market not found' });
  }

  const body = await readBody(req);
  const winningOutcome = Boolean(body.winningOutcome);
  const txId = await stacks.resolveMarket(market.contractMarketId, winningOutcome);

  market.status = 'resolved';
  market.winningOutcome = winningOutcome;
  market.resolutionTxId = txId;
  market.updatedAt = new Date().toISOString();

  for (const address of Object.keys(state.positions)) {
    recomputeUser(state, address);
  }

  await store.save();
  return sendJson(res, 200, { market: await getMergedMarketByContractId(market.contractMarketId) });
}

async function handleCreateBetIntent(req, res) {
  const state = store.getState();
  const body = await readBody(req);
  const userAddress = sanitizeAddress(body.userAddress);
  const contractMarketId = Number(body.contractMarketId || 0);
  const amountMicro = Number(body.amountMicro || 0);
  const outcome = Boolean(body.outcome);

  if (!userAddress || !contractMarketId || !amountMicro) {
    return sendJson(res, 400, { error: 'userAddress, contractMarketId, amountMicro and outcome are required' });
  }

  const market = await getMergedMarketByContractId(contractMarketId);
  if (!market) {
    return sendJson(res, 404, { error: 'Market not found' });
  }

  const postYesPoolMicro = outcome ? market.yesPoolMicro + amountMicro : market.yesPoolMicro;
  const postNoPoolMicro = outcome ? market.noPoolMicro : market.noPoolMicro + amountMicro;
  const postTotalPoolMicro = postYesPoolMicro + postNoPoolMicro;
  const selectedPostPoolMicro = outcome ? postYesPoolMicro : postNoPoolMicro;
  const selectedPostPriceBps = postTotalPoolMicro > 0
    ? Math.floor((selectedPostPoolMicro * 10_000) / postTotalPoolMicro)
    : 5_000;
  const maxAcceptedPriceBps = Math.min(10_000, selectedPostPriceBps + 300);

  const betId = randomUUID();
  state.bets[betId] = {
    id: betId,
    userAddress,
    marketId: market.id,
    contractMarketId,
    amountMicro,
    feeMicro: PLATFORM_FEE_MICRO,
    outcome,
    status: 'intent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    txId: null,
  };
  upsertUser(state, userAddress);
  await store.save();

  return sendJson(res, 201, {
    betId,
    contractCall: {
      contractAddress: stacks.contractAddress,
      contractName: stacks.contractName,
      functionName: 'place-bet-with-slippage',
      args: {
        marketId: contractMarketId,
        outcome,
        amountMicro,
        maxAcceptedPriceBps,
      },
      postConditionAmountMicro: amountMicro + PLATFORM_FEE_MICRO,
    },
  });
}

async function handleConfirmBet(req, res) {
  const state = store.getState();
  const body = await readBody(req);
  const bet = state.bets[String(body.betId)];
  if (!bet) {
    return sendJson(res, 404, { error: 'Bet intent not found' });
  }

  bet.status = 'confirmed';
  bet.txId = String(body.txId || '');
  bet.updatedAt = new Date().toISOString();

  const address = bet.userAddress;
  const contractMarketId = String(bet.contractMarketId);
  state.positions[address] ||= {};
  state.positions[address][contractMarketId] ||= {
    userAddress: address,
    marketId: bet.marketId,
    contractMarketId: bet.contractMarketId,
    yesAmountMicro: 0,
    noAmountMicro: 0,
    totalWageredMicro: 0,
    claimableAmountMicro: 0,
    claimed: false,
    lastBetAt: null,
  };

  const position = state.positions[address][contractMarketId];
  if (bet.outcome) {
    position.yesAmountMicro += bet.amountMicro;
  } else {
    position.noAmountMicro += bet.amountMicro;
  }
  position.totalWageredMicro += bet.amountMicro;
  position.claimed = false;
  position.lastBetAt = new Date().toISOString();

  recomputeUser(state, address);
  await store.save();
  return sendJson(res, 200, { success: true, position });
}

async function handleConfirmClaim(req, res) {
  const state = store.getState();
  const body = await readBody(req);
  const userAddress = sanitizeAddress(body.userAddress);
  const contractMarketId = Number(body.contractMarketId || 0);
  const type = String(body.type || 'winnings');
  const txId = String(body.txId || '');
  const position = getUserPositionRecord(state, userAddress, contractMarketId);

  if (!position) {
    return sendJson(res, 404, { error: 'Position not found' });
  }

  const market = await getMergedMarketByContractId(contractMarketId);
  if (!market) {
    return sendJson(res, 404, { error: 'Market not found' });
  }

  const claimId = randomUUID();
  const amountMicro = computeClaimAmount(position, {
    status: type === 'refund' ? 'cancelled' : market.status,
    winningOutcome: market.winningOutcome,
    yesPoolMicro: market.yesPoolMicro,
    noPoolMicro: market.noPoolMicro,
  });

  state.claims[claimId] = {
    id: claimId,
    userAddress,
    contractMarketId,
    marketId: position.marketId,
    type,
    txId,
    amountMicro,
    createdAt: new Date().toISOString(),
  };
  position.claimed = true;
  position.claimableAmountMicro = amountMicro;
  recomputeUser(state, userAddress);
  await store.save();

  return sendJson(res, 200, { success: true, amountMicro });
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      return sendJson(res, 200, { ok: true });
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const { pathname, searchParams } = url;

    if (req.method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, {
        ok: true,
        network: NETWORK,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        signerAddress: stacks.signerAddress,
      });
    }

    if (req.method === 'GET' && pathname === '/api/config') {
      return sendJson(res, 200, {
        network: NETWORK,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        platformFeeMicro: PLATFORM_FEE_MICRO,
      });
    }

    if (req.method === 'GET' && pathname === '/api/swagger.json') {
      return sendJson(res, 200, specs);
    }

    if (req.method === 'GET' && pathname.startsWith('/swagger-ui/')) {
      const file = pathname.replace('/swagger-ui/', '');
      const swaggerUiPath = path.join(process.cwd(), 'node_modules', 'swagger-ui-dist', file);
      try {
        const content = await readFile(swaggerUiPath);
        const mimeTypes = {
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.png': 'image/png',
          '.svg': 'image/svg+xml',
          '.html': 'text/html',
        };
        const ext = path.extname(file);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        return;
      } catch (error) {
        return sendJson(res, 404, { error: 'Not found' });
      }
    }

    if (req.method === 'GET' && pathname === '/api-docs') {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PredictStack API Documentation</title>
      <link rel="stylesheet" type="text/css" href="/swagger-ui/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/swagger-ui/swagger-ui-bundle.js"></script>
  <script src="/swagger-ui/swagger-ui-standalone-preset.js"></script>
  <script>
    const ui = SwaggerUIBundle({
      url: "/api/swagger.json",
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset
      ],
      layout: "StandaloneLayout"
    });
  </script>
</body>
</html>
      `;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/platform/stats') {
      const [onChain, markets] = await Promise.all([stacks.getPlatformStats(), getAllMergedMarkets()]);
      return sendJson(res, 200, {
        totalMarkets: onChain.totalMarkets,
        totalVolumeMicro: onChain.totalVolume,
        totalFeesCollectedMicro: onChain.totalFeesCollected,
        totalUsers: Object.keys(store.getState().users).length,
        activeMarkets: markets.filter(market => market.status === 'active').length,
      });
    }

    if (req.method === 'GET' && pathname === '/api/markets') {
      const limit = Number(searchParams.get('limit') || 50);
      const status = searchParams.get('status');
      let markets = await getAllMergedMarkets();
      if (status) {
        markets = markets.filter(market => market.status === status);
      }
      return sendJson(res, 200, { markets: markets.slice(0, limit) });
    }

    if (req.method === 'GET' && pathname.startsWith('/api/markets/contract/')) {
      const contractMarketId = Number(pathname.split('/').pop());
      const market = await getMergedMarketByContractId(contractMarketId);
      if (!market) {
        return sendJson(res, 404, { error: 'Market not found' });
      }
      return sendJson(res, 200, { market });
    }

    if (req.method === 'GET' && pathname.startsWith('/api/markets/')) {
      const marketId = pathname.split('/').pop();
      const market = store.getState().markets[marketId];
      if (!market) {
        return sendJson(res, 404, { error: 'Market not found' });
      }
      return sendJson(res, 200, { market: await getMergedMarketByContractId(market.contractMarketId) });
    }

    if (req.method === 'POST' && pathname === '/api/markets') {
      return await handleCreateMarket(req, res);
    }

    if (req.method === 'POST' && pathname.endsWith('/resolve')) {
      const marketId = pathname.split('/').at(-2);
      return await handleResolveMarket(req, res, marketId);
    }

    if (req.method === 'POST' && pathname === '/api/bets/intents') {
      return await handleCreateBetIntent(req, res);
    }

    if (req.method === 'POST' && pathname === '/api/bets/confirm') {
      return await handleConfirmBet(req, res);
    }

    if (req.method === 'POST' && pathname === '/api/claims/confirm') {
      return await handleConfirmClaim(req, res);
    }

    if (req.method === 'GET' && /^\/api\/users\/[^/]+\/markets$/.test(pathname)) {
      const address = sanitizeAddress(pathname.split('/')[3]);
      const positions = Object.values(store.getState().positions[address] ?? {});
      return sendJson(res, 200, { marketIds: positions.map(position => position.contractMarketId) });
    }

    if (req.method === 'GET' && /^\/api\/users\/[^/]+\/positions\/\d+$/.test(pathname)) {
      const segments = pathname.split('/');
      const address = sanitizeAddress(segments[3]);
      const contractMarketId = Number(segments[5]);
      const position = getUserPositionRecord(store.getState(), address, contractMarketId);
      if (!position) {
        return sendJson(res, 404, { error: 'Position not found' });
      }
      return sendJson(res, 200, { position });
    }

    if (req.method === 'GET' && /^\/api\/users\/[^/]+\/dashboard$/.test(pathname)) {
      const address = sanitizeAddress(pathname.split('/')[3]);
      const state = store.getState();
      upsertUser(state, address);
      recomputeUser(state, address);
      await store.save();
      const summary = state.users[address];
      const positions = Object.values(state.positions[address] ?? {});
      const markets = await Promise.all(
        positions.map(async position => ({
          market: await getMergedMarketByContractId(position.contractMarketId),
          position,
        }))
      );
      return sendJson(res, 200, {
        summary,
        positions: markets.filter(item => item.market),
      });
    }

    if (req.method === 'GET' && pathname === '/api/leaderboard') {
      const limit = Number(searchParams.get('limit') || 50);
      return sendJson(res, 200, { leaderboard: buildLeaderboard(store.getState(), limit) });
    }

    return sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    return sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unknown server error',
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`PredictStack backend listening on http://${HOST}:${PORT}`);
});
