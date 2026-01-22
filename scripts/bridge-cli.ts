#!/usr/bin/env node
/**
 * PredictStack - USDCx Bridge CLI
 * 
 * Command-line interface for bridging USDC <-> USDCx
 * 
 * Usage:
 *   npx ts-node scripts/bridge-cli.ts deposit --amount 10 --recipient ST1...
 *   npx ts-node scripts/bridge-cli.ts withdraw --amount 10 --recipient 0x...
 *   npx ts-node scripts/bridge-cli.ts balance --stacks ST1... --ethereum 0x...
 */

import 'dotenv/config';
import {
  depositUSDCToStacks,
  withdrawUSDCxToEthereum,
  getUSDCxBalance,
  getEthereumUSDCBalance,
  formatUSDCx,
  NETWORK_CONFIG,
} from './usdcx-bridge';

// ============================================================================
// CLI CONFIGURATION
// ============================================================================

const args = process.argv.slice(2);
const command = args[0];
const network = (process.env.NETWORK as 'testnet' | 'mainnet') || 'testnet';

function printUsage() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║               PredictStack - USDCx Bridge CLI                     ║
╚═══════════════════════════════════════════════════════════════════╝

Usage:
  npx ts-node scripts/bridge-cli.ts <command> [options]

Commands:
  deposit     Bridge USDC from Ethereum to Stacks (get USDCx)
  withdraw    Bridge USDCx from Stacks to Ethereum (get USDC)
  balance     Check USDC/USDCx balances

Options:
  --network   Network to use: testnet | mainnet (default: testnet)
  --amount    Amount to bridge (in USDC/USDCx)
  --recipient Recipient address (Stacks for deposit, Ethereum for withdraw)
  --stacks    Stacks address (for balance check)
  --ethereum  Ethereum address (for balance check)

Environment Variables:
  ETHEREUM_PRIVATE_KEY  Your Ethereum wallet private key (for deposits)
  STACKS_PRIVATE_KEY    Your Stacks wallet private key (for withdrawals)
  ETHEREUM_RPC_URL      Custom Ethereum RPC URL (optional)
  NETWORK               Network: testnet | mainnet

Examples:
  # Deposit 10 USDC from Ethereum to Stacks
  ETHEREUM_PRIVATE_KEY=0x... npx ts-node scripts/bridge-cli.ts deposit \\
    --amount 10 --recipient ST1...

  # Withdraw 10 USDCx from Stacks to Ethereum
  STACKS_PRIVATE_KEY=... npx ts-node scripts/bridge-cli.ts withdraw \\
    --amount 10 --recipient 0x...

  # Check balances
  npx ts-node scripts/bridge-cli.ts balance \\
    --stacks ST1... --ethereum 0x...

Contract Addresses (${network}):
  Stacks USDCx:  ${NETWORK_CONFIG[network].usdcxToken}
  Stacks Bridge: ${NETWORK_CONFIG[network].usdcxBridge}
  ETH USDC:      ${NETWORK_CONFIG[network].ethUsdcContract}
  ETH xReserve:  ${NETWORK_CONFIG[network].xReserveContract}

Resources:
  - Circle Faucet (testnet USDC): https://faucet.circle.com/
  - Sepolia Faucet (testnet ETH): https://cloud.google.com/application/web3/faucet/ethereum/sepolia
  - Stacks Faucet (testnet STX): https://explorer.hiro.so/sandbox/faucet?chain=testnet
  - Bridging Guide: https://docs.stacks.co/more-guides/bridging-usdcx
`);
}

function parseArgs(args: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let i = 1; i < args.length; i += 2) {
    if (args[i].startsWith('--')) {
      parsed[args[i].slice(2)] = args[i + 1];
    }
  }
  return parsed;
}

// ============================================================================
// COMMANDS
// ============================================================================

async function handleDeposit(options: Record<string, string>) {
  const amount = options.amount;
  const recipient = options.recipient;
  
  if (!amount || !recipient) {
    console.error('❌ Error: --amount and --recipient are required');
    console.log('Example: npx ts-node scripts/bridge-cli.ts deposit --amount 10 --recipient ST1...');
    process.exit(1);
  }
  
  if (!process.env.ETHEREUM_PRIVATE_KEY) {
    console.error('❌ Error: ETHEREUM_PRIVATE_KEY environment variable is required');
    process.exit(1);
  }
  
  console.log(`\n🌉 Bridging ${amount} USDC from Ethereum to Stacks...\n`);
  
  try {
    const result = await depositUSDCToStacks(
      {
        network,
        ethereumPrivateKey: process.env.ETHEREUM_PRIVATE_KEY,
        ethereumRpcUrl: process.env.ETHEREUM_RPC_URL,
      },
      {
        amount,
        stacksRecipient: recipient,
      }
    );
    
    console.log(`\n✅ Deposit initiated successfully!`);
    console.log(`   Approval TX: ${result.approvalTxHash}`);
    console.log(`   Deposit TX:  ${result.depositTxHash}`);
    console.log(`   Amount:      ${result.amount} USDC -> USDCx`);
    console.log(`   Recipient:   ${result.recipient}`);
    console.log(`\n⏱️  USDCx will arrive in ~15 minutes on ${network}`);
  } catch (error) {
    console.error(`\n❌ Deposit failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function handleWithdraw(options: Record<string, string>) {
  const amount = options.amount;
  const recipient = options.recipient;
  
  if (!amount || !recipient) {
    console.error('❌ Error: --amount and --recipient are required');
    console.log('Example: npx ts-node scripts/bridge-cli.ts withdraw --amount 10 --recipient 0x...');
    process.exit(1);
  }
  
  if (!process.env.STACKS_PRIVATE_KEY) {
    console.error('❌ Error: STACKS_PRIVATE_KEY environment variable is required');
    process.exit(1);
  }
  
  // Convert to micro USDCx
  const microAmount = Math.floor(parseFloat(amount) * 1_000_000);
  
  console.log(`\n🌉 Bridging ${amount} USDCx from Stacks to Ethereum...\n`);
  
  try {
    const result = await withdrawUSDCxToEthereum(
      {
        network,
        stacksPrivateKey: process.env.STACKS_PRIVATE_KEY,
      },
      {
        amount: microAmount,
        ethereumRecipient: recipient,
      }
    );
    
    console.log(`\n✅ Withdrawal initiated successfully!`);
    console.log(`   TX ID:     ${result.txId}`);
    console.log(`   Amount:    ${result.amount / 1_000_000} USDCx -> USDC`);
    console.log(`   Recipient: ${result.recipient}`);
    console.log(`\n⏱️  USDC will arrive in ~${network === 'testnet' ? '25' : '60'} minutes`);
  } catch (error) {
    console.error(`\n❌ Withdrawal failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function handleBalance(options: Record<string, string>) {
  const stacksAddress = options.stacks;
  const ethereumAddress = options.ethereum;
  
  if (!stacksAddress && !ethereumAddress) {
    console.error('❌ Error: At least one of --stacks or --ethereum is required');
    process.exit(1);
  }
  
  console.log(`\n💰 Checking balances on ${network}...\n`);
  
  try {
    if (stacksAddress) {
      const usdcxBalance = await getUSDCxBalance(network, stacksAddress);
      console.log(`Stacks (${stacksAddress}):`);
      console.log(`  USDCx: ${formatUSDCx(usdcxBalance)} USDCx`);
    }
    
    if (ethereumAddress) {
      const usdcBalance = await getEthereumUSDCBalance(
        network,
        ethereumAddress,
        process.env.ETHEREUM_RPC_URL
      );
      console.log(`Ethereum (${ethereumAddress}):`);
      console.log(`  USDC: ${formatUSDCx(usdcBalance)} USDC`);
    }
  } catch (error) {
    console.error(`\n❌ Balance check failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const options = parseArgs(args);
  
  switch (command) {
    case 'deposit':
      await handleDeposit(options);
      break;
    case 'withdraw':
      await handleWithdraw(options);
      break;
    case 'balance':
      await handleBalance(options);
      break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      printUsage();
      break;
    default:
      console.error(`❌ Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
