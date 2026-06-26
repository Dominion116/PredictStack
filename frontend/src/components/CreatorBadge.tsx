import Link from 'next/link';

interface Props {
  address: string;
  className?: string;
}

function shortAddress(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function CreatorBadge({ address, className = '' }: Props) {
  if (!address) return null;
  return (
    <Link
      href={`/creator/${encodeURIComponent(address)}`}
      className={`inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors ${className}`}
      title={address}
    >
      <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold shrink-0">
        {address.slice(2, 4).toUpperCase()}
      </span>
      {shortAddress(address)}
    </Link>
  );
}
