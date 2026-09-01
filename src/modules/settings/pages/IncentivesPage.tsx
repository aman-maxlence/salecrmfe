import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Target, Award, CheckSquare, History, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function IncentivesPage() {
  const { pathname } = useLocation();

  let title = 'Incentive Settings';
  let subtitle = 'Configure sales commission structures, quota tiers, and incentive slabs.';

  if (pathname.includes('my-incentives')) {
    title = 'My Incentives';
    subtitle = 'View your earned commissions, target attainment, and monthly payouts.';
  } else if (pathname.includes('incentive-approvals')) {
    title = 'Incentive Approvals';
    subtitle = 'Review and approve rep commission claims and quarterly payout batches.';
  } else if (pathname.includes('incentive-history')) {
    title = 'Incentive History';
    subtitle = 'Historical audit of paid commissions and closed deal bonuses.';
  }

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-600" />
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Active Performance Plans</h3>
          <Button size="sm" onClick={() => toast.success('New plan builder opened')} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-1" />
            Create Plan
          </Button>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-background">
            <div>
              <p className="text-sm font-semibold text-foreground">Standard Sales Commission Tier 1</p>
              <p className="text-xs text-muted-foreground mt-0.5">3.5% payout on deal closure above ₹5,00,000</p>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-background">
            <div>
              <p className="text-sm font-semibold text-foreground">Territory Accelerators (Delhi / MP / GGN)</p>
              <p className="text-xs text-muted-foreground mt-0.5">5.0% payout on target quota overachievement (&gt;110%)</p>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
