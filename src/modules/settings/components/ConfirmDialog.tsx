import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogClose } from './ui/Dialog';
import { Button } from './ui/Button';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = true,
  isLoading = false,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description}>
        {children}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            size="sm"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? 'Please wait...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
