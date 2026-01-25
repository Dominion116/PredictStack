import { generateWallet, getStxAddress } from '@stacks/wallet-sdk';

const mnemonic = process.argv[2];

if (!mnemonic) {
    console.error('Usage: npx tsx scripts/derive-key.ts "your 24 word mnemonic"');
    process.exit(1);
}

async function main() {
    const wallet = await generateWallet({
        secretKey: mnemonic,
        password: '',
    });

    const account = wallet.accounts[0];
    // Use testnet transaction version (0x80)
    const testnetAddress = getStxAddress({ account, transactionVersion: 0x80 });
    
    console.log('\n=== Stacks Wallet Info ===');
    console.log('Testnet Address:', testnetAddress);
    console.log('Private Key:', account.stxPrivateKey);
    console.log('\nAdd this to your .env file:');
    console.log(`STACKS_PRIVATE_KEY=${account.stxPrivateKey}`);
}

main().catch(console.error);

