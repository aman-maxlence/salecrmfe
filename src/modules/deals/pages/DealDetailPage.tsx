import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { RootState } from '@/store/store';
import { Button } from '@/modules/settings/components/ui/Button';
import { Badge } from '@/modules/settings/components/ui/Badge';
import { getErrorMessage } from '@/modules/settings/models';
import { usePermissions } from '@/modules/settings/hooks/usePermissions';
import { AddDealItemPicker } from '@/modules/inventory/components/AddDealItemPicker';
import { formatMoney, formatQty } from '@/modules/inventory/models';
import { useGetDealQuery, useRemoveDealLineItemMutation } from '../services/dealsApi';

export default function DealDetailPage() {
  const { dealId } = useParams();
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { hasPermission, isLoading: permsLoading } = usePermissions();
  const canAttach = permsLoading ? true : hasPermission('view_inventory') || hasPermission('manage_inventory');
  const { data: deal, isLoading, isError } = useGetDealQuery(
    { orgId: orgId ?? 0, id: dealId ?? 0 },
    { skip: !orgId || !dealId }
  );
  const [removeLine] = useRemoveDealLineItemMutation();

  if (!orgId) return <p className="text-sm text-muted-foreground">No organization in context.</p>;
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading deal...</p>;
  if (isError || !deal) return <p className="text-sm text-destructive">Deal not found.</p>;

  const handleRemove = async (lineId: number) => {
    try {
      await removeLine({ orgId, dealId: deal.id, lineId }).unwrap();
      toast.success('Line removed');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove line'));
    }
  };

  const total = (deal.lineItems ?? []).reduce(
    (sum, line) => sum + Number(line.quantity) * Number(line.unit_price),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/deals" className="text-xs text-muted-foreground hover:underline">
            ← Deals
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{deal.title}</h1>
          <Badge tone="muted">{deal.status}</Badge>
        </div>
        {canAttach ? <AddDealItemPicker orgId={orgId} dealId={deal.id} /> : null}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Line items</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Item</th>
                <th className="px-4 py-2.5 font-medium">Qty</th>
                <th className="px-4 py-2.5 font-medium">Unit price</th>
                <th className="px-4 py-2.5 font-medium">Warehouse</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(deal.lineItems ?? []).length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-muted-foreground" colSpan={5}>
                    No items on this deal yet.
                  </td>
                </tr>
              ) : (
                deal.lineItems?.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-2.5">
                      <Link to={`/inventory/items/${line.item_id}`} className="hover:underline">
                        {line.item?.name ?? `Item #${line.item_id}`}
                      </Link>
                      <div className="font-mono text-xs text-muted-foreground">{line.item?.sku}</div>
                    </td>
                    <td className="px-4 py-2.5">{formatQty(line.quantity)}</td>
                    <td className="px-4 py-2.5">{formatMoney(line.unit_price)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{line.warehouse?.name ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right">
                      {canAttach ? (
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(line.id)}>
                          Remove
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Subtotal {formatMoney(total)}</p>
      </section>
    </div>
  );
}
