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
import { createFeedRoutes } from './routes/feed.mjs';
import { createCommentRoutes } from './routes/comments.mjs';
import { createAnalyticsRoutes } from './routes/analytics.mjs';
import { createCategoryRoutes } from './routes/categories.mjs';
import { createSearchRoutes } from './routes/search.mjs';
import { createNotificationRoutes } from './routes/notifications.mjs';
import { createReferralRoutes } from './routes/referrals.mjs';
import { createAdminRoutes } from './routes/admin.mjs';

export function createRouter({ store, stacks, config, specs }) {
  const getAllMerged = () => getAllMergedMarkets(store, stacks);

  const health = createHealthRoutes({ store, stacks, getAllMergedMarkets: getAllMerged, config });
  const markets = createMarketRoutes({ store, stacks });
  const bets = createBetRoutes({ store, stacks, config });
  const claims = createClaimRoutes({ store, stacks });
  const users = createUserRoutes({ store, stacks });
  const upload = createUploadRoutes({ config });
  const docs = createDocsRoutes({ specs });
  const feed = createFeedRoutes();
  const comments = createCommentRoutes({ config });
  const analytics = createAnalyticsRoutes({ store });
  const categories = createCategoryRoutes({ store });
  const search = createSearchRoutes({ store });
  const notifications = createNotificationRoutes();
  const referrals = createReferralRoutes();
  const adminRoutes = createAdminRoutes({ store, stacks });

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
    if (method === 'GET' && pathname === '/api/markets/next-id') return markets.nextId(req, res);
    if (method === 'POST' && pathname === '/api/markets') return markets.create(req, res);
    if (method === 'GET' && pathname.startsWith('/api/markets/contract/')) {
      return markets.getByContractId(req, res, Number(pathname.split('/').pop()));
    }
    if (method === 'GET' && pathname.startsWith('/api/markets/ref/')) {
      return markets.getByRef(req, res, pathname.replace('/api/markets/ref/', ''));
    }
    if (method === 'GET' && /^\/api\/markets\/[^/]+\/odds$/.test(pathname)) {
      return markets.getOdds(req, res, pathname.split('/')[3]);
    }
    if (method === 'GET' && /^\/api\/markets\/[^/]+\/quotes$/.test(pathname)) {
      return markets.getQuotes(req, res, pathname.split('/')[3]);
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
    if (method === 'GET' && /^\/api\/users\/[^/]+\/analytics$/.test(pathname)) {
      return analytics.userAnalytics(req, res, pathname.split('/')[3]);
    }

    // Admin
    if (method === 'GET' && pathname === '/api/admin/stats') return adminRoutes.stats(req, res);
    if (method === 'GET' && pathname === '/api/admin/audit-log') return adminRoutes.auditLog(req, res, searchParams);
    if (method === 'POST' && pathname === '/api/admin/markets/bulk-resolve') return adminRoutes.bulkResolve(req, res);

    // Referrals
    if (method === 'POST' && pathname === '/api/referrals/generate') return referrals.generate(req, res);
    const referralStats = pathname.match(/^\/api\/referrals\/([^/]+)\/stats$/);
    if (method === 'GET' && referralStats) return referrals.stats(req, res, referralStats[1]);

    // Notifications
    const notifBase = pathname.match(/^\/api\/notifications\/([^/]+)$/);
    if (method === 'GET' && notifBase) return notifications.list(req, res, notifBase[1], searchParams);
    if (method === 'POST' && notifBase) return notifications.markAll(req, res, notifBase[1]);
    const notifRead = pathname.match(/^\/api\/notifications\/([^/]+)\/read\/([^/]+)$/);
    if (method === 'POST' && notifRead) return notifications.markOne(req, res, notifRead[1], notifRead[2]);

    // Leaderboard
    if (method === 'GET' && pathname === '/api/leaderboard') {
      const limit = Number(searchParams.get('limit') || 50);
      return sendJson(res, 200, { leaderboard: buildLeaderboard(store.getState(), limit) });
    }

    // Categories
    if (method === 'GET' && pathname === '/api/categories') return categories.list(req, res);

    // Search — must come before /api/markets/:id to avoid capturing 'search' as an id
    if (method === 'GET' && pathname === '/api/markets/search') return search.search(req, res, searchParams);
    if (method === 'GET' && pathname === '/api/markets/suggest') return search.suggest(req, res, searchParams);

    // Activity feed
    if (method === 'GET' && pathname === '/api/feed') return feed.list(req, res, searchParams);

    // Comments — /api/markets/:id/comments and /api/markets/:id/comments/:commentId
    const commentDeleteMatch = pathname.match(/^\/api\/markets\/([^/]+)\/comments\/([^/]+)$/);
    if (method === 'DELETE' && commentDeleteMatch) {
      return comments.remove(req, res, commentDeleteMatch[1], commentDeleteMatch[2]);
    }
    const commentListMatch = pathname.match(/^\/api\/markets\/([^/]+)\/comments$/);
    if (method === 'GET' && commentListMatch) {
      return comments.list(req, res, commentListMatch[1], searchParams);
    }
    if (method === 'POST' && commentListMatch) {
      return comments.create(req, res, commentListMatch[1]);
    }

    return sendJson(res, 404, { error: 'Not found' });
  };
}
