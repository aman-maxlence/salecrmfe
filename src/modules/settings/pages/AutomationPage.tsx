import { useState } from 'react';
import { toast } from 'react-toastify';
import { Zap, GitFork, CheckCircle, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function AutomationPage() {
  const [autoAssign, setAutoAssign] = useState(true);
  const [roundRobin, setRoundRobin] = useState(true);

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Automation Workflows
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Automate lead distribution, territory routing, and stage transition rules.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Lead Routing Rules</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-background">
            <div>
              <p className="text-sm font-medium text-foreground">Territory-Based Auto Routing</p>
              <p className="text-xs text-muted-foreground">Automatically assign incoming leads based on customer state/pincode</p>
            </div>
            <input
              type="checkbox"
              checked={autoAssign}
              onChange={(e) => setAutoAssign(e.target.checked)}
              className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-background">
            <div>
              <p className="text-sm font-medium text-foreground">Round-Robin Rep Allocation</p>
              <p className="text-xs text-muted-foreground">Distribute unassigned leads equally among active sales reps in the territory</p>
            </div>
            <input
              type="checkbox"
              checked={roundRobin}
              onChange={(e) => setRoundRobin(e.target.checked)}
              className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={() => toast.success('Automation rules updated')} className="bg-blue-600 hover:bg-blue-700 text-white">
            Save Automation Rules
          </Button>
        </div>
      </div>
    </div>
  );
}
