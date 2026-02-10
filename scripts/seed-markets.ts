import { makeContractCall, broadcastTransaction, PostConditionMode, uintCV, stringAsciiCV, someCV, noneCV } from "@stacks/transactions";
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

const MARKETS = [
  {
    question: "Will Bitcoin reach $100,000 by March 2026?",
    description: "Market resolves YES if BTC/USD reaches $100,000 on any major exchange before March 31, 2026.",
    days: 52, // ~March 31
  },
  {
    question: "Will the next US President be a Democrat?",
    description: "Market resolves YES if the president inaugurated in January 2029 is a Democrat.",
    days: 365,
  },
  {
    question: "Will Stacks STX reach $5 by end of 2026?",
    description: "Market resolves YES if STX/USD reaches $5 on any major exchange before December 31, 2026.",
    days: 326,
  },
];

async function createMarkets() {
  const wallet = await generateWallet({
    secretKey: mnemonic,
    password: "",
  });
  
  const account = wallet.accounts[0];
  const network = STACKS_TESTNET;
  
  // Get current block height
  const response = await fetch("https://api.testnet.hiro.so/extended/v1/block?limit=1");
  const data = await response.json();
  const currentBlock = data.results[0].height;
  
  console.log("Current block:", currentBlock);
  console.log("Creating", MARKETS.length, "markets...\n");
  
  for (let i = 0; i < MARKETS.length; i++) {
    const market = MARKETS[i];
    const resolveBlock = currentBlock + (144 * market.days);
    
    console.log(`[${i + 1}/${MARKETS.length}] ${market.question}`);
    
    const txOptions = {
      contractAddress: DEPLOYER,
      contractName: CONTRACT,
      functionName: "create-market",
      functionArgs: [
        stringAsciiCV(market.question),
        someCV(stringAsciiCV(market.description)),
        uintCV(resolveBlock),
        noneCV(),
      ],
      senderKey: account.stxPrivateKey,
      network,
      postConditionMode: PostConditionMode.Allow,
      fee: 50000n,
    };
    
    const tx = await makeContractCall(txOptions);
    const result = await broadcastTransaction({ transaction: tx, network });
    
    if ('error' in result) {
      console.error("  Error:", result.error);
    } else {
      console.log("  TX:", result.txid);
    }
    
    // Wait between transactions
    if (i < MARKETS.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log("\nDone! Markets will appear on the frontend once confirmed.");
}

createMarkets().catch(console.error);
