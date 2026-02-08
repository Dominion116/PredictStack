'use client';

import { useConnect } from '@stacks/connect-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { userSession, getContractConfig, isUserSignedIn } from '@/lib/constants';
import { useEffect, useState } from 'react';
import { LogOut, Wallet, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Logo } from '@/components/logo';
import { NavMenu } from '@/components/nav-menu';
import { NavigationSheet } from '@/components/navigation-sheet';

export function Navbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <nav className="h-16 border-b bg-background">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="text-xl font-bold">PredictStack</span>
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
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (isUserSignedIn()) {
      setIsSignedIn(true);
      const userAddress = userSession.loadUserData().profile.stxAddress.testnet;
      setAddress(userAddress);
      
      const config = getContractConfig();
      setIsAdmin(userAddress === config.deployer);
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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const navLinks = [
    { href: '/markets', label: 'Markets' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/bridge', label: 'Bridge' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <nav className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-12">
          <Logo />

          {/* Desktop Menu */}
          <NavMenu className="hidden md:block" navLinks={navLinks} />
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop Auth */}
          {isSignedIn ? (
            <>
              <Badge variant="outline" className="hidden sm:flex h-9 px-4 py-2 font-mono">
                {truncatedAddress}
              </Badge>
              <Button variant="ghost" size="icon" onClick={handleDisconnect} className="hidden sm:inline-flex">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} className="hidden sm:inline-flex rounded-full">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}

          {/* Theme Toggle */}
          <Button size="icon" variant="outline" onClick={toggleTheme} className="rounded-full shadow-none">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <NavigationSheet
              isSignedIn={isSignedIn}
              address={address}
              navLinks={navLinks}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
