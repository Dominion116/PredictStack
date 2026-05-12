import { sendJson } from '../middleware/http.mjs';

export function createUploadRoutes({ config }) {
  return {
    async upload(req, res) {
      if (!config.PINATA_API_KEY || !config.PINATA_SECRET_KEY) {
        return sendJson(res, 503, { error: 'IPFS upload not configured on server' });
      }

      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        return sendJson(res, 400, { error: 'Content-Type must be multipart/form-data' });
      }

      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);

      const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'pinata_api_key': config.PINATA_API_KEY,
          'pinata_secret_api_key': config.PINATA_SECRET_KEY,
        },
        body,
      });

      if (!pinataRes.ok) {
        const err = await pinataRes.json().catch(() => ({ message: 'Pinata upload failed' }));
        return sendJson(res, pinataRes.status, { error: err.message || 'Pinata upload failed' });
      }

      const data = await pinataRes.json();
      return sendJson(res, 200, {
        ipfsHash: data.IpfsHash,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      });
    },
  };
}
