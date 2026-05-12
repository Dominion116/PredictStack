import { sendJson, sanitizeAddress } from './middleware/http.mjs';
import { getAllMergedMarkets } from './services/market-service.mjs';
import { buildLeaderboard } from './services/user-service.mjs';
import { createHealthRoutes } from './routes/health.mjs';
import { createMarketRoutes } from './routes/markets.mjs';
import { createBetRoutes } from './routes/bets.mjs';
import { createClaimRoutes } from './routes/claims.mjs';
import { createUserRoutes } from './routes/users.mjs';
import { createUploadRoutes } from './routes/upload.mjs';
import { createDocsRoutes } from './routes/docs.mjs';

export function createRouter({ store, stacks, config, specs }) {
  const getAllMerged = () => getAllMergedMarkets(store, stacks);

  const health = createHealthRoutes({ store, stacks, getAllMergedMarkets: getAllMerged, config });
  const markets = createMarketRoutes({ store, stacks });
  const bets = createBetRoutes({ store, stacks, config });
  const claims = createClaimRoutes({ store, stacks });
  const users = createUserRoutes({ store, stacks });
  const upload = createUploadRoutes({ config });
  const docs = createDocsRoutes({ specs });

  return async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const { pathname, searchParams } = url;
    const method = req.method;

    if (method === 'OPTIONS') return sendJson(res, 200, { ok: true });

    // Health & config
    if (method === 'GET' && pathname === '/api/health') return health.status(req, res);
    if (method === 'GET' && pathname === '/api/config') return health.config(req, res);
    if (method === 'GET' && pathname === '/api/platform/stats') return health.platformStats(req, res);

    // Docs
    if (method === 'GET' && pathname === '/api/swagger.json') return docs.swaggerJson(req, res);
    if (method === 'GET' && pathname.startsWith('/swagger-ui/')) return docs.swaggerUiAsset(req, res, pathname);
    if (method === 'GET' && pathname === '/api-docs') return docs.apiDocs(req, res);

    // Markets — order matters: /contract/ must match before /:id
    if (method === 'GET' && pathname === '/api/markets') return markets.list(req, res, searchParams);
    if (method === 'POST' && pathname === '/api/markets') return markets.create(req, res);
    if (method === 'GET' && pathname.startsWith('/api/markets/contract/')) {
      return markets.getByContractId(req, res, Number(pathname.split('/').pop()));
    }
    if (method === 'POST' && pathname.endsWith('/resolve')) {
      return markets.resolve(req, res, pathname.split('/').at(-2));
    }
    if (method === 'GET' && pathname.startsWith('/api/markets/')) {
      return markets.getById(req, res, pathname.split('/').pop());
    }

    // Bets
    if (method === 'POST' && pathname === '/api/bets/intents') return bets.createIntent(req, res);
    if (method === 'POST' && pathname === '/api/bets/confirm') return bets.confirm(req, res);

    // Claims
    if (method === 'POST' && pathname === '/api/claims/confirm') return claims.confirm(req, res);

    // Upload
    if (method === 'POST' && pathname === '/api/upload') return upload.upload(req, res);

    // Users
    if (method === 'GET' && /^\/api\/users\/[^/]+\/markets$/.test(pathname)) {
      return users.markets(req, res, sanitizeAddress(pathname.split('/')[3]));
    }
    if (method === 'GET' && /^\/api\/users\/[^/]+\/positions\/\d+$/.test(pathname)) {
      const segments = pathname.split('/');
      return users.position(req, res, sanitizeAddress(segments[3]), Number(segments[5]));
    }
    if (method === 'GET' && /^\/api\/users\/[^/]+\/dashboard$/.test(pathname)) {
      return users.dashboard(req, res, sanitizeAddress(pathname.split('/')[3]));
    }

    // Leaderboard
    if (method === 'GET' && pathname === '/api/leaderboard') {
      const limit = Number(searchParams.get('limit') || 50);
      return sendJson(res, 200, { leaderboard: buildLeaderboard(store.getState(), limit) });
    }

    return sendJson(res, 404, { error: 'Not found' });
  };
}
