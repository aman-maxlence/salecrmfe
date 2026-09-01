import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { CreditCard, Check, Sparkles } from 'lucide-react';
import { RootState } from '@/store/store';
import { Button } from '../components/ui/Button';

export default function BillingPage() {
  const org = useSelector((state: RootState) => state.auth.organization);

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          Billings & Subscription
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription tier, sales seat licenses, and billing invoices.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-base">Sales CRM Enterprise</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-600 text-white">Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unlimited leads, territory hierarchy, inventory sync, and deals</p>
          </div>
          <Button onClick={() => toast.info('Managing billing portal')} className="bg-blue-600 hover:bg-blue-700 text-white">
            Upgrade Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border bg-background">
            <p className="text-xs text-muted-foreground">Active Seats</p>
            <p className="text-xl font-bold text-foreground mt-1">12 / 20</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-background">
            <p className="text-xs text-muted-foreground">Billing Cycle</p>
            <p className="text-xl font-bold text-foreground mt-1">Annual</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-background">
            <p className="text-xs text-muted-foreground">Next Renewal</p>
            <p className="text-xl font-bold text-foreground mt-1">Dec 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
