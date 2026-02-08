import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavMenuProps {
  className?: string;
  navLinks: Array<{ href: string; label: string }>;
}

export function NavMenu({ className, navLinks }: NavMenuProps) {
  return (
    <nav className={cn("flex items-center space-x-8 text-sm font-medium", className)}>
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
  );
}
