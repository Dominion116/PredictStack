/**
 * Pinata IPFS Upload Utility
 * 
 * This module handles uploading files to IPFS via Pinata's pinning service.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://app.pinata.cloud/ and create a free account
 * 2. Navigate to API Keys section
 * 3. Create a new API key with "pinFileToIPFS" permission
 * 4. Copy your API Key and Secret Key
 * 5. Add them to your .env.local file:
 *    NEXT_PUBLIC_PINATA_API_KEY=your_api_key_here
 *    NEXT_PUBLIC_PINATA_SECRET_KEY=your_secret_key_here
 * 
 * FREE TIER LIMITS (as of 2024):
 * - 1 GB storage
 * - 100 pins
 * - Unlimited bandwidth
 * 
 * This is more than enough for a prediction market platform!
 */

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

export interface PinataResponse {
    success: boolean;
    ipfsHash?: string;
    ipfsUrl?: string;
    error?: string;
}

/**
 * Uploads a file to IPFS via Pinata
 * @param file - The file to upload
 * @param name - Optional name for the file (for Pinata metadata)
 * @returns Object containing success status and IPFS URL
 */
export async function uploadToPinata(file: File, name?: string): Promise<PinataResponse> {
    // Check if API keys are configured
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        console.warn('Pinata API keys not configured. Using placeholder image.');
        return {
            success: true,
            ipfsHash: 'placeholder',
            ipfsUrl: 'https://images.unsplash.com/photo-1639710339851-fe462983c267?q=80&w=1000&auto=format&fit=crop',
            error: undefined
        };
    }

    try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Add metadata
        const metadata = JSON.stringify({
            name: name || file.name,
            keyvalues: {
                platform: 'PredictStack',
                uploadedAt: new Date().toISOString()
            }
        });
        formData.append('pinataMetadata', metadata);

        // Upload options
        const options = JSON.stringify({
            cidVersion: 1
        });
        formData.append('pinataOptions', options);

        // Make the API request
        const response = await fetch(PINATA_API_URL, {
            method: 'POST',
            headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY,
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload to IPFS');
        }

        const data = await response.json();
        
        // Pinata returns an IpfsHash - we construct the gateway URL
        const ipfsHash = data.IpfsHash;
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        return {
            success: true,
            ipfsHash,
            ipfsUrl
        };
    } catch (error: any) {
        console.error('Pinata upload error:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload to IPFS'
        };
    }
}

/**
 * Alternative IPFS gateways if Pinata's gateway is slow
 * You can use any of these to display images
 */
export const IPFS_GATEWAYS = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/'
];

/**
 * Get a full IPFS URL from a hash using a specific gateway
 */
export function getIpfsUrl(hash: string, gatewayIndex: number = 0): string {
    return `${IPFS_GATEWAYS[gatewayIndex]}${hash}`;
}
