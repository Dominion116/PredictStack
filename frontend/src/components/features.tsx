import {
  Wallet,
  BarChart3,
  Trophy,
  Shield,
  Zap,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Wallet,
    title: "Connect Your Wallet",
    description:
      "Seamlessly connect with Leather, Xverse, or any Stacks-compatible wallet to get started in seconds.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Markets",
    description:
      "Browse live prediction markets across Crypto, Politics, Sports, and more with up-to-the-minute odds.",
  },
  {
    icon: Trophy,
    title: "Automatic Payouts",
    description:
      "When markets resolve, winnings are automatically distributed to your wallet—no manual claims needed.",
  },
  {
    icon: Shield,
    title: "Bitcoin-Secured",
    description:
      "Built on Stacks, all transactions are secured by Bitcoin's proof-of-work, ensuring unmatched security.",
  },
  {
    icon: Zap,
    title: "Instant Trading",
    description:
      "Buy and sell outcome shares instantly with low fees and fast confirmation times on the Stacks blockchain.",
  },
  {
    icon: Users,
    title: "Community-Driven",
    description:
      "Create your own markets, participate in governance, and earn rewards for contributing to the platform.",
  },
];

const Features = () => {
  return (
    <div className="container py-16 md:py-24">
      <div>
        <div className="flex justify-center mb-4">
          <Badge className="rounded-full border-border py-1" variant="secondary">
            Features
          </Badge>
        </div>
        <h2 className="text-center font-semibold text-4xl tracking-tight sm:text-5xl">
          Why Choose PredictStack?
        </h2>
        <div className="mt-10 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              className="flex flex-col rounded-xl border px-5 py-6"
              key={feature.title}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="size-5 text-primary" />
              </div>
              <span className="font-semibold text-lg">{feature.title}</span>
              <p className="mt-1 text-[15px] text-foreground/80">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
