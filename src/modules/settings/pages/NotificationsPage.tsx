import { useState } from 'react';
import { toast } from 'react-toastify';
import { Bell, Check, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotificationsPage() {
  const [dealUpdates, setDealUpdates] = useState(true);
  const [territoryAnnouncements, setTerritoryAnnouncements] = useState(true);
  const [browserPush, setBrowserPush] = useState(false);

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          Notification Preferences
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure real-time alerts, browser push notifications, and deal notifications.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-background">
            <div>
              <p className="text-sm font-medium text-foreground">Deal Stage Movements</p>
              <p className="text-xs text-muted-foreground">Notify when deals assigned to you transition stages</p>
            </div>
            <input
              type="checkbox"
              checked={dealUpdates}
              onChange={(e) => setDealUpdates(e.target.checked)}
              className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-background">
            <div>
              <p className="text-sm font-medium text-foreground">Territory Updates</p>
              <p className="text-xs text-muted-foreground">Receive updates regarding territory assignment changes</p>
            </div>
            <input
              type="checkbox"
              checked={territoryAnnouncements}
              onChange={(e) => setTerritoryAnnouncements(e.target.checked)}
              className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-background">
            <div>
              <p className="text-sm font-medium text-foreground">Browser Push Notifications</p>
              <p className="text-xs text-muted-foreground">Show desktop popups for hot leads and assigned tasks</p>
            </div>
            <input
              type="checkbox"
              checked={browserPush}
              onChange={(e) => setBrowserPush(e.target.checked)}
              className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={() => toast.success('Notification settings saved')} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
