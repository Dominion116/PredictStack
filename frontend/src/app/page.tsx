'use client';

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, Trophy, Zap, Shield, Wallet, BarChart3 } from "lucide-react";
import { MarketsList } from "@/components/markets-list";
import { useEffect, useState } from "react";
import { getPlatformStats } from "@/lib/stacks-api";
import { isUserSignedIn } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/footer";
import Hero from "@/components/hero";
import Features from "@/components/features";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, defaultTransition } from "@/lib/animations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (isUserSignedIn()) {
      router.replace('/dashboard');
    } else {
      getPlatformStats().then(setStats);
    }
  }, []);

  const totalMarkets = stats?.['total-markets'] || 0;
  const totalVolume = Number(stats?.['total-volume'] || 0) / 1000000;

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero */}
      <Hero />

      {/* Features */}
      <Features />

      {/* Featured Markets */}
      <section className="bg-muted/30">
        <div className="container py-16 md:py-24">
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={defaultTransition}
          >
              <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Trending Markets</h2>
                  <p className="text-muted-foreground">The most active predictions right now on PredictStack.</p>
              </div>
              <Link href="/markets">
                <Button variant="ghost" className="hidden md:flex">
                    View all markets <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
          </motion.div>

          <MarketsList />
        </div>
      </section>

      {/* How it works */}
      <section className="container py-16 md:py-24">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-center font-semibold text-4xl tracking-tight sm:text-5xl"
              variants={fadeInUp}
            >
              How it works
            </motion.h2>
            <div className="mt-10 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
              <motion.div 
                className="flex flex-col rounded-xl border px-5 py-6 hover:border-primary/50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...defaultTransition, delay: 0 }}
                whileHover={{ y: -4 }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Wallet className="size-5 text-primary" />
                </div>
                <span className="font-semibold text-lg">1. Connect & Fund</span>
                <p className="mt-1 text-[15px] text-foreground/80">
                  Connect your Stacks wallet and bridge USDC from Ethereum to get USDCx tokens for betting.
                </p>
              </motion.div>

              <motion.div 
                className="flex flex-col rounded-xl border px-5 py-6 hover:border-primary/50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...defaultTransition, delay: 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <BarChart3 className="size-5 text-primary" />
                </div>
                <span className="font-semibold text-lg">2. Browse & Bet</span>
                <p className="mt-1 text-[15px] text-foreground/80">
                  Explore prediction markets, analyze odds, and place bets on outcomes you believe in.
                </p>
              </motion.div>

              <motion.div 
                className="flex flex-col rounded-xl border px-5 py-6 hover:border-primary/50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...defaultTransition, delay: 0.2 }}
                whileHover={{ y: -4 }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Trophy className="size-5 text-primary" />
                </div>
                <span className="font-semibold text-lg">3. Win & Withdraw</span>
                <p className="mt-1 text-[15px] text-foreground/80">
                  When markets resolve, winnings are automatically sent to your wallet. Withdraw anytime.
                </p>
              </motion.div>
            </div>
          </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/30">
        <div className="container px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={defaultTransition}
            className="flex justify-center mb-4"
          >
            <Badge className="rounded-full border-border py-1" variant="secondary">
              FAQ
            </Badge>
          </motion.div>
          <div className="flex min-h-[400px] items-center justify-center">
            <motion.div 
              className="flex flex-col items-start gap-x-12 gap-y-6 md:flex-row"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...defaultTransition, delay: 0.1 }}
            >
              <h2 className="font-semibold text-4xl leading-[1.15] tracking-[-0.035em] lg:text-5xl">
                Frequently Asked <br /> Questions
              </h2>

            <Accordion className="max-w-xl" defaultValue="question-0" type="single">
              <AccordionItem value="question-0">
                <AccordionTrigger className="text-left text-lg">
                  What is PredictStack?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  PredictStack is a decentralized prediction market platform built on Stacks. Users can bet on future events using USDCx tokens, with all transactions secured by Bitcoin through Stacks&apos; Proof-of-Transfer consensus.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="question-1">
                <AccordionTrigger className="text-left text-lg">
                  How do I get started?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  First, connect a Stacks wallet like Leather or Xverse. Then, bridge some USDC to get USDCx tokens. Finally, browse our markets and place your first prediction!
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="question-2">
                <AccordionTrigger className="text-left text-lg">
                  What is USDCx?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  USDCx is a bridged version of USDC on the Stacks blockchain. It maintains a 1:1 peg with USDC and can be bridged back to Ethereum at any time through our bridge interface.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="question-3">
                <AccordionTrigger className="text-left text-lg">
                  How are markets resolved?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  Markets are resolved by trusted oracles after the event concludes. Once resolved, winnings are automatically distributed to the correct predictions. All resolutions are recorded on-chain for transparency.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="question-4">
                <AccordionTrigger className="text-left text-lg">
                  Are my funds safe?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  Yes! PredictStack is non-custodial, meaning your funds are held in smart contracts, not by us. All contracts are open source and secured by Bitcoin through Stacks&apos; unique architecture.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="question-5">
                <AccordionTrigger className="text-left text-lg">
                  What fees does PredictStack charge?
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  We charge a small platform fee (typically 2-3%) on winning bets. This fee helps maintain the platform and oracle infrastructure. There are no fees for placing bets or withdrawing funds.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 md:py-32">
        <motion.div 
          className="relative rounded-3xl bg-primary px-8 py-16 md:px-16 md:py-24"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ ...defaultTransition, duration: 0.5 }}
        >
          <div className="relative z-10">
            <motion.h2 
              className="font-bold text-4xl text-white tracking-tight md:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...defaultTransition, delay: 0.1 }}
            >
              Ready to Predict the Future?
            </motion.h2>
            <motion.p 
              className="mt-4 text-lg text-white/90 md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...defaultTransition, delay: 0.2 }}
            >
              Join thousands of users making predictions on PredictStack. 
              Start with as little as $1 USDCx.
            </motion.p>
            <motion.div 
              className="mt-8 flex flex-col gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...defaultTransition, delay: 0.3 }}
            >
              <Button asChild className="rounded-full bg-white text-base text-black hover:bg-white/90" size="lg">
                <Link href="/markets">
                  Explore Markets <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
