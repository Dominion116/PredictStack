'use client';

import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'default';
}

export function CopyButton({ text, className, size = 'sm' }: CopyButtonProps) {
  const { copied, copy } = useClipboard();

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => copy(text)}
      className={cn('h-7 w-7 p-0', className)}
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
  );
}
