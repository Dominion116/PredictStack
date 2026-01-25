'use client';

import { useConnect } from '@stacks/connect-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { userSession, getContractConfig } from '@/lib/constants';
import { useEffect, useState } from 'react';
import { LogOut, Wallet, Sun, Moon, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export function Navbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

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
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold z-10 transition-colors hover:text-foreground/80">
          PredictStack
        </Link>
        
        {/* Center: Nav Menu (Desktop) */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:block">
          <nav className="flex items-center space-x-8 text-sm font-medium">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                className="transition-colors hover:text-foreground/80 text-foreground/60" 
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 z-10">
          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Desktop Auth */}
          <div className="hidden sm:flex items-center gap-2">
            {isSignedIn ? (
              <>
                <Badge variant="outline" className="h-9 px-4 py-2 font-mono">
                  {truncatedAddress}
                </Badge>
                <Button variant="ghost" size="icon" onClick={handleDisconnect}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button onClick={handleConnect}>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="container py-4 space-y-4">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  className="text-foreground/80 hover:text-foreground py-2 font-medium" 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            
            {/* Mobile Auth */}
            <div className="pt-4 border-t">
              {isSignedIn ? (
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-sm">
                    {truncatedAddress}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleDisconnect}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button onClick={handleConnect} className="w-full">
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
