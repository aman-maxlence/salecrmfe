import { useSelector } from 'react-redux';
import { KeyRound, Check, Shield } from 'lucide-react';
import { RootState } from '@/store/store';
import { ALL_PERMISSION_KEYS } from '../models';

export default function PermissionsPage() {
  const role = useSelector((state: RootState) => state.auth.organization?.userRole) ?? 'Admin';

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-blue-600" />
          User Permissions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Active permissions granted to your profile under the role: <span className="font-semibold text-primary">{role}</span>
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Effective Capabilities</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {ALL_PERMISSION_KEYS.slice(0, 14).map((permKey) => (
            <div key={permKey} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-muted/20 text-xs">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="font-mono text-foreground font-medium">{permKey}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
