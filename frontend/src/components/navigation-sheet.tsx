import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, LogOut, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
  
  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-16 border-t bg-background z-50">
          <div className="container py-4 space-y-4">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  className="text-foreground/80 hover:text-foreground py-2 font-medium"
                  href={link.href}
                  onClick={() => setIsOpen(false)}
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
                  <Button variant="outline" size="sm" onClick={onDisconnect}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button onClick={onConnect} className="w-full">
                  <Wallet className="mr-2 h-4 w-4" />
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
