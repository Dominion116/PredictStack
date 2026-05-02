
import { AppConfig, UserSession } from '@stacks/connect-react';

export const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

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

export const NETWORK_ENV = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY';
const CONTRACT_NAME = process.env.NEXT_PUBLIC_CONTRACT_NAME || 'predictionmarketv7';

export const CONTRACTS = {
  testnet: {
    deployer: CONTRACT_ADDRESS,
    predictionMarket: CONTRACT_NAME,
  },
  mainnet: {
    deployer: CONTRACT_ADDRESS,
    predictionMarket: CONTRACT_NAME,
  },
  devnet: {
    deployer: CONTRACT_ADDRESS,
    predictionMarket: CONTRACT_NAME,
  }
};

export const getContractConfig = () => {
  return CONTRACTS[NETWORK_ENV as keyof typeof CONTRACTS] || CONTRACTS.testnet;
};
