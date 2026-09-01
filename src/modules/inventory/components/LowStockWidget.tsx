import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AlertTriangle } from 'lucide-react';
import { RootState } from '@/store/store';
import { Badge } from '@/modules/settings/components/ui/Badge';
import { useGetLowStockAlertsQuery } from '../services/inventoryApi';
import { formatQty } from '../models';

export function LowStockWidget() {
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { data: alerts, isLoading } = useGetLowStockAlertsQuery(orgId ?? 0, { skip: !orgId });

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Low-stock alerts
        </div>
        <Link to="/inventory/alerts" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
      {!isLoading && (!alerts || alerts.length === 0) ? (
        <p className="text-sm text-muted-foreground">No open reorder alerts.</p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {(alerts ?? []).slice(0, 5).map((alert) => (
          <li key={alert.id} className="flex items-center justify-between gap-2 text-sm">
            <Link to={`/inventory/items/${alert.item_id}`} className="hover:underline">
              {alert.item?.name ?? `Item #${alert.item_id}`}
            </Link>
            <Badge tone="warning">
              {formatQty(alert.quantity)} / {formatQty(alert.threshold)} · {alert.warehouse?.code ?? 'WH'}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
