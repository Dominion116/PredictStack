
import { AppConfig, UserSession } from '@stacks/connect';

export const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

/**
 * Safely check if user is signed in, handling session data version errors
 */
export const isUserSignedIn = (): boolean => {
  try {
    return userSession.isUserSignedIn();
  } catch (error) {
    console.error('Session error:', error);
    // Clear invalid session data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('blockstack-session');
      localStorage.removeItem('stacks-session');
    }
    return false;
  }
};

export const APP_DETAILS = {
  name: 'PredictStack',
  icon: typeof window !== 'undefined' ? `${window.location.origin}/icon.png` : '/icon.png',
};

// Contract Configuration
const DEPLOYER_TESTNET = 'ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY'; // Updated to your wallet address
const DEPLOYER_MAINNET = 'SP...'; // To be filled

export const NETWORK_ENV = process.env.NEXT_PUBLIC_NETWORK || 'testnet'; // Default to testnet

export const CONTRACTS = {
  testnet: {
    deployer: DEPLOYER_TESTNET,
    predictionMarket: 'prediction-market-v3',
    usdcx: `${DEPLOYER_TESTNET}.usdcx-v1`, 
    sip010Trait: 'sip010-trait-v1',
  },
  mainnet: {
    deployer: DEPLOYER_MAINNET,
    predictionMarket: 'prediction-market-v3',
    usdcx: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
    sip010Trait: 'sip010-trait',
  },
  devnet: {
    deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    predictionMarket: 'prediction-market-v3',
    usdcx: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx',
    sip010Trait: 'sip010-trait',
  }
};

export const getContractConfig = () => {
    return CONTRACTS[NETWORK_ENV as keyof typeof CONTRACTS] || CONTRACTS.testnet;
}
