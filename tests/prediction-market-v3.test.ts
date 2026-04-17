import { describe, expect, it } from "vitest";
import { Cl, cvToString } from "@stacks/transactions";

const CONTRACT = "prediction-market-v6";

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
        Cl.uint(200),
        Cl.uint(1_000_000),
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
      [Cl.uint(1), Cl.bool(true), Cl.uint(2_000_000)],
      wallet1
    );
    expect(cvToString(betYes.result)).toBe("(ok true)");

    const betNo = simnet.callPublicFn(
      CONTRACT,
      "place-bet",
      [Cl.uint(1), Cl.bool(false), Cl.uint(1_000_000)],
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

    expect(cvToString(claim.result)).toBe("(ok u2980000)");
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
        Cl.uint(200),
        Cl.uint(1_000_000),
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
      [Cl.uint(1), Cl.bool(true), Cl.uint(3_000_000)],
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
    expect(cvToString(refund.result)).toBe("(ok u3000000)");
  });
});
