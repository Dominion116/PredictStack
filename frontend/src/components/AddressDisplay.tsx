'use client';

import { CopyButton } from './CopyButton';
import { truncateAddress } from '@/lib/format';
import { cn } from '@/lib/utils';

interface AddressDisplayProps {
  address: string;
  className?: string;
  showCopy?: boolean;
  prefixLen?: number;
  suffixLen?: number;
}

export function AddressDisplay({
  address,
  className,
  showCopy = true,
  prefixLen = 6,
  suffixLen = 4,
}: AddressDisplayProps) {
  const short = truncateAddress(address, prefixLen, suffixLen);

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="font-mono text-sm text-muted-foreground">{short}</span>
      {showCopy && <CopyButton text={address} />}
    </span>
  );
}
