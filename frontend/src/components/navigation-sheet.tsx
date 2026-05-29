'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, LogOut } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

interface NavigationSheetProps {
  isSignedIn: boolean;
  address: string | null;
  navLinks: Array<{ href: string; label: string }>;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function NavigationSheet({
  isSignedIn,
  address,
  navLinks,
  onConnect,
  onDisconnect,
}: NavigationSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-menu"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </Button>

      {isOpen && (
        <div
          id="mobile-nav-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="absolute left-0 right-0 top-16 border-t bg-background z-50"
        >
          <div className="container py-4 space-y-4">
            <nav aria-label="Mobile navigation">
              <ul className="flex flex-col space-y-1" role="list">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="block text-foreground/80 hover:text-foreground py-2 px-1 font-medium rounded-md hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Mobile Auth */}
            <div className="pt-4 border-t">
              {isSignedIn ? (
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-sm">
                    {truncatedAddress}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={onDisconnect} className="rounded-full shadow-none">
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button onClick={onConnect} className="w-full rounded-full">
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
