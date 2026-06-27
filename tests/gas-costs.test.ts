import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v0.30.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";

Clarinet.test({
  name: "Measure gas costs for key functions",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;

    // Initialize contract
    let block = chain.mineBlock([
      Tx.contractCall(
        "predictstacksv3",
        "initialize",
        [
          types.principal(deployer.address),
          types.principal(deployer.address),
          types.principal(deployer.address),
          types.uint(100000), // fee
          types.uint(1000000), // min bet
          types.uint(1000000000), // max bet
        ],
        deployer.address
      ),
    ]);
    console.log("Initialize cost:", block.receipts[0].execution_cost);

    // Create market
    block = chain.mineBlock([
      Tx.contractCall(
        "predictstacksv3",
        "create-market",
        [
          types.ascii("test-market-btc-100k"),
          types.uint(1000000),
        ],
        deployer.address
      ),
    ]);
    console.log("Create market cost:", block.receipts[0].execution_cost);

    // Place bet
    block = chain.mineBlock([
      Tx.contractCall(
        "predictstacksv3",
        "place-bet",
        [
          types.uint(1),
          types.bool(true),
          types.uint(50000),
        ],
        wallet1.address
      ),
    ]);
    console.log("Place bet cost:", block.receipts[0].execution_cost);

    // Get market odds (read-only)
    block = chain.mineBlock([
      Tx.contractCall(
        "predictstacksv3",
        "get-market-odds",
        [types.uint(1)],
        wallet1.address
      ),
    ]);
    console.log("Get market odds cost:", block.receipts[0].execution_cost);

    // Resolve market
    block = chain.mineBlock([
      Tx.contractCall(
        "predictstacksv3",
        "resolve-market",
        [types.uint(1), types.bool(true)],
        deployer.address
      ),
    ]);
    console.log("Resolve market cost:", block.receipts[0].execution_cost);

    // Claim winnings
    block = chain.mineBlock([
      Tx.contractCall(
        "predictstacksv3",
        "claim-winnings",
        [types.uint(1)],
        wallet1.address
      ),
    ]);
    console.log("Claim winnings cost:", block.receipts[0].execution_cost);
  },
});
