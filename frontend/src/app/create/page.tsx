
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useConnect } from '@stacks/connect-react';
import { getContractConfig, userSession } from '@/lib/constants';
import { 
    stringAsciiCV, 
    uintCV, 
    someCV, 
    noneCV, 
    contractPrincipalCV, 
    PostConditionMode,
    AnchorMode
} from '@stacks/transactions';
import { toast } from 'sonner';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function CreateMarketPage() {
    const [mounted, setMounted] = useState(false);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        setMounted(true);
        if (userSession.isUserSignedIn()) {
            const userData = userSession.loadUserData();
            const userAddress = userData.profile.stxAddress.testnet; // Adjust for mainnet
            const config = getContractConfig();
            setIsAdmin(userAddress === config.deployer);
        } else {
            setIsAdmin(false);
        }
    }, []);

    if (!mounted) {
        return (
            <main className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <div className="container py-12 flex-1 flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </main>
        );
    }

    if (isAdmin === false) {
        return (
            <main className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <div className="container py-24 flex-1 flex flex-col items-center justify-center text-center">
                    <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
                    <h1 className="text-3xl font-bold mb-2">Unauthorized Access</h1>
                    <p className="text-muted-foreground max-w-md">
                        Only the platform administrator can create new prediction markets. 
                        Please connect the admin wallet to proceed.
                    </p>
                </div>
            </main>
        );
    }

    return <CreateMarketContent />;
}

function CreateMarketContent() {
    const { doContractCall } = useConnect();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form State
    const [question, setQuestion] = useState('');
    const [description, setDescription] = useState('');
    const [resolveDate, setResolveDate] = useState('');
    const [category, setCategory] = useState('Crypto');
    const [imageUrl, setImageUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Current block height (approximate - Stacks testnet)
    // In production, you'd fetch this from the API
    const CURRENT_BLOCK_HEIGHT = 3750000; // Approximate current block
    const SECONDS_PER_BLOCK = 600; // ~10 minutes per block on Stacks

    // Calculate estimated block height from date
    const estimatedBlock = useMemo(() => {
        if (!resolveDate) return 0;
        const targetTime = new Date(resolveDate).getTime();
        const now = Date.now();
        const secondsUntilResolve = Math.max(0, (targetTime - now) / 1000);
        const blocksUntilResolve = Math.ceil(secondsUntilResolve / SECONDS_PER_BLOCK);
        return CURRENT_BLOCK_HEIGHT + blocksUntilResolve;
    }, [resolveDate]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be less than 2MB');
            return;
        }

        // Show local preview immediately
        const localUrl = URL.createObjectURL(file);
        setPreviewUrl(localUrl);

        // Upload to IPFS via Pinata
        setIsUploading(true);
        try {
            const { uploadToPinata } = await import('@/lib/pinata');
            const result = await uploadToPinata(file, `market-image-${Date.now()}`);
            
            if (result.success && result.ipfsUrl) {
                setImageUrl(result.ipfsUrl);
                toast.success('Image uploaded to IPFS successfully!');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload image');
            // Keep the preview but clear the URL
            setImageUrl('');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const config = getContractConfig();

        if (!question || !resolveDate) {
            toast.error('Question and Resolution Date are required');
            return;
        }

        if (estimatedBlock <= CURRENT_BLOCK_HEIGHT) {
            toast.error('Resolution date must be in the future');
            return;
        }

        if (isUploading) {
            toast.error('Please wait for image upload to complete');
            return;
        }

        try {
            setIsSubmitting(true);
            
            const [tokenAddr, tokenName] = config.usdcx.split('.');

            await doContractCall({
                contractAddress: config.deployer,
                contractName: config.predictionMarket,
                functionName: 'create-market',
                functionArgs: [
                    stringAsciiCV(question),
                    description ? someCV(stringAsciiCV(description)) : noneCV(),
                    uintCV(estimatedBlock),
                    noneCV(), // No external ID
                    stringAsciiCV(category),
                    imageUrl ? someCV(stringAsciiCV(imageUrl)) : noneCV(),
                    contractPrincipalCV(tokenAddr, tokenName)
                ],
                postConditionMode: PostConditionMode.Deny,
                anchorMode: AnchorMode.Any,
                onFinish: (data) => {
                    toast.success('Market creation transaction submitted!');
                    console.log('TxID:', data.txId);
                    setIsSubmitting(false);
                },
                onCancel: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to create market');
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <div className="container py-12 flex-1 flex flex-col">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle>Create Prediction Market</CardTitle>
                        <CardDescription>
                            Launch a new P2P market on the Stacks blockchain. (Admin Only)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="question">Question</Label>
                                <Input 
                                    id="question" 
                                    placeholder="e.g. Will Bitcoin reach $100k by 2025?" 
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <select 
                                        id="category"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option value="Crypto">Crypto</option>
                                        <option value="Politics">Politics</option>
                                        <option value="Sports">Sports</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="resolveDate">Resolution Date & Time</Label>
                                    <Input 
                                        id="resolveDate" 
                                        type="datetime-local" 
                                        value={resolveDate}
                                        onChange={(e) => setResolveDate(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                        required
                                    />
                                    {resolveDate && (
                                        <p className="text-xs text-muted-foreground">
                                            Estimated block: ~{estimatedBlock.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Market Image</Label>
                                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors cursor-pointer relative">
                                    <input 
                                        type="file" 
                                        id="image" 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={isUploading}
                                    />
                                    {previewUrl ? (
                                        <div className="relative w-full h-40">
                                            <img src={previewUrl} className="w-full h-full object-cover rounded-md" alt="Preview" />
                                            {isUploading && (
                                                <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-md">
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="mx-auto h-12 w-12 text-muted-foreground mb-2 flex items-center justify-center">
                                                {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : "📁"}
                                            </div>
                                            <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG or GIF (max 2MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea 
                                    id="description" 
                                    placeholder="Provide details about the market resolution..." 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Create Market
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
