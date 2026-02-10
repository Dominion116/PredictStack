import { ArrowUpRight, Wallet } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <div className="container flex min-h-[85vh] items-center justify-center py-20 md:py-32">
      <div className="max-w-3xl text-center">
        <Badge
          asChild
          className="rounded-full border-border py-1"
          variant="secondary"
        >
          <Link href="/markets">
            Now Live on Stacks Testnet <ArrowUpRight className="ml-1 size-4" />
          </Link>
        </Badge>
        <h1 className="mt-6 font-semibold text-4xl tracking-tighter sm:text-5xl md:text-6xl md:leading-[1.2] lg:text-7xl">
          Decentralized Prediction Markets on{" "}
          <span className="text-primary">Stacks</span>
        </h1>
        <p className="mt-6 text-foreground/80 md:text-lg">
          Bet on future events with USDCx. Transparent, secure, and secured by
          Bitcoin. Create markets, place bets, and earn rewards on the most
          trusted prediction platform.
        </p>
        <div className="mt-12 flex items-center justify-center gap-4">
          <Button asChild className="rounded-full text-base" size="lg">
            <Link href="/markets">
              Start Betting <ArrowUpRight className="size-5" />
            </Link>
          </Button>
          <Button
            asChild
            className="rounded-full text-base shadow-none"
            size="lg"
            variant="outline"
          >
            <Link href="/bridge">
              <Wallet className="size-5" /> Bridge USDCx
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
