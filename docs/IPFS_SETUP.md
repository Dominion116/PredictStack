# IPFS Image Upload Setup Guide

This guide explains how to set up image uploads for PredictStack using IPFS and Pinata.

## What is IPFS?

**IPFS (InterPlanetary File System)** is a decentralized storage protocol. Instead of storing files on a single server, IPFS distributes them across a network of nodes. This means:

- **Permanent Storage**: Once uploaded, files can't be easily deleted or censored
- **Content Addressing**: Files are identified by their content hash, not location
- **Decentralized**: No single point of failure
- **Web3 Native**: Perfect for blockchain applications

## What is Pinata?

**Pinata** is an IPFS pinning service that makes it easy to upload and manage files on IPFS. While anyone can run an IPFS node, Pinata handles the infrastructure for you and ensures your files stay available.

## Setup Instructions

### Step 1: Create a Pinata Account

1. Go to [https://app.pinata.cloud/](https://app.pinata.cloud/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### Step 2: Create API Keys

1. Log in to your Pinata dashboard
2. Click on **"API Keys"** in the left sidebar
3. Click **"New Key"** button
4. Configure your key:
   - **Name**: `PredictStack` (or any name you like)
   - **Permissions**: Enable `pinFileToIPFS`
5. Click **"Create Key"**
6. **IMPORTANT**: Copy both the **API Key** and **Secret Key** immediately. The secret key is only shown once!

### Step 3: Configure Your Environment

1. Navigate to the `frontend` folder
2. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
3. Open `.env.local` and fill in your Pinata credentials:
   ```
   NEXT_PUBLIC_PINATA_API_KEY=your_api_key_here
   NEXT_PUBLIC_PINATA_SECRET_KEY=your_secret_key_here
   ```
4. Save the file

### Step 4: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C) then:
npm run dev
```

## How It Works

When an admin uploads an image on the Create Market page:

1. **File Selected**: User picks an image from their computer
2. **Validation**: We check the file is under 2MB
3. **Preview**: A local preview is shown immediately
4. **Upload**: The file is sent to Pinata's API
5. **Pin**: Pinata stores the file on IPFS and returns a hash
6. **URL Generated**: We create a URL like `https://gateway.pinata.cloud/ipfs/QmXyz...`
7. **Stored on Chain**: This URL is saved in the Stacks smart contract

## Free Tier Limits

Pinata's free tier includes:
- **1 GB** storage
- **100 files** (pins)
- **Unlimited bandwidth**

This is more than enough for most prediction market platforms. A typical market image is 50-200KB, so you can store thousands of markets on the free tier.

## Fallback Behavior

If Pinata API keys are not configured, the system will:
1. Still show a local preview of the image
2. Use a placeholder image URL instead of IPFS
3. Display a success message (for demo purposes)

This allows you to test the UI without setting up Pinata.

## Troubleshooting

### "Failed to upload image"
- Check your API keys are correct in `.env.local`
- Ensure the file is under 2MB
- Check your Pinata dashboard for rate limits

### Image not showing
- Wait a few seconds - IPFS propagation can take time
- Try a different gateway in the URL:
  - `https://gateway.pinata.cloud/ipfs/...`
  - `https://ipfs.io/ipfs/...`
  - `https://cloudflare-ipfs.com/ipfs/...`

### API Key errors
- Make sure you enabled `pinFileToIPFS` permission
- Check there are no extra spaces in your `.env.local`
- Restart the dev server after changing env vars

## Alternative: Cloudinary

If you prefer a more traditional CDN approach, you can use Cloudinary instead:

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get your cloud name, API key, and secret
3. Modify `frontend/src/lib/pinata.ts` to use Cloudinary's upload API

However, Pinata/IPFS is recommended for Web3 applications as it's more aligned with decentralization principles.

## Security Notes

- **Never commit `.env.local`** to version control
- API keys are exposed to the client (via NEXT_PUBLIC prefix)
- This is acceptable for Pinata as the keys only allow uploads
- For production, consider using a backend API to hide credentials

## Next Steps

Once configured, you can:
1. Go to `/create` (as admin)
2. Click the upload area
3. Select an image
4. See it uploaded to IPFS
5. Create your market with the permanent image!
