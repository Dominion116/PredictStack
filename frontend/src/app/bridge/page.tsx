'use client';

import { useState, useEffect } from 'react';
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConnect } from '@stacks/connect-react';
import { userSession, isUserSignedIn } from '@/lib/constants';
import { createWalletClient, custom, createPublicClient, http, formatUnits, parseUnits, type Hex } from 'viem';
import { BRIDGE_CONFIG, ERC20_ABI, X_RESERVE_ABI, encodeStacksAddressToBytes32, encodeEthAddressToBytes32 } from '@/lib/bridge-utils';
import { toast } from 'sonner';
import { AnchorMode, PostConditionMode, Pc, Cl } from '@stacks/transactions';
import { Loader2, ArrowRight, Droplet } from 'lucide-react';
import { Footer } from "@/components/footer";
import { getContractConfig } from '@/lib/constants';

// Default to testnet for now as per project setting
const CURRENT_NETWORK = 'testnet';
const CONFIG = BRIDGE_CONFIG[CURRENT_NETWORK];

export default function BridgePage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <main className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <div className="container py-12 flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </main>
        );
    }

    return <BridgeContent />;
}

function BridgeContent() {
  // Stacks State
  const { doContractCall } = useConnect();
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  
  // Ethereum State
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const [ethClient, setEthClient] = useState<any>(null);
  const [isConnectingEth, setIsConnectingEth] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);

  // Load Stacks User
  useEffect(() => {
      if (isUserSignedIn()) {
        setStacksAddress(userSession.loadUserData().profile.stxAddress.testnet);
      }
  }, []);

  // Connect Ethereum Wallet
  const connectEthWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      toast.error('Please install MetaMask or another Ethereum wallet');
      return;
    }
    
    try {
      setIsConnectingEth(true);
      const client = createWalletClient({
        chain: CONFIG.ethereumChain,
        transport: custom((window as any).ethereum)
      });
      
      const [address] = await client.requestAddresses();
      setEthAddress(address);
      setEthClient(client);
      
      // Switch chain if needed
      try {
        await client.switchChain({ id: CONFIG.ethereumChain.id });
      } catch (e) {
        console.error('Failed to switch chain', e);
      }
      
      toast.success('Ethereum wallet connected');
    } catch (error) {
      console.error(error);
      toast.error('Failed to connect Ethereum wallet');
    } finally {
      setIsConnectingEth(false);
    }
  };

  // Handle Deposit (ETH -> Stacks)
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ethAddress || !ethClient || !stacksAddress) return;
    
    try {
      setIsProcessing(true);
      const value = parseUnits(amount, 6); // USDC uses 6 decimals
      
      if (value < BigInt(CONFIG.minDeposit)) {
        toast.error(`Minimum deposit is ${formatUnits(BigInt(CONFIG.minDeposit), 6)} USDC`);
        setIsProcessing(false);
        return;
      }

      const publicClient = createPublicClient({ 
          chain: CONFIG.ethereumChain, 
          transport: http() 
      });

      // 1. Approve
      toast.info('Please approve USDC usage in your wallet...');
      const { request: approveRequest } = await publicClient.simulateContract({
        address: CONFIG.ethUsdcContract as Hex,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONFIG.xReserveContract as Hex, value],
        account: ethAddress as Hex,
      });
      const approveHash = await ethClient.writeContract(approveRequest);
      toast.info('Approval submitted, waiting for confirmation...');
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      toast.success('USDC Approved!');

      // 2. Deposit
      toast.info('Confirm deposit transaction...');
      const remoteRecipient = encodeStacksAddressToBytes32(stacksAddress);
      
      // hookData must be empty bytes, not string
      const hookData: Hex = '0x';
      
      const { request: depositRequest } = await publicClient.simulateContract({
        address: CONFIG.xReserveContract as Hex,
        abi: X_RESERVE_ABI,
        functionName: 'depositToRemote',
        args: [
            value, 
            CONFIG.stacksDomain, 
            remoteRecipient, 
            CONFIG.ethUsdcContract as Hex, 
            BigInt(0), // maxFee
            hookData
        ],
        account: ethAddress as Hex,
      });
      const depositHash = await ethClient.writeContract(depositRequest);
      
      toast.success(`Deposit submitted! Tx: ${depositHash.slice(0, 10)}...`);
      toast.info('It takes ~15 mins for USDCx to arrive on Stacks.');
      setAmount('');
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.shortMessage || error.message || 'Deposit failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Withdraw (Stacks -> ETH)
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stacksAddress || !ethAddress) return;

    try {
      setIsProcessing(true);
      const value = parseUnits(amount, 6);
      
      if (value < BigInt(CONFIG.minWithdraw)) {
        toast.error(`Minimum withdrawal is ${formatUnits(BigInt(CONFIG.minWithdraw), 6)} USDCx`);
        setIsProcessing(false);
        return;
      }

      const [contractAddr, contractName] = CONFIG.usdcxBridge.split('.');
      const [tokenAddr, tokenName] = CONFIG.usdcxToken.split('.');
      const recipientBuffer = encodeEthAddressToBytes32(ethAddress);

      // Post-condition: User transfers exactly 'value' of USDCx
      // Convert BigInt to Number for Pc helper (safe for amounts < 2^53)
      const valueAsNumber = Number(value);
      const postCondition = Pc.principal(stacksAddress)
        .willSendEq(valueAsNumber)
        .ft(`${tokenAddr}.${tokenName}`, 'usdcx');

      await doContractCall({
        contractAddress: contractAddr,
        contractName: contractName,
        functionName: 'burn',
        functionArgs: [
            Cl.uint(value),
            Cl.uint(0), // Ethereum Domain ID is 0
            Cl.buffer(recipientBuffer)
        ],
        postConditions: [postCondition],
        postConditionMode: PostConditionMode.Deny,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
            toast.success('Withdrawal submitted!');
            toast.info(`TxID: ${data.txId}`);
            setAmount('');
            setIsProcessing(false);
        },
        onCancel: () => {
            setIsProcessing(false);
        }
      });
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Withdrawal failed');
      setIsProcessing(false);
    }
  };

  // Handle USDCx Faucet (Testnet only)
  const handleFaucet = async () => {
    if (!stacksAddress) {
      toast.error('Please connect your Stacks wallet first');
      return;
    }

    setIsFaucetLoading(true);
    try {
      const config = getContractConfig();
      const [tokenAddr, tokenName] = config.usdcx.split('.');

      await doContractCall({
        contractAddress: tokenAddr,
        contractName: tokenName,
        functionName: 'faucet',
        functionArgs: [],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          toast.success('Faucet request submitted!');
          toast.info(`You'll receive 10,000 USDCx. TxID: ${data.txId.slice(0, 10)}...`);
          setIsFaucetLoading(false);
        },
        onCancel: () => {
          setIsFaucetLoading(false);
        }
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Faucet request failed');
      setIsFaucetLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="container py-12 flex-1 flex flex-col items-center">
        <div className="mb-8 max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Bridge USDC</h1>
            <p className="text-muted-foreground">
                Move USDC between Ethereum Sepolia and Stacks Testnet. Powered by Circle's Cross-Chain Transfer Protocol (CCTP).
            </p>
        </div>

        <Card className="w-full max-w-2xl shadow-lg border-muted">
            <Tabs defaultValue="deposit" className="w-full">
                <div className="px-8 pt-8">
                    <TabsList className="grid w-full grid-cols-2 h-12">
                        <TabsTrigger value="deposit" className="h-10">Deposit (ETH to Stacks)</TabsTrigger>
                        <TabsTrigger value="withdraw" className="h-10">Withdraw (Stacks to ETH)</TabsTrigger>
                    </TabsList>
                </div>
                
                {/* DEPOSIT TAB */}
                <TabsContent value="deposit">
                    <CardContent className="space-y-8 p-8">
                        <div className="space-y-2">
                            <Label>From (Ethereum Sepolia)</Label>
                            {ethAddress ? (
                                <div className="p-4 bg-secondary/50 rounded-md font-mono text-xs break-all border">
                                    {ethAddress}
                                </div>
                            ) : (
                                <Button 
                                    variant="outline" 
                                    className="w-full" 
                                    onClick={connectEthWallet}
                                    disabled={isConnectingEth}
                                >
                                    {isConnectingEth ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Connect MetaMask
                                </Button>
                            )}
                        </div>
                        
                        <div className="flex justify-center">
                            <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
                        </div>

                        <div className="space-y-2">
                            <Label>To (Stacks Testnet)</Label>
                            {stacksAddress ? (
                                <div className="p-4 bg-secondary/50 rounded-md font-mono text-xs break-all border">
                                    {stacksAddress}
                                </div>
                            ) : (
                                <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20 text-center">
                                    Please sign in with Stacks Wallet (top right)
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount-dep">Amount (USDC)</Label>
                            <Input 
                                id="amount-dep" 
                                placeholder="0.00" 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <Button 
                            className="w-full" 
                            size="lg" 
                            onClick={handleDeposit}
                            disabled={!ethAddress || !stacksAddress || isProcessing || !amount}
                        >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isProcessing ? 'Processing...' : 'Deposit to Stacks'}
                        </Button>
                    </CardContent>
                </TabsContent>

                {/* WITHDRAW TAB */}
                <TabsContent value="withdraw">
                    <CardContent className="space-y-8 p-8">
                         <div className="space-y-2">
                            <Label>From (Stacks Testnet)</Label>
                            {stacksAddress ? (
                                <div className="p-4 bg-secondary/50 rounded-md font-mono text-xs break-all border">
                                    {stacksAddress}
                                </div>
                            ) : (
                                <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20 text-center">
                                    Please sign in with Stacks Wallet
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center">
                            <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
                        </div>

                        <div className="space-y-2">
                            <Label>To (Ethereum Sepolia)</Label>
                            {ethAddress ? (
                                <div className="p-4 bg-secondary/50 rounded-md font-mono text-xs break-all border">
                                    {ethAddress}
                                </div>
                            ) : (
                                <Button 
                                    variant="outline" 
                                    className="w-full" 
                                    onClick={connectEthWallet}
                                >
                                    Connect MetaMask (Destination)
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount-with">Amount (USDCx)</Label>
                            <Input 
                                id="amount-with" 
                                placeholder="0.00" 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                         <Button 
                            className="w-full" 
                            size="lg" 
                            onClick={handleWithdraw}
                            disabled={!ethAddress || !stacksAddress || isProcessing || !amount}
                        >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isProcessing ? 'Burning...' : 'Withdraw to Ethereum'}
                        </Button>
                    </CardContent>
                </TabsContent>
            </Tabs>
        </Card>

        {/* Testnet Faucet Card */}
        <Card className="w-full max-w-2xl mt-6 border-primary/20 bg-primary/5">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Droplet className="h-5 w-5 text-primary" />
                    Testnet USDCx Faucet
                </CardTitle>
                <CardDescription>
                    Get free test tokens to try out the platform. Mints 10,000 USDCx to your wallet.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleFaucet}
                    disabled={!stacksAddress || isFaucetLoading}
                >
                    {isFaucetLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Requesting...
                        </>
                    ) : (
                        <>
                            <Droplet className="mr-2 h-4 w-4" />
                            Get 10,000 USDCx
                        </>
                    )}
                </Button>
                {!stacksAddress && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        Connect your Stacks wallet first
                    </p>
                )}
            </CardContent>
        </Card>

        <p className="mt-8 text-sm text-muted-foreground">
            Note: This is a Testnet bridge. Do not use real Mainnet USDC. Get Sepolia ETH and Testnet USDC from faucets before starting.
        </p>
      </div>
      <Footer />
    </main>
  );
}

