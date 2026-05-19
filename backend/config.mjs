export const PORT = Number(process.env.PORT || 4000);
export const HOST = process.env.HOST || '0.0.0.0';
export const NETWORK = process.env.NETWORK || 'testnet';
export const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS ||
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  'ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY';
export const CONTRACT_NAME =
  process.env.CONTRACT_NAME ||
  process.env.NEXT_PUBLIC_CONTRACT_NAME ||
  'predictionmarketv7';
export const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PLATFORM_FEE_MICRO = Number(process.env.PLATFORM_FEE_MICRO || 10_000);
export const PINATA_API_KEY = process.env.PINATA_API_KEY;
export const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
export const USE_DB_ADAPTER = process.env.USE_DB_ADAPTER === 'true';
