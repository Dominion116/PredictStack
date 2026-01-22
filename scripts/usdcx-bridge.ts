/**
 * PredictStack - USDCx Bridging Integration
 * 
 * This module provides helpers for bridging USDC from Ethereum to Stacks (USDCx)
 * Based on Circle's xReserve protocol and Stacks attestation service
 * 
 * Documentation: https://docs.stacks.co/more-guides/bridging-usdcx
 */

import { createWalletClient, createPublicClient, http, parseUnits, pad, formatUnits, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia, mainnet } from 'viem/chains';
import { c32addressDecode } from 'c32check';
import {
  makeContractCall,
  Cl,
  Pc,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
} from '@stacks/transactions';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface USDCxConfig {
  network: 'testnet' | 'mainnet';
  ethereumRpcUrl?: string;
  ethereumPrivateKey?: string;
  stacksPrivateKey?: string;
}

export const NETWORK_CONFIG = {
  testnet: {
    // Stacks contracts
    usdcxToken: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx',
    usdcxBridge: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1',
    // Ethereum contracts (Sepolia)
    ethUsdcContract: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    xReserveContract: '0x008888878f94C0d87defdf0B07f46B93C1934442',
    // Chain config
    ethereumChain: sepolia,
    stacksNetwork: 'testnet' as const,
    // Domain IDs
    stacksDomain: 10003,
    ethereumDomain: 0,
    // Minimums
    minDeposit: 1_000_000, // 1 USDC
    minWithdraw: 4_800_000, // 4.80 USDCx
  },
  mainnet: {
    // Stacks contracts
    usdcxToken: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
    usdcxBridge: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx-v1',
    // Ethereum contracts
    ethUsdcContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    xReserveContract: '0x8888888199b2Df864bf678259607d6D5EBb4e3Ce',
    // Chain config
    ethereumChain: mainnet,
    stacksNetwork: 'mainnet' as const,
    // Domain IDs
    stacksDomain: 10003,
    ethereumDomain: 0,
    // Minimums
    minDeposit: 10_000_000, // 10 USDC
    minWithdraw: 4_800_000, // 4.80 USDCx
  },
};

// ============================================================================
// CONTRACT ABIs
// ============================================================================

const X_RESERVE_ABI = [
  {
    name: 'depositToRemote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'value', type: 'uint256' },
      { name: 'remoteDomain', type: 'uint32' },
      { name: 'remoteRecipient', type: 'bytes32' },
      { name: 'localToken', type: 'address' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'hookData', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: 'remaining', type: 'uint256' }],
  },
] as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Encode a Stacks address to bytes32 format for Ethereum contracts
 * This is required for cross-chain messaging via xReserve
 */
export function encodeStacksAddressToBytes32(stacksAddress: string): Hex {
  try {
    const [version, hash160] = c32addressDecode(stacksAddress);
    
    // Create 32-byte buffer:
    // - 11 zero bytes (left padding)
    // - 1 byte for version
    // - 20 bytes for hash160
    const buffer = new Uint8Array(32);
    buffer[11] = version;
    
    // Convert hex string to bytes
    const hashBytes = Buffer.from(hash160, 'hex');
    buffer.set(hashBytes, 12);
    
    return `0x${Buffer.from(buffer).toString('hex')}` as Hex;
  } catch (error) {
    throw new Error(`Invalid Stacks address: ${stacksAddress}`);
  }
}

/**
 * Encode an Ethereum address to bytes32 format for Stacks contracts
 * Pads the 20-byte address to 32 bytes (left-padded with zeros)
 */
export function encodeEthAddressToBytes32(ethAddress: string): Buffer {
  const cleanAddress = ethAddress.replace('0x', '');
  if (cleanAddress.length !== 40) {
    throw new Error(`Invalid Ethereum address: ${ethAddress}`);
  }
  
  // Left-pad to 32 bytes
  const padded = cleanAddress.padStart(64, '0');
  return Buffer.from(padded, 'hex');
}

/**
 * Format USDCx amount for display (6 decimals)
 */
export function formatUSDCx(amount: bigint | number): string {
  const value = typeof amount === 'bigint' ? amount : BigInt(amount);
  return formatUnits(value, 6);
}

/**
 * Parse USDCx amount from string to micro units
 */
export function parseUSDCx(amount: string): bigint {
  return parseUnits(amount, 6);
}

// ============================================================================
// DEPOSIT (Ethereum -> Stacks)
// ============================================================================

export interface DepositParams {
  amount: string; // Amount in USDC (e.g., "10.00")
  stacksRecipient: string; // Stacks address to receive USDCx
  maxFee?: string; // Maximum fee in USDC (default: "0")
}

export interface DepositResult {
  approvalTxHash: string;
  depositTxHash: string;
  amount: string;
  recipient: string;
}

/**
 * Deposit USDC from Ethereum to receive USDCx on Stacks
 * 
 * Process:
 * 1. Approve xReserve to spend USDC
 * 2. Call depositToRemote on xReserve
 * 3. Wait for Stacks attestation service to mint USDCx (~15 min on testnet)
 */
export async function depositUSDCToStacks(
  config: USDCxConfig,
  params: DepositParams
): Promise<DepositResult> {
  const networkConfig = NETWORK_CONFIG[config.network];
  
  if (!config.ethereumPrivateKey) {
    throw new Error('Ethereum private key is required for deposits');
  }
  
  const rpcUrl = config.ethereumRpcUrl || 
    (config.network === 'testnet' 
      ? 'https://ethereum-sepolia.publicnode.com'
      : 'https://eth.llamarpc.com');
  
  // Setup clients
  const account = privateKeyToAccount(config.ethereumPrivateKey as Hex);
  
  const walletClient = createWalletClient({
    account,
    chain: networkConfig.ethereumChain,
    transport: http(rpcUrl),
  });
  
  const publicClient = createPublicClient({
    chain: networkConfig.ethereumChain,
    transport: http(rpcUrl),
  });
  
  console.log(`📤 Initiating deposit from Ethereum ${account.address}`);
  
  // Parse amounts
  const value = parseUnits(params.amount, 6);
  const maxFee = parseUnits(params.maxFee || '0', 6);
  
  // Validate minimum
  if (value < BigInt(networkConfig.minDeposit)) {
    throw new Error(`Minimum deposit is ${networkConfig.minDeposit / 1_000_000} USDC`);
  }
  
  // Check ETH balance for gas
  const ethBalance = await publicClient.getBalance({ address: account.address });
  if (ethBalance === 0n) {
    throw new Error('Insufficient ETH balance for gas fees');
  }
  console.log(`💰 ETH balance: ${formatUnits(ethBalance, 18)} ETH`);
  
  // Check USDC balance
  const usdcBalance = await publicClient.readContract({
    address: networkConfig.ethUsdcContract as Hex,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  
  console.log(`💵 USDC balance: ${formatUnits(usdcBalance, 6)} USDC`);
  
  if (usdcBalance < value) {
    throw new Error(`Insufficient USDC balance. Required: ${params.amount} USDC`);
  }
  
  // Encode recipient
  const remoteRecipient = encodeStacksAddressToBytes32(params.stacksRecipient);
  console.log(`📍 Stacks recipient: ${params.stacksRecipient}`);
  
  // Step 1: Approve xReserve to spend USDC
  console.log('⏳ Approving xReserve to spend USDC...');
  
  const approvalTxHash = await walletClient.writeContract({
    address: networkConfig.ethUsdcContract as Hex,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [networkConfig.xReserveContract as Hex, value],
  });
  
  console.log(`📝 Approval tx: ${approvalTxHash}`);
  await publicClient.waitForTransactionReceipt({ hash: approvalTxHash });
  console.log('✅ Approval confirmed');
  
  // Step 2: Deposit to Stacks
  console.log('⏳ Executing deposit to Stacks...');
  
  const depositTxHash = await walletClient.writeContract({
    address: networkConfig.xReserveContract as Hex,
    abi: X_RESERVE_ABI,
    functionName: 'depositToRemote',
    args: [
      value,
      networkConfig.stacksDomain,
      remoteRecipient,
      networkConfig.ethUsdcContract as Hex,
      maxFee,
      '0x', // Empty hookData
    ],
  });
  
  console.log(`📝 Deposit tx: ${depositTxHash}`);
  console.log('✅ Deposit submitted!');
  console.log(`⏱️ USDCx will be minted on Stacks in ~15 minutes`);
  console.log(`🔗 Track on Etherscan: https://${config.network === 'testnet' ? 'sepolia.' : ''}etherscan.io/tx/${depositTxHash}`);
  
  return {
    approvalTxHash,
    depositTxHash,
    amount: params.amount,
    recipient: params.stacksRecipient,
  };
}

// ============================================================================
// WITHDRAW (Stacks -> Ethereum)
// ============================================================================

export interface WithdrawParams {
  amount: number; // Amount in micro USDCx (6 decimals)
  ethereumRecipient: string; // Ethereum address to receive USDC
}

export interface WithdrawResult {
  txId: string;
  amount: number;
  recipient: string;
}

/**
 * Withdraw USDCx from Stacks to receive USDC on Ethereum
 * 
 * Process:
 * 1. Call burn on usdcx-v1 contract
 * 2. Stacks attestation service processes the burn
 * 3. xReserve releases USDC on Ethereum (~25 min on testnet, ~60 min on mainnet)
 */
export async function withdrawUSDCxToEthereum(
  config: USDCxConfig,
  params: WithdrawParams
): Promise<WithdrawResult> {
  const networkConfig = NETWORK_CONFIG[config.network];
  
  if (!config.stacksPrivateKey) {
    throw new Error('Stacks private key is required for withdrawals');
  }
  
  // Validate minimum
  if (params.amount < networkConfig.minWithdraw) {
    throw new Error(`Minimum withdrawal is ${networkConfig.minWithdraw / 1_000_000} USDCx`);
  }
  
  // Parse bridge contract address
  const [contractAddress, contractName] = networkConfig.usdcxBridge.split('.');
  const [tokenAddress, tokenName] = networkConfig.usdcxToken.split('.');
  
  // Encode Ethereum recipient to bytes32
  const recipientBuffer = encodeEthAddressToBytes32(params.ethereumRecipient);
  
  console.log(`📤 Initiating withdrawal of ${params.amount / 1_000_000} USDCx`);
  console.log(`📍 Ethereum recipient: ${params.ethereumRecipient}`);
  
  // Build function arguments
  const functionArgs = [
    Cl.uint(params.amount),
    Cl.uint(networkConfig.ethereumDomain),
    Cl.buffer(recipientBuffer),
  ];
  
  // Post condition: ensure the user sends exactly the specified amount
  const postCondition = Pc.principal(contractAddress)
    .willSendEq(params.amount)
    .ft(`${tokenAddress}.${tokenName}`, 'usdcx-token');
  
  // Build and broadcast transaction
  const transaction = await makeContractCall({
    contractAddress,
    contractName,
    functionName: 'burn',
    functionArgs,
    network: networkConfig.stacksNetwork,
    postConditions: [postCondition],
    postConditionMode: PostConditionMode.Deny,
    anchorMode: AnchorMode.Any,
    senderKey: config.stacksPrivateKey,
  });
  
  const result = await broadcastTransaction({ transaction, network: networkConfig.stacksNetwork });
  
  if ('error' in result) {
    throw new Error(`Broadcast failed: ${result.error}`);
  }
  
  const txId = result.txid;
  
  console.log(`📝 Withdrawal tx: ${txId}`);
  console.log('✅ Withdrawal submitted!');
  console.log(`⏱️ USDC will arrive on Ethereum in ~${config.network === 'testnet' ? '25' : '60'} minutes`);
  console.log(`🔗 Track on Hiro Explorer: https://explorer.hiro.so/txid/${txId}?chain=${config.network}`);
  
  return {
    txId,
    amount: params.amount,
    recipient: params.ethereumRecipient,
  };
}

// ============================================================================
// BALANCE CHECKS
// ============================================================================

/**
 * Get USDCx balance on Stacks
 */
export async function getUSDCxBalance(
  network: 'testnet' | 'mainnet',
  stacksAddress: string
): Promise<bigint> {
  const networkConfig = NETWORK_CONFIG[network];
  const [contractAddress, contractName] = networkConfig.usdcxToken.split('.');
  
  // Call get-balance read-only function
  const apiUrl = network === 'testnet'
    ? 'https://api.testnet.hiro.so'
    : 'https://api.mainnet.hiro.so';
  
  const response = await fetch(
    `${apiUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/get-balance`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: stacksAddress,
        arguments: [Cl.serialize(Cl.standardPrincipal(stacksAddress))],
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to get balance: ${response.statusText}`);
  }
  
  const data = await response.json();
  // Parse the result - it's a (response uint uint) type
  // The OK value is the balance
  return BigInt(data.result?.value?.value || 0);
}

/**
 * Get USDC balance on Ethereum
 */
export async function getEthereumUSDCBalance(
  network: 'testnet' | 'mainnet',
  ethereumAddress: string,
  rpcUrl?: string
): Promise<bigint> {
  const networkConfig = NETWORK_CONFIG[network];
  
  const defaultRpc = network === 'testnet'
    ? 'https://ethereum-sepolia.publicnode.com'
    : 'https://eth.llamarpc.com';
  
  const publicClient = createPublicClient({
    chain: networkConfig.ethereumChain,
    transport: http(rpcUrl || defaultRpc),
  });
  
  const balance = await publicClient.readContract({
    address: networkConfig.ethUsdcContract as Hex,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [ethereumAddress as Hex],
  });
  
  return balance;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  NETWORK_CONFIG,
  X_RESERVE_ABI,
  ERC20_ABI,
};
