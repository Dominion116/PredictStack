
import { type Hex } from 'viem';
import { c32addressDecode } from 'c32check';
import { mainnet, sepolia } from 'viem/chains';

// Contract Addresses & Configuration
export const BRIDGE_CONFIG = {
  testnet: {
    // Stacks
    usdcxToken: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx',
    usdcxBridge: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1',
    // Ethereum (Sepolia)
    ethUsdcContract: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    xReserveContract: '0x008888878f94C0d87defdf0B07f46B93C1934442',
    // Chain
    ethereumChain: sepolia,
    stacksDomain: 10003,
    minDeposit: 1_000_000, // 1 USDC
    minWithdraw: 4_800_000, // 4.80 USDCx
  },
  mainnet: {
     // Stacks
    usdcxToken: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
    usdcxBridge: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx-v1',
    // Ethereum (Mainnet)
    ethUsdcContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    xReserveContract: '0x8888888199b2Df864bf678259607d6D5EBb4e3Ce',
    // Chain
    ethereumChain: mainnet,
    stacksDomain: 10003,
    minDeposit: 10_000_000, // 10 USDC
    minWithdraw: 4_800_000, // 4.80 USDCx
  }
};

// ABIs
export const X_RESERVE_ABI = [
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

export const ERC20_ABI = [
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
] as const;

// Helpers
export function encodeStacksAddressToBytes32(stacksAddress: string): Hex {
  try {
    const [version, hash160] = c32addressDecode(stacksAddress);
    const buffer = new Uint8Array(32);
    buffer[11] = version;
    const hashBytes = Buffer.from(hash160, 'hex');
    buffer.set(hashBytes, 12);
    return `0x${Buffer.from(buffer).toString('hex')}` as Hex;
  } catch (error) {
    console.error(error);
    throw new Error(`Invalid Stacks address: ${stacksAddress}`);
  }
}

export function encodeEthAddressToBytes32(ethAddress: string): Uint8Array {
  const cleanAddress = ethAddress.replace('0x', '');
  if (cleanAddress.length !== 40) throw new Error(`Invalid Ethereum address`);
  const padded = cleanAddress.padStart(64, '0');
  return Buffer.from(padded, 'hex');
}
