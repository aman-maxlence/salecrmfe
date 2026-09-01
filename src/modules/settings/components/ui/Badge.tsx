import { HTMLAttributes } from 'react';
import { cn } from '@/shadcn/lib/utils';

type Tone = 'default' | 'success' | 'muted' | 'destructive' | 'warning';

const toneClasses: Record<Tone, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  muted: 'bg-muted text-muted-foreground',
  destructive: 'bg-destructive/10 text-destructive',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

export function Badge({
  tone = 'default',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
