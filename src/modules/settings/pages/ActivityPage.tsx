import { useState } from 'react';
import { toast } from 'react-toastify';
import { Mail, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function ActivityPage() {
  const [dailyDigest, setDailyDigest] = useState(true);
  const [dealAlerts, setDealAlerts] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Emails & Activity
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure email notifications, digest frequencies, and audit logging.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Email Notifications</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-background">
            <div>
              <p className="text-sm font-medium text-foreground">Daily Sales Summary Digest</p>
              <p className="text-xs text-muted-foreground">Receive morning summaries of pipeline updates and closed deals</p>
            </div>
            <input
              type="checkbox"
              checked={dailyDigest}
              onChange={(e) => setDailyDigest(e.target.checked)}
              className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-background">
            <div>
              <p className="text-sm font-medium text-foreground">High Value Deal Stage Alerts</p>
              <p className="text-xs text-muted-foreground">Instant notification when deals over ₹10,00,000 change stage</p>
            </div>
            <input
              type="checkbox"
              checked={dealAlerts}
              onChange={(e) => setDealAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-background">
            <div>
              <p className="text-sm font-medium text-foreground">Inventory Low Stock Alerts</p>
              <p className="text-xs text-muted-foreground">Notify reps when items fall below safety threshold</p>
            </div>
            <input
              type="checkbox"
              checked={stockAlerts}
              onChange={(e) => setStockAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={() => toast.success('Activity preferences saved')} className="bg-blue-600 hover:bg-blue-700 text-white">
            Save Email Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
