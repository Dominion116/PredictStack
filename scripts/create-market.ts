import { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV, stringAsciiCV, someCV, noneCV } from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";
import { generateWallet, getStxAddress } from "@stacks/wallet-sdk";

const MNEMONIC = "REDACTED_MNEMONIC";
const DEPLOYER = "ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY";
const CONTRACT = "prediction-market-v6";

async function createMarket() {
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
  
  // Set resolve date to ~7 days from now (144 blocks/day * 7)
  const resolveBlock = currentBlock + (144 * 7);
  
  console.log("Current block:", currentBlock);
  console.log("Resolve block:", resolveBlock);
  
  const txOptions = {
    contractAddress: DEPLOYER,
    contractName: CONTRACT,
    functionName: "create-market",
    functionArgs: [
      stringAsciiCV("Will Bitcoin reach $100,000 by March 2026?"),
      someCV(stringAsciiCV("Market resolves YES if BTC/USD reaches $100,000 on any major exchange.")),
      uintCV(resolveBlock),
      noneCV(),  // ipfs-hash
    ],
    senderKey: account.stxPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 50000n,
  };
  
  console.log("Building transaction...");
  const tx = await makeContractCall(txOptions);
  
  console.log("Broadcasting...");
  const result = await broadcastTransaction({ transaction: tx, network });
  
  if ('error' in result) {
    console.error("Broadcast error:", result.error);
    console.error("Reason:", result.reason);
    console.error("Reason data:", JSON.stringify(result.reason_data, null, 2));
  } else {
    console.log("TX ID:", result.txid);
    console.log("Explorer: https://explorer.hiro.so/txid/" + result.txid + "?chain=testnet");
  }
}

createMarket().catch(console.error);
