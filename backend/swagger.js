import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PredictStack Backend API',
      version: '1.0.0',
      description: 'Backend API for PredictStack prediction markets on Stacks blockchain',
      contact: {
        name: 'PredictStack Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Market: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique market reference' },
            question: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            imageUrl: { type: 'string' },
            status: { type: 'string', enum: ['active', 'resolved', 'cancelled'] },
            winningOutcome: { type: 'boolean', nullable: true },
            contractMarketId: { type: 'number' },
            yesPoolMicro: { type: 'number' },
            noPoolMicro: { type: 'number' },
            totalBets: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            resolveTimeIso: { type: 'string', format: 'date-time' },
            resolveBlock: { type: 'number' },
            createdBy: { type: 'string' },
          },
        },
        UserPosition: {
          type: 'object',
          properties: {
            userAddress: { type: 'string' },
            marketId: { type: 'string' },
            contractMarketId: { type: 'number' },
            yesAmountMicro: { type: 'number' },
            noAmountMicro: { type: 'number' },
            totalWageredMicro: { type: 'number' },
            claimableAmountMicro: { type: 'number' },
            claimed: { type: 'boolean' },
            lastBetAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Bet: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userAddress: { type: 'string' },
            marketId: { type: 'string' },
            amountMicro: { type: 'number' },
            feeMicro: { type: 'number' },
            outcome: { type: 'boolean' },
            status: { type: 'string', enum: ['intent', 'confirmed'] },
            createdAt: { type: 'string', format: 'date-time' },
            txId: { type: 'string', nullable: true },
          },
        },
        UserDashboard: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            totalInvestedMicro: { type: 'number' },
            totalClaimedMicro: { type: 'number' },
            totalProfitMicro: { type: 'number' },
            activePredictions: { type: 'number' },
            resolvedPredictions: { type: 'number' },
            winCount: { type: 'number' },
            lossCount: { type: 'number' },
            pendingClaimCount: { type: 'number' },
            totalBets: { type: 'number' },
          },
        },
      },
    },
  },
  apis: ['./backend/server.mjs'],
};

export const specs = swaggerJsdoc(options);
