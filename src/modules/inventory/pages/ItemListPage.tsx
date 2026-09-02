import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';
import { RootState } from '@/store/store';
import { Button } from '@/modules/settings/components/ui/Button';
import { Input } from '@/modules/settings/components/ui/Input';
import { SelectField } from '@/modules/settings/components/ui/Select';
import { Badge } from '@/modules/settings/components/ui/Badge';
import { ConfirmDialog } from '@/modules/settings/components/ConfirmDialog';
import { usePermissions } from '@/modules/settings/hooks/usePermissions';
import { getErrorMessage } from '@/modules/settings/models';
import { useSearchItemsQuery, useDeleteItemMutation } from '../services/inventoryApi';
import { formatMoney, formatQty, InventoryItem } from '../models';
import { ItemFormDialog } from '../components/ItemFormDialog';

const ALL = '__all__';

export default function ItemListPage() {
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { hasPermission, isLoading: permsLoading } = usePermissions();
  const canManage = permsLoading ? true : hasPermission('manage_inventory');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState(ALL);
  const [group, setGroup] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);

  const { data, isLoading, isError } = useSearchItemsQuery(
    { orgId: orgId ?? 0, q, category: category === ALL ? undefined : category, groupByCategory: group },
    { skip: !orgId }
  );
  const [deleteItem, { isLoading: isDeleting }] = useDeleteItemMutation();

  const handleDelete = async () => {
    if (!pendingDelete || !orgId) return;
    try {
      await deleteItem({ orgId, id: pendingDelete.id }).unwrap();
      toast.success(`"${pendingDelete.name}" archived`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete item'));
    }
  };

  const categoryOptions = useMemo(
    () => [{ value: ALL, label: 'All categories' }, ...(data?.categories ?? []).map((c) => ({ value: c, label: c }))],
    [data?.categories]
  );

  if (!orgId) return <p className="text-sm text-muted-foreground">No organization in context.</p>;

  const sections: Array<{ title: string; items: InventoryItem[] }> = group
    ? Object.entries(data?.groups ?? {}).map(([title, items]) => ({ title, items }))
    : [{ title: 'Items', items: data?.items ?? [] }];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">Search, filter, and group catalog items.</p>
        </div>
        {canManage ? (
          <ItemFormDialog
            orgId={orgId}
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New item
              </Button>
            }
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[16rem] flex-1 flex-col gap-1.5 text-sm">
          Search
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SKU, name, or category" />
        </label>
        <label className="flex w-56 flex-col gap-1.5 text-sm">
          Category
          <SelectField value={category} onValueChange={setCategory} options={categoryOptions} />
        </label>
        <Button variant={group ? 'default' : 'outline'} size="sm" onClick={() => setGroup((v) => !v)}>
          {group ? 'Grouped by category' : 'Flat list'}
        </Button>
        <Link to="/inventory/alerts" className="text-sm text-primary hover:underline">
          Low-stock alerts
        </Link>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading items...</p> : null}
      {isError ? <p className="text-sm text-destructive">Failed to load items.</p> : null}

      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          {group ? <h2 className="text-sm font-semibold text-muted-foreground">{section.title}</h2> : null}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">SKU</th>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Price</th>
                  <th className="px-4 py-2.5 font-medium">On hand</th>
                  {canManage ? <th className="px-4 py-2.5 font-medium text-right">Delete</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {section.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2.5 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-2.5">
                      <Link to={`/inventory/items/${item.id}`} className="font-medium hover:underline">
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{item.category || '-'}</td>
                    <td className="px-4 py-2.5">{formatMoney(item.unit_price)}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={Number(item.on_hand ?? 0) <= 0 ? 'warning' : 'muted'}>{formatQty(item.on_hand)}</Badge>
                    </td>
                    {canManage ? (
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPendingDelete({ id: item.id, name: item.name })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {!isLoading && (data?.items.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">No items yet.</p>
      ) : null}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete item?"
        description={`"${pendingDelete?.name}" will be archived and removed from the catalog. Items already on a deal can't be deleted.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
