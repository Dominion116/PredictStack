
'use client';

import { useState, useEffect } from 'react';
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
    const [resolveBlock, setResolveBlock] = useState('');
    const [category, setCategory] = useState('Crypto');
    const [imageUrl, setImageUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const config = getContractConfig();

        if (!question || !resolveBlock) {
            toast.error('Question and Resolution Block are required');
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
                    uintCV(resolveBlock),
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
            <div className="container py-12 flex-1 flex flex-col items-center">
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
                                    <Label htmlFor="block">Resolution Block Height</Label>
                                    <Input 
                                        id="block" 
                                        type="number" 
                                        placeholder="e.g. 150000" 
                                        value={resolveBlock}
                                        onChange={(e) => setResolveBlock(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                                <Input 
                                    id="imageUrl" 
                                    placeholder="https://example.com/image.jpg" 
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                />
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
