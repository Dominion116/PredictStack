import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2 text-xl font-bold transition-colors hover:text-foreground/80">
      PredictStack
    </Link>
  );
}
