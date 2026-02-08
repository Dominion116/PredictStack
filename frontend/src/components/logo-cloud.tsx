import {
  StacksLogo,
  BitcoinLogo,
  ClarityLogo,
  USDCLogo,
  Web3Logo,
  DefiLogo,
  SmartContractsLogo,
  BlockchainLogo,
} from "@/components/logos";
import { Marquee } from "@/components/ui/marquee";

const LogoCloud = () => {
  return (
    <div className="flex items-center justify-center px-6 py-16 bg-muted/30">
      <div className="overflow-hidden w-full">
        <p className="text-center font-medium text-xl mb-10">
          Powered by cutting-edge blockchain technology
        </p>

        <div className="flex max-w-7xl mx-auto items-center justify-center">
          <Marquee
            className="[--duration:30s]"
            pauseOnHover
          >
            <StacksLogo />
            <BitcoinLogo />
            <ClarityLogo />
            <USDCLogo />
            <Web3Logo />
            <DefiLogo />
            <SmartContractsLogo />
            <BlockchainLogo />
          </Marquee>
        </div>
      </div>
    </div>
  );
};

export default LogoCloud;
