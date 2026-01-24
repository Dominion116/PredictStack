
'use client';

import { useConnect } from '@stacks/connect-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { userSession, getContractConfig } from '@/lib/constants';
import { useEffect, useState } from 'react';
import { LogOut, Wallet } from 'lucide-react';
import Link from 'next/link';

export function Navbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <span className="font-bold">PredictStack</span>
        </div>
      </nav>
    );
  }

  return <NavbarContent />;
}

function NavbarContent() {
  const { doOpenAuth } = useConnect();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      if (userSession.isUserSignedIn()) {
        setIsSignedIn(true);
        const userAddress = userSession.loadUserData().profile.stxAddress.testnet;
        setAddress(userAddress);
        
        const config = getContractConfig();
        setIsAdmin(userAddress === config.deployer);
      }
    } catch (error) {
      console.error("Session data corrupted, clearing...", error);
      userSession.signUserOut();
    }
  }, []);

  const handleConnect = () => {
    doOpenAuth();
  };

  const handleDisconnect = () => {
    userSession.signUserOut();
    setIsSignedIn(false);
    setAddress(null);
    setIsAdmin(false);
    window.location.reload();
  };


  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-4">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2 font-bold">
            PredictStack
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link className="transition-colors hover:text-foreground/80 text-foreground" href="/">Markets</Link>
            <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/bridge">Bridge</Link>
            {isAdmin && (
              <Link className="transition-colors hover:text-foreground/80 text-foreground/60" href="/create">Create</Link>
            )}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none"></div>

          {isSignedIn ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-9 px-4 py-2 font-mono">
                {truncatedAddress}
              </Badge>
              <Button variant="ghost" size="icon" onClick={handleDisconnect}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnect}>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
