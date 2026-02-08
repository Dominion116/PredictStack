import { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV, stringAsciiCV, someCV, noneCV } from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";
import { generateWallet } from "@stacks/wallet-sdk";
import * as readline from "readline";

const MNEMONIC = "REDACTED_MNEMONIC";
const DEPLOYER = "ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY";
const CONTRACT = "prediction-market-v6";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createMarket() {
  console.log("\n=== PredictStack Market Creator ===\n");
  
  // Get user input
  const question = await prompt("Enter market question: ");
  if (!question.trim()) {
    console.log("Question cannot be empty!");
    rl.close();
    return;
  }
  
  const description = await prompt("Enter description (optional, press Enter to skip): ");
  
  const daysStr = await prompt("Days until resolution (default: 7): ");
  const days = parseInt(daysStr) || 7;
  
  const imageUrl = await prompt("Image URL (optional, press Enter to skip): ");
  
  console.log("\n--- Market Preview ---");
  console.log(`Question: ${question}`);
  console.log(`Description: ${description || "(none)"}`);
  console.log(`Resolution: ${days} days from now`);
  console.log(`Image: ${imageUrl || "(none)"}`);
  
  const confirm = await prompt("\nCreate this market? (y/n): ");
  if (confirm.toLowerCase() !== 'y') {
    console.log("Cancelled.");
    rl.close();
    return;
  }
  
  const wallet = await generateWallet({
    secretKey: MNEMONIC,
    password: "",
  });
  
  const account = wallet.accounts[0];
  const network = STACKS_TESTNET;
  
  // Get current block height
  const response = await fetch("https://api.testnet.hiro.so/extended/v1/block?limit=1");
  const data = await response.json();
  const currentBlock = data.results[0].height;
  const resolveBlock = currentBlock + (144 * days);
  
  console.log(`\nCurrent block: ${currentBlock}`);
  console.log(`Resolve block: ${resolveBlock} (~${days} days)`);
  
  const txOptions = {
    contractAddress: DEPLOYER,
    contractName: CONTRACT,
    functionName: "create-market",
    functionArgs: [
      stringAsciiCV(question),
      description ? someCV(stringAsciiCV(description)) : noneCV(),
      uintCV(resolveBlock),
      imageUrl ? someCV(stringAsciiCV(imageUrl)) : noneCV(),
    ],
    senderKey: account.stxPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 50000n,
  };
  
  console.log("\nBuilding transaction...");
  const tx = await makeContractCall(txOptions);
  
  console.log("Broadcasting...");
  const result = await broadcastTransaction({ transaction: tx, network });
  
  if ('error' in result) {
    console.error("Error:", result.error, result.reason);
  } else {
    console.log("\n✅ Market created!");
    console.log("TX ID:", result.txid);
    console.log("Explorer: https://explorer.hiro.so/txid/" + result.txid + "?chain=testnet");
  }
  
  rl.close();
}

createMarket().catch((err) => {
  console.error(err);
  rl.close();
});
