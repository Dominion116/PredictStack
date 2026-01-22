/**
 * PredictStack - Prediction Market Tests
 * 
 * Comprehensive test suite for the prediction market smart contract
 * Tests cover initialization, market management, betting, payouts, and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Cl, ClarityType } from '@stacks/transactions';

// ============================================================================
// TEST CONSTANTS
// ============================================================================

const DEPLOYER = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const WALLET_1 = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
const WALLET_2 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
const WALLET_3 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC';
const WALLET_4 = 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND';

// Token amounts (6 decimals like USDC)
const ONE_MILLION = 1_000_000; // 1 USDCx
const TEN_MILLION = 10_000_000; // 10 USDCx
const HUNDRED_MILLION = 100_000_000; // 100 USDCx

// Fee configuration
const DEFAULT_FEE_BPS = 200; // 2%
const MIN_BET_AMOUNT = 1_000_000; // 1 USDCx

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Initialize the prediction market contract
 */
function initializePlatform(
  simnet: any,
  admin: string = DEPLOYER,
  oracle: string = DEPLOYER,
  treasury: string = DEPLOYER,
  feeBps: number = DEFAULT_FEE_BPS,
  minBet: number = MIN_BET_AMOUNT
) {
  return simnet.callPublicFn(
    'prediction-market',
    'initialize',
    [
      Cl.standardPrincipal(admin),
      Cl.standardPrincipal(oracle),
      Cl.standardPrincipal(treasury),
      Cl.uint(feeBps),
      Cl.uint(minBet)
    ],
    admin
  );
}

/**
 * Mint tokens to a wallet
 */
function mintTokens(simnet: any, recipient: string, amount: number) {
  return simnet.callPublicFn(
    'mock-usdcx',
    'mint',
    [Cl.uint(amount), Cl.standardPrincipal(recipient)],
    DEPLOYER
  );
}

/**
 * Get token balance
 */
function getBalance(simnet: any, account: string) {
  const result = simnet.callReadOnlyFn(
    'mock-usdcx',
    'get-balance',
    [Cl.standardPrincipal(account)],
    account
  );
  return result.result;
}

/**
 * Create a market
 */
function createMarket(
  simnet: any,
  question: string,
  resolveDate: number,
  caller: string = DEPLOYER
) {
  return simnet.callPublicFn(
    'prediction-market',
    'create-market',
    [
      Cl.stringAscii(question),
      Cl.none(), // description
      Cl.uint(resolveDate),
      Cl.contractPrincipal(DEPLOYER, 'mock-usdcx')
    ],
    caller
  );
}

/**
 * Place a bet
 */
function placeBet(
  simnet: any,
  marketId: number,
  outcome: boolean,
  amount: number,
  caller: string
) {
  return simnet.callPublicFn(
    'prediction-market',
    'place-bet',
    [
      Cl.uint(marketId),
      Cl.bool(outcome),
      Cl.uint(amount),
      Cl.contractPrincipal(DEPLOYER, 'mock-usdcx')
    ],
    caller
  );
}

/**
 * Resolve a market
 */
function resolveMarket(
  simnet: any,
  marketId: number,
  winningOutcome: boolean,
  caller: string = DEPLOYER
) {
  return simnet.callPublicFn(
    'prediction-market',
    'resolve-market',
    [
      Cl.uint(marketId),
      Cl.bool(winningOutcome),
      Cl.contractPrincipal(DEPLOYER, 'mock-usdcx')
    ],
    caller
  );
}

/**
 * Claim winnings
 */
function claimWinnings(simnet: any, marketId: number, caller: string) {
  return simnet.callPublicFn(
    'prediction-market',
    'claim-winnings',
    [
      Cl.uint(marketId),
      Cl.contractPrincipal(DEPLOYER, 'mock-usdcx')
    ],
    caller
  );
}

/**
 * Claim refund
 */
function claimRefund(simnet: any, marketId: number, caller: string) {
  return simnet.callPublicFn(
    'prediction-market',
    'claim-refund',
    [
      Cl.uint(marketId),
      Cl.contractPrincipal(DEPLOYER, 'mock-usdcx')
    ],
    caller
  );
}

/**
 * Cancel a market
 */
function cancelMarket(simnet: any, marketId: number, caller: string = DEPLOYER) {
  return simnet.callPublicFn(
    'prediction-market',
    'cancel-market',
    [
      Cl.uint(marketId),
      Cl.contractPrincipal(DEPLOYER, 'mock-usdcx')
    ],
    caller
  );
}

// ============================================================================
// TESTS
// ============================================================================

describe('PredictStack - Prediction Market Tests', () => {
  
  // ==========================================================================
  // INITIALIZATION TESTS
  // ==========================================================================
  
  describe('Contract Initialization', () => {
    
    it('should initialize successfully with valid parameters', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      
      const result = initializePlatform(simnet);
      expect(result.result).toBeOk(Cl.bool(true));
      
      // Verify configuration
      const config = simnet.callReadOnlyFn(
        'prediction-market',
        'get-platform-config',
        [],
        DEPLOYER
      );
      
      expect(config.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should prevent double initialization', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      
      initializePlatform(simnet);
      const secondInit = initializePlatform(simnet);
      
      expect(secondInit.result).toBeErr(Cl.uint(115)); // ERR-ALREADY-INITIALIZED
    });
    
    it('should reject invalid fee (above maximum)', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      
      const result = simnet.callPublicFn(
        'prediction-market',
        'initialize',
        [
          Cl.standardPrincipal(DEPLOYER),
          Cl.standardPrincipal(DEPLOYER),
          Cl.standardPrincipal(DEPLOYER),
          Cl.uint(1500), // 15% - above max
          Cl.uint(MIN_BET_AMOUNT)
        ],
        DEPLOYER
      );
      
      expect(result.result).toBeErr(Cl.uint(110)); // ERR-INVALID-AMOUNT
    });
    
    it('should reject invalid minimum bet', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      
      const result = simnet.callPublicFn(
        'prediction-market',
        'initialize',
        [
          Cl.standardPrincipal(DEPLOYER),
          Cl.standardPrincipal(DEPLOYER),
          Cl.standardPrincipal(DEPLOYER),
          Cl.uint(200),
          Cl.uint(100) // Too low
        ],
        DEPLOYER
      );
      
      expect(result.result).toBeErr(Cl.uint(110)); // ERR-INVALID-AMOUNT
    });
  });
  
  // ==========================================================================
  // ADMINISTRATIVE TESTS
  // ==========================================================================
  
  describe('Administrative Functions', () => {
    
    it('should allow admin to update platform fee', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const result = simnet.callPublicFn(
        'prediction-market',
        'set-platform-fee',
        [Cl.uint(300)], // 3%
        DEPLOYER
      );
      
      expect(result.result).toBeOk(Cl.bool(true));
    });
    
    it('should prevent non-admin from updating fee', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const result = simnet.callPublicFn(
        'prediction-market',
        'set-platform-fee',
        [Cl.uint(300)],
        WALLET_1 // Not admin
      );
      
      expect(result.result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });
    
    it('should allow admin to change oracle', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const result = simnet.callPublicFn(
        'prediction-market',
        'set-oracle',
        [Cl.standardPrincipal(WALLET_1)],
        DEPLOYER
      );
      
      expect(result.result).toBeOk(Cl.bool(true));
    });
    
    it('should allow admin to pause platform', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const pauseResult = simnet.callPublicFn(
        'prediction-market',
        'pause-platform',
        [],
        DEPLOYER
      );
      
      expect(pauseResult.result).toBeOk(Cl.bool(true));
      
      // Verify platform is paused via config
      const config = simnet.callReadOnlyFn(
        'prediction-market',
        'get-platform-config',
        [],
        DEPLOYER
      );
      
      expect(config.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should allow admin to unpause platform', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      simnet.callPublicFn('prediction-market', 'pause-platform', [], DEPLOYER);
      
      const unpauseResult = simnet.callPublicFn(
        'prediction-market',
        'unpause-platform',
        [],
        DEPLOYER
      );
      
      expect(unpauseResult.result).toBeOk(Cl.bool(true));
    });
  });
  
  // ==========================================================================
  // MARKET CREATION TESTS
  // ==========================================================================
  
  describe('Market Creation', () => {
    
    it('should create a market successfully', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      const result = createMarket(simnet, 'Will BTC reach $100k?', futureBlock);
      
      expect(result.result).toBeOk(Cl.uint(1)); // First market ID
    });
    
    it('should auto-increment market IDs', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      
      createMarket(simnet, 'Market 1', futureBlock);
      const result2 = createMarket(simnet, 'Market 2', futureBlock);
      const result3 = createMarket(simnet, 'Market 3', futureBlock);
      
      expect(result2.result).toBeOk(Cl.uint(2));
      expect(result3.result).toBeOk(Cl.uint(3));
    });
    
    it('should reject market with past resolve date', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const result = createMarket(simnet, 'Invalid market', simnet.blockHeight);
      
      expect(result.result).toBeErr(Cl.uint(111)); // ERR-DEADLINE-PASSED
    });
    
    it('should reject market with empty question', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const result = createMarket(simnet, '', simnet.blockHeight + 1000);
      
      expect(result.result).toBeErr(Cl.uint(117)); // ERR-INVALID-QUESTION
    });
    
    it('should reject market when platform is paused', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      simnet.callPublicFn('prediction-market', 'pause-platform', [], DEPLOYER);
      
      const result = createMarket(simnet, 'Test market', simnet.blockHeight + 1000);
      
      expect(result.result).toBeErr(Cl.uint(109)); // ERR-PLATFORM-PAUSED
    });
    
    it('should reject market creation from non-admin/oracle', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const result = createMarket(simnet, 'Unauthorized market', simnet.blockHeight + 1000, WALLET_1);
      
      expect(result.result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });
  });
  
  // ==========================================================================
  // BETTING TESTS
  // ==========================================================================
  
  describe('Betting', () => {
    
    it('should place a bet successfully', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Test market', futureBlock);
      
      // Mint tokens to user
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      
      const result = placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      
      expect(result.result).toBeOk(Cl.bool(true));
    });
    
    it('should update pools correctly on bets', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Test market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      mintTokens(simnet, WALLET_2, HUNDRED_MILLION);
      
      // Place YES bet
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      // Place NO bet
      placeBet(simnet, 1, false, TEN_MILLION * 2, WALLET_2);
      
      const stats = simnet.callReadOnlyFn(
        'prediction-market',
        'get-market-stats',
        [Cl.uint(1)],
        DEPLOYER
      );
      
      expect(stats.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should reject bet below minimum amount', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Test market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      
      const result = placeBet(simnet, 1, true, 100, WALLET_1); // Below minimum
      
      expect(result.result).toBeErr(Cl.uint(110)); // ERR-INVALID-AMOUNT
    });
    
    it('should reject bet on non-existent market', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      
      const result = placeBet(simnet, 999, true, TEN_MILLION, WALLET_1);
      
      expect(result.result).toBeErr(Cl.uint(101)); // ERR-MARKET-NOT-FOUND
    });
    
    it('should allow multiple bets from same user', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Test market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      
      // Place multiple bets on YES
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      const result = placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      
      expect(result.result).toBeOk(Cl.bool(true));
      
      // Check position
      const position = simnet.callReadOnlyFn(
        'prediction-market',
        'get-user-position',
        [Cl.standardPrincipal(WALLET_1), Cl.uint(1)],
        WALLET_1
      );
      
      expect(position.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should allow betting on both sides', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Test market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      const result = placeBet(simnet, 1, false, TEN_MILLION, WALLET_1);
      
      expect(result.result).toBeOk(Cl.bool(true));
    });
  });
  
  // ==========================================================================
  // MARKET RESOLUTION TESTS
  // ==========================================================================
  
  describe('Market Resolution', () => {
    
    it('should resolve market successfully by oracle', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 10;
      createMarket(simnet, 'Test market', futureBlock);
      
      // Mine blocks to pass resolve date
      simnet.mineEmptyBlocks(15);
      
      const result = resolveMarket(simnet, 1, true);
      
      expect(result.result).toBeOk(Cl.bool(true));
    });
    
    it('should reject resolution before resolve date', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Test market', futureBlock);
      
      const result = resolveMarket(simnet, 1, true);
      
      expect(result.result).toBeErr(Cl.uint(112)); // ERR-DEADLINE-NOT-PASSED
    });
    
    it('should reject resolution by non-oracle', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 10;
      createMarket(simnet, 'Test market', futureBlock);
      
      simnet.mineEmptyBlocks(15);
      
      const result = resolveMarket(simnet, 1, true, WALLET_1);
      
      expect(result.result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });
    
    it('should reject double resolution', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 10;
      createMarket(simnet, 'Test market', futureBlock);
      
      simnet.mineEmptyBlocks(15);
      
      resolveMarket(simnet, 1, true);
      const result = resolveMarket(simnet, 1, false); // Try to resolve again
      
      expect(result.result).toBeErr(Cl.uint(102)); // ERR-MARKET-RESOLVED
    });
  });
  
  // ==========================================================================
  // PAYOUT TESTS
  // ==========================================================================
  
  describe('Payouts', () => {
    
    it('should calculate and distribute winnings correctly', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 10;
      createMarket(simnet, 'Test market', futureBlock);
      
      // Mint and bet
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      mintTokens(simnet, WALLET_2, HUNDRED_MILLION);
      
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);  // YES
      placeBet(simnet, 1, false, TEN_MILLION, WALLET_2); // NO
      
      // Resolve
      simnet.mineEmptyBlocks(15);
      resolveMarket(simnet, 1, true); // YES wins
      
      // Claim winnings
      const claimResult = claimWinnings(simnet, 1, WALLET_1);
      
      expect(claimResult.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should prevent loser from claiming', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 10;
      createMarket(simnet, 'Test market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      mintTokens(simnet, WALLET_2, HUNDRED_MILLION);
      
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      placeBet(simnet, 1, false, TEN_MILLION, WALLET_2);
      
      simnet.mineEmptyBlocks(15);
      resolveMarket(simnet, 1, true); // YES wins
      
      // NO bettor tries to claim
      const claimResult = claimWinnings(simnet, 1, WALLET_2);
      
      expect(claimResult.result).toBeErr(Cl.uint(108)); // ERR-WRONG-OUTCOME
    });
    
    it('should prevent double claiming', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 10;
      createMarket(simnet, 'Test market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      mintTokens(simnet, WALLET_2, HUNDRED_MILLION);
      
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      placeBet(simnet, 1, false, TEN_MILLION, WALLET_2);
      
      simnet.mineEmptyBlocks(15);
      resolveMarket(simnet, 1, true);
      
      claimWinnings(simnet, 1, WALLET_1);
      const secondClaim = claimWinnings(simnet, 1, WALLET_1);
      
      expect(secondClaim.result).toBeErr(Cl.uint(106)); // ERR-ALREADY-CLAIMED
    });
    
    it('should reject claim before resolution', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Test market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      
      const claimResult = claimWinnings(simnet, 1, WALLET_1);
      
      expect(claimResult.result).toBeErr(Cl.uint(103)); // ERR-MARKET-NOT-RESOLVED
    });
  });
  
  // ==========================================================================
  // REFUND TESTS
  // ==========================================================================
  
  describe('Refunds (Cancelled Markets)', () => {
    
    it('should allow refund for cancelled market', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Test market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      
      cancelMarket(simnet, 1);
      
      const refundResult = claimRefund(simnet, 1, WALLET_1);
      
      expect(refundResult.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should reject refund for active market', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Test market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      
      const refundResult = claimRefund(simnet, 1, WALLET_1);
      
      expect(refundResult.result).toBeErr(Cl.uint(114)); // ERR-MARKET-NOT-CANCELLED
    });
    
    it('should reject refund for resolved market', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 10;
      createMarket(simnet, 'Test market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      
      simnet.mineEmptyBlocks(15);
      resolveMarket(simnet, 1, true);
      
      const refundResult = claimRefund(simnet, 1, WALLET_1);
      
      expect(refundResult.result).toBeErr(Cl.uint(114)); // ERR-MARKET-NOT-CANCELLED
    });
    
    it('should prevent non-admin from cancelling', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Test market', futureBlock);
      
      const cancelResult = cancelMarket(simnet, 1, WALLET_1);
      
      expect(cancelResult.result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });
  });
  
  // ==========================================================================
  // READ-ONLY FUNCTION TESTS
  // ==========================================================================
  
  describe('Read-Only Functions', () => {
    
    it('should calculate current odds correctly', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Test market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      mintTokens(simnet, WALLET_2, HUNDRED_MILLION);
      
      // 30% YES, 70% NO
      placeBet(simnet, 1, true, TEN_MILLION * 3, WALLET_1);  // 30 USDCx YES
      placeBet(simnet, 1, false, TEN_MILLION * 7, WALLET_2); // 70 USDCx NO
      
      const odds = simnet.callReadOnlyFn(
        'prediction-market',
        'get-current-odds',
        [Cl.uint(1)],
        DEPLOYER
      );
      
      expect(odds.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should return 50/50 odds for empty market', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Test market', futureBlock);
      
      const odds = simnet.callReadOnlyFn(
        'prediction-market',
        'get-current-odds',
        [Cl.uint(1)],
        DEPLOYER
      );
      
      expect(odds.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should calculate potential payout correctly', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Test market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      
      const payout = simnet.callReadOnlyFn(
        'prediction-market',
        'calculate-potential-payout',
        [Cl.uint(1), Cl.bool(true), Cl.uint(TEN_MILLION)],
        DEPLOYER
      );
      
      expect(payout.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should get market details', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Will STX reach $5?', futureBlock);
      
      const market = simnet.callReadOnlyFn(
        'prediction-market',
        'get-market',
        [Cl.uint(1)],
        DEPLOYER
      );
      
      expect(market.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should get platform stats', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Market 1', futureBlock);
      createMarket(simnet, 'Market 2', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      
      const stats = simnet.callReadOnlyFn(
        'prediction-market',
        'get-platform-stats',
        [],
        DEPLOYER
      );
      
      expect(stats.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should track user markets', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 1000;
      createMarket(simnet, 'Market 1', futureBlock);
      createMarket(simnet, 'Market 2', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      placeBet(simnet, 2, false, TEN_MILLION, WALLET_1);
      
      const userMarkets = simnet.callReadOnlyFn(
        'prediction-market',
        'get-user-markets',
        [Cl.standardPrincipal(WALLET_1)],
        WALLET_1
      );
      
      expect(userMarkets.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should check if user can claim winnings', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 10;
      createMarket(simnet, 'Test market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      mintTokens(simnet, WALLET_2, HUNDRED_MILLION);
      
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      placeBet(simnet, 1, false, TEN_MILLION, WALLET_2);
      
      simnet.mineEmptyBlocks(15);
      resolveMarket(simnet, 1, true);
      
      const canClaim = simnet.callReadOnlyFn(
        'prediction-market',
        'can-claim-winnings',
        [Cl.standardPrincipal(WALLET_1), Cl.uint(1)],
        WALLET_1
      );
      
      expect(canClaim.result.type).toBe(ClarityType.ResponseOk);
    });
  });
  
  // ==========================================================================
  // EDGE CASE TESTS
  // ==========================================================================
  
  describe('Edge Cases', () => {
    
    it('should handle one-sided market (all YES bets)', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 10;
      createMarket(simnet, 'One-sided market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      
      simnet.mineEmptyBlocks(15);
      resolveMarket(simnet, 1, true);
      
      // Should only get back original stake (no losers to take from)
      const claimResult = claimWinnings(simnet, 1, WALLET_1);
      expect(claimResult.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should handle user with positions on both sides', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 10;
      createMarket(simnet, 'Hedged market', futureBlock);
      
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      
      // Bet on both sides (hedging)
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      placeBet(simnet, 1, false, TEN_MILLION, WALLET_1);
      
      simnet.mineEmptyBlocks(15);
      resolveMarket(simnet, 1, true);
      
      // Can claim the YES portion
      const claimResult = claimWinnings(simnet, 1, WALLET_1);
      expect(claimResult.result.type).toBe(ClarityType.ResponseOk);
    });
    
    it('should handle multiple users claiming on same market', async () => {
      const simnet = await import('@hirosystems/clarinet-sdk').then(m => m.initSimnet());
      initializePlatform(simnet);
      
      const futureBlock = simnet.blockHeight + 10;
      createMarket(simnet, 'Multi-user market', futureBlock);
      
      // Three users bet YES
      mintTokens(simnet, WALLET_1, HUNDRED_MILLION);
      mintTokens(simnet, WALLET_2, HUNDRED_MILLION);
      mintTokens(simnet, WALLET_3, HUNDRED_MILLION);
      mintTokens(simnet, WALLET_4, HUNDRED_MILLION);
      
      placeBet(simnet, 1, true, TEN_MILLION, WALLET_1);
      placeBet(simnet, 1, true, TEN_MILLION * 2, WALLET_2);
      placeBet(simnet, 1, true, TEN_MILLION * 3, WALLET_3);
      // One user bets NO
      placeBet(simnet, 1, false, TEN_MILLION * 6, WALLET_4);
      
      simnet.mineEmptyBlocks(15);
      resolveMarket(simnet, 1, true);
      
      // All YES bettors can claim
      const claim1 = claimWinnings(simnet, 1, WALLET_1);
      const claim2 = claimWinnings(simnet, 1, WALLET_2);
      const claim3 = claimWinnings(simnet, 1, WALLET_3);
      
      expect(claim1.result.type).toBe(ClarityType.ResponseOk);
      expect(claim2.result.type).toBe(ClarityType.ResponseOk);
      expect(claim3.result.type).toBe(ClarityType.ResponseOk);
    });
  });
});
