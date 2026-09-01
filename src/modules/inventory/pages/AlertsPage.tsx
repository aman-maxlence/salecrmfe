import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Badge } from '@/modules/settings/components/ui/Badge';
import { useGetLowStockAlertsQuery } from '../services/inventoryApi';
import { formatQty } from '../models';

export default function AlertsPage() {
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { data: alerts, isLoading, isError } = useGetLowStockAlertsQuery(orgId ?? 0, { skip: !orgId });

  if (!orgId) return <p className="text-sm text-muted-foreground">No organization in context.</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Low-stock alerts</h1>
        <p className="text-sm text-muted-foreground">Open reorder alerts from the inventory notification job.</p>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading alerts...</p> : null}
      {isError ? <p className="text-sm text-destructive">Failed to load alerts.</p> : null}
      {!isLoading && (alerts?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">No open alerts.</p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        {(alerts?.length ?? 0) > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Item</th>
                <th className="px-4 py-2.5 font-medium">Warehouse</th>
                <th className="px-4 py-2.5 font-medium">On hand</th>
                <th className="px-4 py-2.5 font-medium">Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {alerts?.map((alert) => (
                <tr key={alert.id}>
                  <td className="px-4 py-2.5">
                    <Link to={`/inventory/items/${alert.item_id}`} className="font-medium hover:underline">
                      {alert.item?.name ?? `Item #${alert.item_id}`}
                    </Link>
                    <div className="font-mono text-xs text-muted-foreground">{alert.item?.sku}</div>
                  </td>
                  <td className="px-4 py-2.5">{alert.warehouse?.name ?? '-'}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone="warning">{formatQty(alert.quantity)}</Badge>
                  </td>
                  <td className="px-4 py-2.5">{formatQty(alert.threshold)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
