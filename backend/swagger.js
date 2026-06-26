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
      {
        url: 'https://predictstack.onrender.com',
        description: 'Production server',
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
        ActivityEvent: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            type: { type: 'string', enum: ['bet_placed', 'market_created', 'market_resolved', 'claim_made'] },
            actorAddress: { type: 'string' },
            marketId: { type: 'number', nullable: true },
            marketQuestion: { type: 'string' },
            meta: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            marketId: { type: 'number' },
            authorAddress: { type: 'string' },
            body: { type: 'string' },
            parentId: { type: 'string', nullable: true },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            recipientAddress: { type: 'string' },
            type: { type: 'string', enum: ['bet_confirmed', 'market_resolved', 'claim_available'] },
            title: { type: 'string' },
            body: { type: 'string' },
            marketId: { type: 'number', nullable: true },
            read: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ReferralStats: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            referredCount: { type: 'number' },
            totalRewardsMicro: { type: 'number' },
          },
        },
        PriceSnapshot: {
          type: 'object',
          properties: {
            marketId: { type: 'number' },
            yes: { type: 'number', description: 'YES odds in basis points (0-10000)' },
            no: { type: 'number', description: 'NO odds in basis points (0-10000)' },
            timestamp: { type: 'number', description: 'Unix epoch ms' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            count: { type: 'number' },
          },
        },
      },
    },
  },
  apis: ['./backend/server.mjs', './backend/routes/*.mjs'],
};

export const specs = swaggerJsdoc(options);
