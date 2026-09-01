import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from '@/modules/settings/components/ui/Dialog';
import { Button } from '@/modules/settings/components/ui/Button';
import { Input } from '@/modules/settings/components/ui/Input';
import { SelectField } from '@/modules/settings/components/ui/Select';
import { getErrorMessage } from '@/modules/settings/models';
import { useAddDealLineItemMutation } from '@/modules/deals/services/dealsApi';
import { useGetInventorySettingsQuery, useSearchItemsQuery } from '../services/inventoryApi';
import { formatMoney } from '../models';

export function AddDealItemPicker({
  orgId,
  dealId,
}: {
  orgId: number | string;
  dealId: number | string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [warehouseId, setWarehouseId] = useState('none');
  const [pricingTierId, setPricingTierId] = useState('none');

  const { data: search } = useSearchItemsQuery({ orgId, q }, { skip: !open });
  const { data: bundle } = useGetInventorySettingsQuery(orgId, { skip: !open });
  const [addLine, { isLoading }] = useAddDealLineItemMutation();

  const items = search?.items ?? [];
  const selected = items.find((i) => String(i.id) === itemId);

  const itemOptions = useMemo(
    () => items.map((i) => ({ value: String(i.id), label: `${i.sku} · ${i.name}` })),
    [items]
  );

  useEffect(() => {
    if (selected?.pricing_tier_id) setPricingTierId(String(selected.pricing_tier_id));
  }, [selected?.id, selected?.pricing_tier_id]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!itemId) return;
    try {
      await addLine({
        orgId,
        dealId,
        itemId: Number(itemId),
        quantity: Number(quantity),
        warehouseId: warehouseId && warehouseId !== 'none' ? Number(warehouseId) : undefined,
        pricingTierId: pricingTierId && pricingTierId !== 'none' ? Number(pricingTierId) : undefined,
      }).unwrap();
      toast.success('Item added to deal');
      setOpen(false);
      setItemId('');
      setQuantity('1');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add item'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add item to Deal</Button>
      </DialogTrigger>
      <DialogContent title="Add item to Deal" description="Search the catalog and attach a quantity.">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Search
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SKU or name" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Item
            <SelectField value={itemId} onValueChange={setItemId} options={itemOptions} placeholder="Pick an item" />
          </label>
          {selected ? (
            <p className="text-xs text-muted-foreground">
              List price {formatMoney(selected.unit_price)} · on hand {selected.on_hand ?? 0}
            </p>
          ) : null}
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Quantity
            <Input type="number" min="0.0001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Warehouse (optional)
            <SelectField
              value={warehouseId}
              onValueChange={setWarehouseId}
              options={[
                { value: 'none', label: 'None' },
                ...(bundle?.warehouses ?? []).map((w) => ({ value: String(w.id), label: w.name })),
              ]}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Pricing tier (optional)
            <SelectField
              value={pricingTierId}
              onValueChange={setPricingTierId}
              options={[
                { value: 'none', label: 'List price' },
                ...(bundle?.pricingTiers ?? []).map((t) => ({
                  value: String(t.id),
                  label: `${t.name} (${t.discount_percent}% off)`,
                })),
              ]}
            />
          </label>
          <DialogFooter>
            <Button type="submit" size="sm" disabled={isLoading || !itemId}>
              {isLoading ? 'Adding...' : 'Add to deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
