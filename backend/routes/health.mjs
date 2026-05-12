import { sendJson } from '../middleware/http.mjs';

export function createHealthRoutes({ store, stacks, getAllMergedMarkets, config }) {
  return {
    async status(req, res) {
      return sendJson(res, 200, {
        ok: true,
        network: config.NETWORK,
        contractAddress: config.CONTRACT_ADDRESS,
        contractName: config.CONTRACT_NAME,
        signerAddress: stacks.signerAddress,
      });
    },

    config(req, res) {
      return sendJson(res, 200, {
        network: config.NETWORK,
        contractAddress: config.CONTRACT_ADDRESS,
        contractName: config.CONTRACT_NAME,
        platformFeeMicro: config.PLATFORM_FEE_MICRO,
      });
    },

    async platformStats(req, res) {
      const [onChain, markets] = await Promise.all([
        stacks.getPlatformStats(),
        getAllMergedMarkets(),
      ]);
      return sendJson(res, 200, {
        totalMarkets: onChain.totalMarkets,
        totalVolumeMicro: onChain.totalVolume,
        totalFeesCollectedMicro: onChain.totalFeesCollected,
        totalUsers: Object.keys(store.getState().users).length,
        activeMarkets: markets.filter(m => m.status === 'active').length,
      });
    },
  };
}
