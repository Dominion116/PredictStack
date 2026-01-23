
'use client';

import { useState } from 'react';
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useConnect } from '@stacks/connect-react';
import { getContractConfig } from '@/lib/constants';
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
import { Loader2 } from 'lucide-react';

export default function CreateMarketPage() {
    const { doContractCall } = useConnect();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form State
    const [question, setQuestion] = useState('');
    const [description, setDescription] = useState('');
    const [resolveBlock, setResolveBlock] = useState('');
    const [externalId, setExternalId] = useState('');

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
                    externalId ? someCV(stringAsciiCV(externalId)) : noneCV(),
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
                            Launch a new P2P market on the Stacks blockchain.
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

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea 
                                    id="description" 
                                    placeholder="Provide details about the market resolution..." 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <div className="space-y-2">
                                    <Label htmlFor="external">Polymarket ID (Optional)</Label>
                                    <Input 
                                        id="external" 
                                        placeholder="condition_id" 
                                        value={externalId}
                                        onChange={(e) => setExternalId(e.target.value)}
                                    />
                                </div>
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
