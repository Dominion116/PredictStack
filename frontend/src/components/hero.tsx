'use client';

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, slowTransition } from "@/lib/animations";
import RippleGrid from "@/components/ripple-grid";

export default function Hero() {
  return (
    <div className="container flex min-h-[85vh] items-center justify-center py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <RippleGrid relative z-10
          enableRainbow={false}
          gridColor="#e88d4e"
          rippleIntensity={0.03}
          gridSize={8}
          gridThickness={20}
          mouseInteraction={true}
          mouseInteractionRadius={1.5}
          opacity={0.3}
          glowIntensity={0.2}
          vignetteStrength={1.8}
        />
      </div>
      <motion.div 
        className="max-w-3xl text-center"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeInUp} transition={{ ...slowTransition, delay: 0 }}>
          <Badge
            asChild
            className="rounded-full border-border py-1"
            variant="secondary"
          >
            <Link href="/markets">
              Now Live on Stacks Testnet <ArrowUpRight className="ml-1 size-4" />
            </Link>
          </Badge>
        </motion.div>
        <motion.h1 
          className="mt-6 font-semibold text-4xl tracking-tighter sm:text-5xl md:text-6xl md:leading-[1.2] lg:text-7xl"
          variants={fadeInUp}
          transition={{ ...slowTransition, delay: 0.1 }}
        >
          Decentralized Prediction Markets on{" "}
          <span className="text-primary">Stacks</span>
        </motion.h1>
        <motion.p 
          className="mt-6 text-foreground/80 md:text-lg"
          variants={fadeInUp}
          transition={{ ...slowTransition, delay: 0.2 }}
        >
          Bet on future events with USDCx. Transparent, secure, and secured by
          Bitcoin. Create markets, place bets, and earn rewards on the most
          trusted prediction platform.
        </motion.p>
        <motion.div 
          className="mt-12 flex items-center justify-center gap-4"
          variants={fadeInUp}
          transition={{ ...slowTransition, delay: 0.3 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button asChild className="rounded-full text-base" size="lg">
              <Link href="/markets">
                Start Betting <ArrowUpRight className="size-5" />
              </Link>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              asChild
              className="rounded-full text-base shadow-none"
              size="lg"
              variant="outline"
            >
              <Link href="/bridge">
                Bridge USDCx
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
