import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t bg-muted/30 w-full mt-auto">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="font-bold text-xl mb-4">PredictStack</div>
              <p className="text-sm text-muted-foreground mb-4">
                Decentralized prediction markets on Stacks, secured by Bitcoin.
              </p>
              <div className="flex gap-4">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="https://github.com/Dominion116/PredictStack" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <div className="font-semibold mb-4">Product</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/markets" className="hover:text-foreground transition-colors">Markets</Link></li>
                <li><Link href="/bridge" className="hover:text-foreground transition-colors">Bridge</Link></li>
                <li><Link href="/create" className="hover:text-foreground transition-colors">Create Market</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <div className="font-semibold mb-4">Resources</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>


          </div>

          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2026 PredictStack. All rights reserved.
            </div>
            <div className="text-sm text-muted-foreground">
              Built on Stacks
            </div>
          </div>
        </div>
      </footer>
    );
}
