import { Laptop, Clock, ShieldCheck, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/ui/Button';

export default function SessionsPage() {
  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Session History
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View active device sessions and sign-in activity.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Active Browser Sessions</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300">
                <Laptop className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Chrome on Windows 11</p>
                <p className="text-xs text-muted-foreground">Current Session · IP: 122.161.xx.xx (New Delhi, India)</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Active Now
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button variant="outline" onClick={() => toast.success('Other sessions logged out')} className="text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4 mr-2" />
            Revoke Other Sessions
          </Button>
        </div>
      </div>
    </div>
  );
}
