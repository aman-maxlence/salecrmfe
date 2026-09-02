import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Pencil, Trash2 } from 'lucide-react';
import { RootState } from '@/store/store';
import { Button } from '@/modules/settings/components/ui/Button';
import { Badge } from '@/modules/settings/components/ui/Badge';
import { ConfirmDialog } from '@/modules/settings/components/ConfirmDialog';
import { usePermissions } from '@/modules/settings/hooks/usePermissions';
import { getErrorMessage } from '@/modules/settings/models';
import { useGetItemQuery, useDeleteItemMutation } from '../services/inventoryApi';
import { formatMoney, formatQty } from '../models';
import { ItemFormDialog } from '../components/ItemFormDialog';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';

export default function ItemDetailPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { hasPermission, isLoading: permsLoading } = usePermissions();
  const canManage = permsLoading ? true : hasPermission('manage_inventory');
  const canAdjust = permsLoading ? true : hasPermission('adjust_stock');
  const { data: item, isLoading, isError } = useGetItemQuery(
    { orgId: orgId ?? 0, id: itemId ?? 0 },
    { skip: !orgId || !itemId }
  );
  const [deleteItem, { isLoading: isDeleting }] = useDeleteItemMutation();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleDelete = async () => {
    if (!orgId || !itemId) return;
    try {
      await deleteItem({ orgId, id: itemId }).unwrap();
      toast.success('Item archived');
      navigate('/inventory');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete item'));
    }
  };

  if (!orgId) return <p className="text-sm text-muted-foreground">No organization in context.</p>;
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading item...</p>;
  if (isError || !item) return <p className="text-sm text-destructive">Item not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/inventory" className="text-xs text-muted-foreground hover:underline">
            ← Inventory
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{item.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{item.sku}</p>
        </div>
        <div className="flex gap-2">
          {canAdjust ? (
            <StockAdjustmentModal orgId={orgId} item={item} trigger={<Button size="sm">Adjust stock</Button>} />
          ) : null}
          {canManage ? (
            <ItemFormDialog
              orgId={orgId}
              item={item}
              trigger={
                <Button size="sm" variant="outline">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              }
            />
          ) : null}
          {canManage ? (
            <Button size="sm" variant="outline" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Info label="Category" value={item.category || '-'} />
        <Info label="Unit price" value={formatMoney(item.unit_price)} />
        <Info label="Tax" value={`${formatQty(item.tax)}%`} />
        <Info label="UoM" value={item.uom ? `${item.uom.name} (${item.uom.abbreviation})` : '-'} />
        <Info label="Pricing tier" value={item.pricingTier?.name || '-'} />
        <Info
          label="Status"
          value={<Badge tone={item.status === 'active' ? 'success' : 'muted'}>{item.status}</Badge>}
        />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Stock by warehouse</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Warehouse</th>
                <th className="px-4 py-2.5 font-medium">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(item.stockLevels ?? []).length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-muted-foreground" colSpan={2}>
                    No stock recorded yet.
                  </td>
                </tr>
              ) : (
                item.stockLevels?.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2.5">{row.warehouse?.name ?? `Warehouse #${row.warehouse_id}`}</td>
                    <td className="px-4 py-2.5">{formatQty(row.quantity)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Price history</h2>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {(item.priceHistory ?? []).length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">No price changes recorded.</li>
          ) : (
            item.priceHistory?.map((row) => (
              <li key={row.id} className="flex justify-between px-4 py-2 text-sm">
                <span>{formatMoney(row.unit_price)}</span>
                <span className="text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Linked deals</h2>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {(item.dealLineItems ?? []).length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">Not attached to any deals.</li>
          ) : (
            item.dealLineItems?.map((line) => (
              <li key={line.id} className="flex justify-between px-4 py-2 text-sm">
                <Link to={`/deals/${line.deal?.id}`} className="hover:underline">
                  {line.deal?.title ?? `Deal #${line.deal?.id}`}
                </Link>
                <span className="text-muted-foreground">
                  {formatQty(line.quantity)} × {formatMoney(line.unit_price)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete item?"
        description={`"${item.name}" will be archived and removed from the catalog. Items already on a deal can't be deleted.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
