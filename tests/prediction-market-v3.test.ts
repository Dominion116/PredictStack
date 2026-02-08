import { describe, it, expect, beforeEach } from "vitest";
import { Cl, ClarityType } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const contractName = "prediction-market-v3";
const usdcxContract = "usdcx-v1";

describe("PredictStack Prediction Market V3", () => {
  
  describe("Initialization", () => {
    
    it("should initialize the platform successfully", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(deployer),  // admin
          Cl.principal(deployer),  // oracle
          Cl.principal(deployer),  // treasury
          Cl.uint(200),            // 2% fee
          Cl.uint(1000000),        // 1 USDCx min bet
        ],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));
    });
    
    it("should not allow double initialization", () => {
      // First init
      simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.uint(200),
          Cl.uint(1000000),
        ],
        deployer
      );
      
      // Second init should fail
      const { result } = simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(wallet1),
          Cl.principal(wallet1),
          Cl.principal(wallet1),
          Cl.uint(200),
          Cl.uint(1000000),
        ],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(115)); // ERR-ALREADY-INITIALIZED
    });
    
    it("should reject fee above maximum", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.uint(1500),           // 15% - above max
          Cl.uint(1000000),
        ],
        deployer
      );
      
      expect(result).toBeErr(Cl.uint(110)); // ERR-INVALID-AMOUNT
    });
    
    it("should check initialization status", () => {
      const { result: beforeInit } = simnet.callReadOnlyFn(
        contractName,
        "is-initialized",
        [],
        deployer
      );
      expect(beforeInit).toBeOk(Cl.bool(false));
      
      simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.uint(200),
          Cl.uint(1000000),
        ],
        deployer
      );
      
      const { result: afterInit } = simnet.callReadOnlyFn(
        contractName,
        "is-initialized",
        [],
        deployer
      );
      expect(afterInit).toBeOk(Cl.bool(true));
    });
  });
  
  describe("Platform Configuration", () => {
    
    beforeEach(() => {
      simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.uint(200),
          Cl.uint(1000000),
        ],
        deployer
      );
    });
    
    it("should get platform config", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-platform-config",
        [],
        deployer
      );
      
      expect(result.type).toBe(ClarityType.ResponseOk);
    });
    
    it("should allow admin to update fee", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "set-platform-fee",
        [Cl.uint(300)], // 3%
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));
    });
    
    it("should not allow non-admin to update fee", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "set-platform-fee",
        [Cl.uint(300)],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });
    
    it("should allow admin to pause platform", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "pause-platform",
        [],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));
    });
    
    it("should allow admin to unpause platform", () => {
      simnet.callPublicFn(contractName, "pause-platform", [], deployer);
      
      const { result } = simnet.callPublicFn(
        contractName,
        "unpause-platform",
        [],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));
    });
  });
  
  describe("Market Creation", () => {
    
    beforeEach(() => {
      simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.uint(200),
          Cl.uint(1000000),
        ],
        deployer
      );
    });
    
    it("should create a market successfully", () => {
      const futureBlock = simnet.blockHeight + 1000;
      
      const { result } = simnet.callPublicFn(
        contractName,
        "create-market",
        [
          Cl.stringAscii("Will BTC reach $100k by end of 2026?"),
          Cl.some(Cl.stringAscii("Bitcoin price prediction market")),
          Cl.uint(futureBlock),
          Cl.none(),
        ],
        deployer
      );
      
      expect(result).toBeOk(Cl.uint(1));
    });
    
    it("should increment market ID", () => {
      const futureBlock = simnet.blockHeight + 1000;
      
      simnet.callPublicFn(
        contractName,
        "create-market",
        [
          Cl.stringAscii("Market 1"),
          Cl.none(),
          Cl.uint(futureBlock),
          Cl.none(),
        ],
        deployer
      );
      
      const { result } = simnet.callPublicFn(
        contractName,
        "create-market",
        [
          Cl.stringAscii("Market 2"),
          Cl.none(),
          Cl.uint(futureBlock),
          Cl.none(),
        ],
        deployer
      );
      
      expect(result).toBeOk(Cl.uint(2));
    });
    
    it("should not allow non-admin to create market", () => {
      const futureBlock = simnet.blockHeight + 1000;
      
      const { result } = simnet.callPublicFn(
        contractName,
        "create-market",
        [
          Cl.stringAscii("Unauthorized market"),
          Cl.none(),
          Cl.uint(futureBlock),
          Cl.none(),
        ],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });
    
    it("should not allow past resolve date", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "create-market",
        [
          Cl.stringAscii("Past market"),
          Cl.none(),
          Cl.uint(1), // Past block
          Cl.none(),
        ],
        deployer
      );
      
      expect(result).toBeErr(Cl.uint(111)); // ERR-DEADLINE-PASSED
    });
    
    it("should get market details", () => {
      const futureBlock = simnet.blockHeight + 1000;
      
      simnet.callPublicFn(
        contractName,
        "create-market",
        [
          Cl.stringAscii("Test market"),
          Cl.some(Cl.stringAscii("Description")),
          Cl.uint(futureBlock),
          Cl.none(),
        ],
        deployer
      );
      
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-market",
        [Cl.uint(1)],
        deployer
      );
      
      expect(result.type).toBe(ClarityType.ResponseOk);
    });
  });
  
  describe("Betting", () => {
    
    beforeEach(() => {
      // Initialize platform
      simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.uint(200),
          Cl.uint(1000000),
        ],
        deployer
      );
      
      // Create a market
      const futureBlock = simnet.blockHeight + 1000;
      simnet.callPublicFn(
        contractName,
        "create-market",
        [
          Cl.stringAscii("Will ETH flip BTC?"),
          Cl.none(),
          Cl.uint(futureBlock),
          Cl.none(),
        ],
        deployer
      );
      
      // Get USDCx for test wallets
      simnet.callPublicFn(usdcxContract, "faucet", [], wallet1);
      simnet.callPublicFn(usdcxContract, "faucet", [], wallet2);
    });
    
    it("should place a YES bet", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "place-bet",
        [
          Cl.uint(1),              // market-id
          Cl.bool(true),           // YES
          Cl.uint(10000000),       // 10 USDCx
          Cl.contractPrincipal(deployer, usdcxContract),
        ],
        wallet1
      );
      
      expect(result).toBeOk(Cl.bool(true));
    });
    
    it("should place a NO bet", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "place-bet",
        [
          Cl.uint(1),
          Cl.bool(false),          // NO
          Cl.uint(10000000),
          Cl.contractPrincipal(deployer, usdcxContract),
        ],
        wallet1
      );
      
      expect(result).toBeOk(Cl.bool(true));
    });
    
    it("should update market pools after bet", () => {
      simnet.callPublicFn(
        contractName,
        "place-bet",
        [
          Cl.uint(1),
          Cl.bool(true),
          Cl.uint(10000000),
          Cl.contractPrincipal(deployer, usdcxContract),
        ],
        wallet1
      );
      
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-market-odds",
        [Cl.uint(1)],
        deployer
      );
      
      expect(result.type).toBe(ClarityType.ResponseOk);
    });
    
    it("should reject bet below minimum", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "place-bet",
        [
          Cl.uint(1),
          Cl.bool(true),
          Cl.uint(100),            // Too small
          Cl.contractPrincipal(deployer, usdcxContract),
        ],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(110)); // ERR-INVALID-AMOUNT
    });
    
    it("should track user position", () => {
      simnet.callPublicFn(
        contractName,
        "place-bet",
        [
          Cl.uint(1),
          Cl.bool(true),
          Cl.uint(10000000),
          Cl.contractPrincipal(deployer, usdcxContract),
        ],
        wallet1
      );
      
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-user-position",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );
      
      expect(result.type).toBe(ClarityType.ResponseOk);
    });
    
    it("should calculate potential payout", () => {
      simnet.callPublicFn(
        contractName,
        "place-bet",
        [
          Cl.uint(1),
          Cl.bool(true),
          Cl.uint(10000000),
          Cl.contractPrincipal(deployer, usdcxContract),
        ],
        wallet1
      );
      
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "calculate-potential-payout",
        [Cl.uint(1), Cl.bool(false), Cl.uint(10000000)],
        wallet2
      );
      
      expect(result.type).toBe(ClarityType.ResponseOk);
    });
  });
  
  describe("Market Resolution", () => {
    
    it("should not resolve before deadline", () => {
      // Initialize platform
      simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.uint(200),
          Cl.uint(1000000),
        ],
        deployer
      );
      
      // Create a market with far future resolve time (1000 blocks away)
      const futureBlock = simnet.blockHeight + 1000;
      simnet.callPublicFn(
        contractName,
        "create-market",
        [
          Cl.stringAscii("Far future market"),
          Cl.none(),
          Cl.uint(futureBlock),
          Cl.none(),
        ],
        deployer
      );
      
      // Get USDCx and place bet
      simnet.callPublicFn(usdcxContract, "faucet", [], wallet1);
      simnet.callPublicFn(
        contractName,
        "place-bet",
        [Cl.uint(1), Cl.bool(true), Cl.uint(10000000), Cl.contractPrincipal(deployer, usdcxContract)],
        wallet1
      );
      
      // Try to resolve immediately - should fail
      const { result } = simnet.callPublicFn(
        contractName,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer
      );
      
      expect(result).toBeErr(Cl.uint(112)); // ERR-DEADLINE-NOT-PASSED
    });
    
    it("should resolve after deadline", () => {
      // Initialize platform
      simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.uint(200),
          Cl.uint(1000000),
        ],
        deployer
      );
      
      // Create a market with short resolve time
      const futureBlock = simnet.blockHeight + 5;
      simnet.callPublicFn(
        contractName,
        "create-market",
        [
          Cl.stringAscii("Quick resolution market"),
          Cl.none(),
          Cl.uint(futureBlock),
          Cl.none(),
        ],
        deployer
      );
      
      // Get USDCx and place bet
      simnet.callPublicFn(usdcxContract, "faucet", [], wallet1);
      simnet.callPublicFn(
        contractName,
        "place-bet",
        [Cl.uint(1), Cl.bool(true), Cl.uint(10000000), Cl.contractPrincipal(deployer, usdcxContract)],
        wallet1
      );
      
      // Mine blocks to pass deadline
      simnet.mineEmptyBlocks(10);
      
      const { result } = simnet.callPublicFn(
        contractName,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));
    });
    
    it("should not allow non-oracle to resolve", () => {
      // Initialize platform
      simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.uint(200),
          Cl.uint(1000000),
        ],
        deployer
      );
      
      // Create a market with short resolve time
      const futureBlock = simnet.blockHeight + 5;
      simnet.callPublicFn(
        contractName,
        "create-market",
        [
          Cl.stringAscii("Quick resolution market"),
          Cl.none(),
          Cl.uint(futureBlock),
          Cl.none(),
        ],
        deployer
      );
      
      // Get USDCx and place bet
      simnet.callPublicFn(usdcxContract, "faucet", [], wallet1);
      simnet.callPublicFn(
        contractName,
        "place-bet",
        [Cl.uint(1), Cl.bool(true), Cl.uint(10000000), Cl.contractPrincipal(deployer, usdcxContract)],
        wallet1
      );
      
      // Mine blocks to pass deadline
      simnet.mineEmptyBlocks(10);
      
      const { result } = simnet.callPublicFn(
        contractName,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });
  });
  
  describe("Claiming Winnings", () => {
    
    beforeEach(() => {
      // Initialize platform
      simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.uint(200),
          Cl.uint(1000000),
        ],
        deployer
      );
      
      // Create market
      const futureBlock = simnet.blockHeight + 5;
      simnet.callPublicFn(
        contractName,
        "create-market",
        [
          Cl.stringAscii("Winner takes all"),
          Cl.none(),
          Cl.uint(futureBlock),
          Cl.none(),
        ],
        deployer
      );
      
      // Get USDCx and place bets
      simnet.callPublicFn(usdcxContract, "faucet", [], wallet1);
      simnet.callPublicFn(usdcxContract, "faucet", [], wallet2);
      
      simnet.callPublicFn(
        contractName,
        "place-bet",
        [Cl.uint(1), Cl.bool(true), Cl.uint(10000000), Cl.contractPrincipal(deployer, usdcxContract)],
        wallet1
      );
      
      simnet.callPublicFn(
        contractName,
        "place-bet",
        [Cl.uint(1), Cl.bool(false), Cl.uint(10000000), Cl.contractPrincipal(deployer, usdcxContract)],
        wallet2
      );
      
      // Resolve market
      simnet.mineEmptyBlocks(10);
      simnet.callPublicFn(
        contractName,
        "resolve-market",
        [Cl.uint(1), Cl.bool(true)],
        deployer
      );
    });
    
    it("should allow winner to claim", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "claim-winnings",
        [Cl.uint(1), Cl.contractPrincipal(deployer, usdcxContract)],
        wallet1
      );
      
      expect(result.type).toBe(ClarityType.ResponseOk);
    });
    
    it("should not allow loser to claim", () => {
      // wallet2 has no position (bet didn't go through) - should get ERR-NO-POSITION
      const { result } = simnet.callPublicFn(
        contractName,
        "claim-winnings",
        [Cl.uint(1), Cl.contractPrincipal(deployer, usdcxContract)],
        wallet2
      );
      
      // Contract returns ERR-NO-POSITION for users who can't claim
      expect(result).toBeErr(Cl.uint(107)); // ERR-NO-POSITION
    });
    
    it("should not allow double claim", () => {
      simnet.callPublicFn(
        contractName,
        "claim-winnings",
        [Cl.uint(1), Cl.contractPrincipal(deployer, usdcxContract)],
        wallet1
      );
      
      const { result } = simnet.callPublicFn(
        contractName,
        "claim-winnings",
        [Cl.uint(1), Cl.contractPrincipal(deployer, usdcxContract)],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(106)); // ERR-ALREADY-CLAIMED
    });
    
    it("should check if user can claim", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "can-claim-winnings",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );
      
      expect(result.type).toBe(ClarityType.ResponseOk);
    });
  });
  
  describe("Market Cancellation", () => {
    
    beforeEach(() => {
      simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.uint(200),
          Cl.uint(1000000),
        ],
        deployer
      );
      
      const futureBlock = simnet.blockHeight + 1000;
      simnet.callPublicFn(
        contractName,
        "create-market",
        [
          Cl.stringAscii("Cancellable market"),
          Cl.none(),
          Cl.uint(futureBlock),
          Cl.none(),
        ],
        deployer
      );
      
      simnet.callPublicFn(usdcxContract, "faucet", [], wallet1);
      simnet.callPublicFn(
        contractName,
        "place-bet",
        [Cl.uint(1), Cl.bool(true), Cl.uint(10000000), Cl.contractPrincipal(deployer, usdcxContract)],
        wallet1
      );
    });
    
    it("should allow admin to cancel market", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "cancel-market",
        [Cl.uint(1)],
        deployer
      );
      
      expect(result).toBeOk(Cl.bool(true));
    });
    
    it("should allow refund after cancellation", () => {
      simnet.callPublicFn(
        contractName,
        "cancel-market",
        [Cl.uint(1)],
        deployer
      );
      
      const { result } = simnet.callPublicFn(
        contractName,
        "claim-refund",
        [Cl.uint(1), Cl.contractPrincipal(deployer, usdcxContract)],
        wallet1
      );
      
      expect(result.type).toBe(ClarityType.ResponseOk);
    });
    
    it("should not allow non-admin to cancel", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "cancel-market",
        [Cl.uint(1)],
        wallet1
      );
      
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });
  });
  
  describe("Platform Stats", () => {
    
    beforeEach(() => {
      simnet.callPublicFn(
        contractName,
        "initialize",
        [
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.principal(deployer),
          Cl.uint(200),
          Cl.uint(1000000),
        ],
        deployer
      );
    });
    
    it("should get platform stats", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-platform-stats",
        [],
        deployer
      );
      
      expect(result.type).toBe(ClarityType.ResponseOk);
    });
    
    it("should get next market ID", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-next-market-id",
        [],
        deployer
      );
      
      expect(result).toBeOk(Cl.uint(1));
    });
  });
});
