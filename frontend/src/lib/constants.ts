
import { AppConfig, UserSession } from '@stacks/connect';
import {
  AppConfig as ReactAppConfig,
  UserSession as ReactUserSession,
} from '@stacks/connect-react';

export const appConfig = new ReactAppConfig(['store_write', 'publish_data']);
export const userSession = new ReactUserSession({ appConfig });

/**
 * Safely check if user is signed in, handling session data version errors
 */
export function isUserSignedIn(): boolean {
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
}

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
    predictionMarket: 'predictionmarketv7',
  },
  mainnet: {
    deployer: DEPLOYER_MAINNET,
    predictionMarket: 'prediction-market-v3',
  },
  devnet: {
    deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    predictionMarket: 'prediction-market-v4',
  }
};

export const getContractConfig = () => {
    return CONTRACTS[NETWORK_ENV as keyof typeof CONTRACTS] || CONTRACTS.testnet;
}
