import { makeContractCall, broadcastTransaction, PostConditionMode, uintCV, principalCV, fetchCallReadOnlyFunction } from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";
import { generateWallet } from "@stacks/wallet-sdk";
import 'dotenv/config';

const MNEMONIC = process.env.MNEMONIC;
if (!MNEMONIC) {
  console.error("Error: MNEMONIC environment variable not set");
  console.error("Run: export MNEMONIC='your seed phrase here'");
  process.exit(1);
}
const mnemonic: string = MNEMONIC;
const DEPLOYER = "ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY";
const CONTRACT = "prediction-market-v6";

async function checkInitialized(): Promise<boolean> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: DEPLOYER,
      contractName: CONTRACT,
      functionName: "is-initialized",
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: DEPLOYER,
    });
    console.log("is-initialized result:", result);
    return result.type === "ok" && (result as any).value?.type === "true";
  } catch (e) {
    console.log("Read error (contract may not be deployed yet):", e);
    return false;
  }
}

async function init() {
  console.log("Checking if contract is already initialized...");
  const isInit = await checkInitialized();
  if (isInit) {
    console.log("Contract is already initialized!");
    return;
  }
  
  const wallet = await generateWallet({
    secretKey: mnemonic,
    password: "",
  });
  
  const account = wallet.accounts[0];
  const network = STACKS_TESTNET;
  
  // IMPORTANT: Use the hardcoded testnet address, not derived one
  // This ensures we use ST format (testnet) not SP format (mainnet)
  console.log("Admin/Oracle/Treasury address:", DEPLOYER);
  
  const txOptions = {
    contractAddress: DEPLOYER,
    contractName: CONTRACT,
    functionName: "initialize",
    functionArgs: [
      principalCV(DEPLOYER),  // admin - using hardcoded ST address
      principalCV(DEPLOYER),  // oracle - using hardcoded ST address
      principalCV(DEPLOYER),  // treasury - using hardcoded ST address
      uintCV(200),            // fee-bps (2%)
      uintCV(1000000),        // min-bet (1 USDCx)
    ],
    senderKey: account.stxPrivateKey,
    network,
    postConditionMode: PostConditionMode.Allow,
    fee: 50000n,
  };
  
  console.log("Building transaction...");
  const tx = await makeContractCall(txOptions);
  
  console.log("Broadcasting...");
  const result = await broadcastTransaction({ transaction: tx, network });
  
  if ('error' in result) {
    console.error("Broadcast error:", result.error, result.reason);
  } else {
    console.log("TX ID:", result.txid);
    console.log("Explorer: https://explorer.hiro.so/txid/" + result.txid + "?chain=testnet");
  }
}

init().catch(console.error);
