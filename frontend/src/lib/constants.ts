
import { AppConfig, UserSession } from '@stacks/connect';

export const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

export const APP_DETAILS = {
  name: 'PredictStack',
  icon: typeof window !== 'undefined' ? `${window.location.origin}/icon.png` : '/icon.png',
};

// Contract Configuration
const DEPLOYER_TESTNET = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Default/Placeholder
const DEPLOYER_MAINNET = 'SP...'; // To be filled

export const NETWORK_ENV = process.env.NEXT_PUBLIC_NETWORK || 'testnet'; // Default to testnet

export const CONTRACTS = {
  testnet: {
    deployer: DEPLOYER_TESTNET,
    predictionMarket: 'prediction-market',
    // The official USDCx token address on Testnet (update if changed)
    usdcx: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx', 
    usdcxBridge: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1',
  },
  mainnet: {
    deployer: DEPLOYER_MAINNET,
    predictionMarket: 'prediction-market',
    usdcx: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
    usdcxBridge: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx-v1',
  },
  devnet: {
    deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    predictionMarket: 'prediction-market',
    usdcx: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.mock-usdcx', // Might not exist if deleted
    usdcxBridge: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bridge-mock',
  }
};

export const getContractConfig = () => {
    return CONTRACTS[NETWORK_ENV as keyof typeof CONTRACTS] || CONTRACTS.testnet;
}
