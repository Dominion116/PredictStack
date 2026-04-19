import { describe, expect, it } from "vitest";
import { Cl, cvToString } from "@stacks/transactions";

const CONTRACT = "prediction-market-v7";

describe("prediction-market-v6 (STX-native)", () => {
  it("allows placing a bet and claiming winnings after resolution", () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;

    const init = simnet.callPublicFn(
      CONTRACT,
      "initialize",
      [
        Cl.standardPrincipal(deployer),
        Cl.standardPrincipal(deployer),
        Cl.standardPrincipal(deployer),
        Cl.uint(10_000),
        Cl.uint(20_000),
        Cl.uint(100_000),
      ],
      deployer
    );
    expect(cvToString(init.result)).toBe("(ok true)");

    const create = simnet.callPublicFn(
      CONTRACT,
      "create-market",
      [
        Cl.stringAscii("Will STX close above $3 by Friday?"),
        Cl.none(),
        Cl.uint(50),
        Cl.none(),
      ],
      deployer
    );
    expect(cvToString(create.result)).toBe("(ok u1)");

    const betYes = simnet.callPublicFn(
      CONTRACT,
      "place-bet",
      [Cl.uint(1), Cl.bool(true), Cl.uint(100_000)],
      wallet1
    );
    expect(cvToString(betYes.result)).toBe("(ok true)");

    const betNo = simnet.callPublicFn(
      CONTRACT,
      "place-bet",
      [Cl.uint(1), Cl.bool(false), Cl.uint(50_000)],
      wallet2
    );
    expect(cvToString(betNo.result)).toBe("(ok true)");

    simnet.mineEmptyBlocks(60);

    const resolve = simnet.callPublicFn(
      CONTRACT,
      "resolve-market",
      [Cl.uint(1), Cl.bool(true)],
      deployer
    );
    expect(cvToString(resolve.result)).toBe("(ok true)");

    const claim = simnet.callPublicFn(
      CONTRACT,
      "claim-winnings",
      [Cl.uint(1)],
      wallet1
    );

    expect(cvToString(claim.result)).toBe("(ok u150000)");
  });

  it("returns refunds when an active market is cancelled", () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;

    const init = simnet.callPublicFn(
      CONTRACT,
      "initialize",
      [
        Cl.standardPrincipal(deployer),
        Cl.standardPrincipal(deployer),
        Cl.standardPrincipal(deployer),
        Cl.uint(10_000),
        Cl.uint(20_000),
        Cl.uint(100_000),
      ],
      deployer
    );
    expect(cvToString(init.result)).toBe("(ok true)");

    const create = simnet.callPublicFn(
      CONTRACT,
      "create-market",
      [
        Cl.stringAscii("Will sBTC TVL exceed target this month?"),
        Cl.none(),
        Cl.uint(200),
        Cl.none(),
      ],
      deployer
    );
    expect(cvToString(create.result)).toBe("(ok u1)");

    const bet = simnet.callPublicFn(
      CONTRACT,
      "place-bet",
      [Cl.uint(1), Cl.bool(true), Cl.uint(80_000)],
      wallet1
    );
    expect(cvToString(bet.result)).toBe("(ok true)");

    const cancel = simnet.callPublicFn(
      CONTRACT,
      "cancel-market",
      [Cl.uint(1)],
      deployer
    );
    expect(cvToString(cancel.result)).toBe("(ok true)");

    const refund = simnet.callPublicFn(
      CONTRACT,
      "claim-refund",
      [Cl.uint(1)],
      wallet1
    );
    expect(cvToString(refund.result)).toBe("(ok u80000)");
  });

  it("quote-price returns current and post-trade prices", () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;

    simnet.callPublicFn(
      CONTRACT,
      "initialize",
      [
        Cl.standardPrincipal(deployer),
        Cl.standardPrincipal(deployer),
        Cl.standardPrincipal(deployer),
        Cl.uint(10_000),
        Cl.uint(20_000),
        Cl.uint(100_000),
      ],
      deployer
    );

    simnet.callPublicFn(
      CONTRACT,
      "create-market",
      [
        Cl.stringAscii("Test market"),
        Cl.none(),
        Cl.uint(50),
        Cl.none(),
      ],
      deployer
    );

    // Place initial YES bet to create pools
    simnet.callPublicFn(
      CONTRACT,
      "place-bet",
      [Cl.uint(1), Cl.bool(true), Cl.uint(100_000)],
      wallet1
    );

    // Quote YES price at 50k amount
    const quoteYes = simnet.callReadOnlyFn(
      CONTRACT,
      "quote-price",
      [Cl.uint(1), Cl.bool(true), Cl.uint(50_000)],
      wallet2
    );

    expect(quoteYes.result).not.toBe("(err u404)");
    const quoteYesStr = cvToString(quoteYes.result);
    expect(quoteYesStr).toContain("current-price-bps");
    expect(quoteYesStr).toContain("post-trade-price-bps");
    expect(quoteYesStr).toContain("price-impact-bps");
  });

  it("quote-shares returns pool share and projected payout", () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;

    simnet.callPublicFn(
      CONTRACT,
      "initialize",
      [
        Cl.standardPrincipal(deployer),
        Cl.standardPrincipal(deployer),
        Cl.standardPrincipal(deployer),
        Cl.uint(10_000),
        Cl.uint(20_000),
        Cl.uint(100_000),
      ],
      deployer
    );

    simnet.callPublicFn(
      CONTRACT,
      "create-market",
      [
        Cl.stringAscii("Test market"),
        Cl.none(),
        Cl.uint(50),
        Cl.none(),
      ],
      deployer
    );

    // Place initial bets to seed pools
    simnet.callPublicFn(
      CONTRACT,
      "place-bet",
      [Cl.uint(1), Cl.bool(true), Cl.uint(100_000)],
      wallet1
    );

    simnet.callPublicFn(
      CONTRACT,
      "place-bet",
      [Cl.uint(1), Cl.bool(false), Cl.uint(50_000)],
      wallet2
    );

    // Quote shares for a new 40k YES bet
    const quoteShares = simnet.callReadOnlyFn(
      CONTRACT,
      "quote-shares",
      [Cl.uint(1), Cl.bool(true), Cl.uint(40_000)],
      wallet1
    );

    expect(quoteShares.result).not.toBe("(err u404)");
    const quoteSharesStr = cvToString(quoteShares.result);
    expect(quoteSharesStr).toContain("pool-share-bps");
    expect(quoteSharesStr).toContain("projected-profit");
    expect(quoteSharesStr).toContain("projected-payout");
  });

  it("place-bet-with-slippage succeeds within tolerance", () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;

    simnet.callPublicFn(
      CONTRACT,
      "initialize",
      [
        Cl.standardPrincipal(deployer),
        Cl.standardPrincipal(deployer),
        Cl.standardPrincipal(deployer),
        Cl.uint(10_000),
        Cl.uint(20_000),
        Cl.uint(100_000),
      ],
      deployer
    );

    simnet.callPublicFn(
      CONTRACT,
      "create-market",
      [
        Cl.stringAscii("Test market"),
        Cl.none(),
        Cl.uint(50),
        Cl.none(),
      ],
      deployer
    );

    // Place initial YES bet
    simnet.callPublicFn(
      CONTRACT,
      "place-bet",
      [Cl.uint(1), Cl.bool(true), Cl.uint(100_000)],
      wallet1
    );

    // Place NO bet with slippage protection (max 4000 bps = 40%)
    const betWithSlippage = simnet.callPublicFn(
      CONTRACT,
      "place-bet-with-slippage",
      [Cl.uint(1), Cl.bool(false), Cl.uint(50_000), Cl.uint(4000)],
      wallet2
    );

    expect(cvToString(betWithSlippage.result)).toBe("(ok true)");
  });

  it("place-bet-with-slippage rejects when price exceeds tolerance", () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;

    simnet.callPublicFn(
      CONTRACT,
      "initialize",
      [
        Cl.standardPrincipal(deployer),
        Cl.standardPrincipal(deployer),
        Cl.standardPrincipal(deployer),
        Cl.uint(10_000),
        Cl.uint(20_000),
        Cl.uint(100_000),
      ],
      deployer
    );

    simnet.callPublicFn(
      CONTRACT,
      "create-market",
      [
        Cl.stringAscii("Test market"),
        Cl.none(),
        Cl.uint(50),
        Cl.none(),
      ],
      deployer
    );

    // Place initial large YES bet
    simnet.callPublicFn(
      CONTRACT,
      "place-bet",
      [Cl.uint(1), Cl.bool(true), Cl.uint(100_000)],
      wallet1
    );

    // Try to place NO bet with very strict slippage (100 bps = 1%)
    // Post-trade NO price will be much lower due to large YES pool
    const betWithSlippage = simnet.callPublicFn(
      CONTRACT,
      "place-bet-with-slippage",
      [Cl.uint(1), Cl.bool(false), Cl.uint(50_000), Cl.uint(100)],
      wallet2
    );

    expect(cvToString(betWithSlippage.result)).toBe("(err u121)");
  });
});
