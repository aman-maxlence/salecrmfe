import { cn } from '@/shadcn/lib/utils';

/**
 * `@radix-ui/react-switch` isn't in this project's dependency list (only
 * dialog/dropdown-menu/label/select/slot/tabs are installed), so this is a
 * plain Tailwind toggle button rather than pulling in a new dependency.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  'aria-label': ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-background shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-1'
        )}
      />
    </button>
  );
}
