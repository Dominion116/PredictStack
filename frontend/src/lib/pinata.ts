import { BACKEND_BASE_URL } from './constants';

export interface PinataResponse {
  success: boolean;
  ipfsHash?: string;
  ipfsUrl?: string;
  error?: string;
}

export async function uploadToPinata(file: File, name?: string): Promise<PinataResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pinataMetadata', JSON.stringify({
      name: name || file.name,
      keyvalues: { platform: 'PredictStack', uploadedAt: new Date().toISOString() },
    }));
    formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    const response = await fetch(`${BACKEND_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Upload failed' }));
      return { success: false, error: err.error || 'Upload failed' };
    }

    const data = await response.json();
    return { success: true, ipfsHash: data.ipfsHash, ipfsUrl: data.ipfsUrl };
  } catch (error: any) {
    console.error('Upload error:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}

export const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
];

export function getIpfsUrl(hash: string, gatewayIndex: number = 0): string {
  return `${IPFS_GATEWAYS[gatewayIndex]}${hash}`;
}
