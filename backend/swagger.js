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
            id: { type: 'string' },
            question: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            imageUrl: { type: 'string' },
            status: { type: 'string', enum: ['active', 'resolved', 'cancelled'] },
            winningOutcome: { type: 'boolean' },
            yesPoolMicro: { type: 'number' },
            noPoolMicro: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            resolveTimeIso: { type: 'string', format: 'date-time' },
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
            claimed: { type: 'boolean' },
          },
        },
        Bet: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userAddress: { type: 'string' },
            marketId: { type: 'string' },
            amountMicro: { type: 'number' },
            outcome: { type: 'boolean' },
            status: { type: 'string', enum: ['intent', 'confirmed'] },
            createdAt: { type: 'string', format: 'date-time' },
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
            winCount: { type: 'number' },
            lossCount: { type: 'number' },
            positions: { type: 'array', items: { $ref: '#/components/schemas/UserPosition' } },
          },
        },
      },
    },
  },
  apis: ['./backend/server.mjs'],
};

export const specs = swaggerJsdoc(options);
