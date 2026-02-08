import { makeContractDeploy, makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV, principalCV } from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";
import { generateWallet } from "@stacks/wallet-sdk";
import * as fs from "fs";

const MNEMONIC = "REDACTED_MNEMONIC";
const DEPLOYER = "ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY";
const CONTRACT_NAME = "prediction-market-v6";

async function deployAndInit() {
  const wallet = await generateWallet({
    secretKey: MNEMONIC,
    password: "",
  });
  
  const account = wallet.accounts[0];
  const network = STACKS_TESTNET;
  
  // Read contract source
  const contractCode = fs.readFileSync("./contracts/prediction-market-v6.clar", "utf8");
  
  console.log("=== Deploying", CONTRACT_NAME, "===");
  console.log("Deployer:", DEPLOYER);
  
  // Deploy contract
  const deployTx = await makeContractDeploy({
    contractName: CONTRACT_NAME,
    codeBody: contractCode,
    senderKey: account.stxPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 500000n, // Higher fee for faster confirmation
    clarityVersion: 2,
  });
  
  console.log("Broadcasting deployment...");
  const deployResult = await broadcastTransaction({ transaction: deployTx, network });
  
  if ('error' in deployResult) {
    console.error("Deploy error:", deployResult.error, deployResult.reason);
    return;
  }
  
  console.log("Deploy TX:", deployResult.txid);
  console.log("Explorer: https://explorer.hiro.so/txid/" + deployResult.txid + "?chain=testnet");
  
  // Wait for confirmation
  console.log("\nWaiting 60 seconds for deployment confirmation...");
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // Initialize contract
  console.log("\n=== Initializing contract ===");
  
  const initTx = await makeContractCall({
    contractAddress: DEPLOYER,
    contractName: CONTRACT_NAME,
    functionName: "initialize",
    functionArgs: [
      principalCV(DEPLOYER),  // admin
      principalCV(DEPLOYER),  // oracle
      principalCV(DEPLOYER),  // treasury
      uintCV(200),            // fee-bps (2%)
      uintCV(1000000),        // min-bet (1 USDCx)
    ],
    senderKey: account.stxPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 50000n,
  });
  
  console.log("Broadcasting initialization...");
  const initResult = await broadcastTransaction({ transaction: initTx, network });
  
  if ('error' in initResult) {
    console.error("Init error:", initResult.error, initResult.reason);
    return;
  }
  
  console.log("Init TX:", initResult.txid);
  console.log("Explorer: https://explorer.hiro.so/txid/" + initResult.txid + "?chain=testnet");
  
  console.log("\n=== Done! ===");
  console.log("Contract:", DEPLOYER + "." + CONTRACT_NAME);
  console.log("Update frontend/src/lib/constants.ts to use:", CONTRACT_NAME);
}

deployAndInit().catch(console.error);
