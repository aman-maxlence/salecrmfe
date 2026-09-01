import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from '@/modules/settings/components/ui/Dialog';
import { Button } from '@/modules/settings/components/ui/Button';
import { Input } from '@/modules/settings/components/ui/Input';
import { SelectField } from '@/modules/settings/components/ui/Select';
import { getErrorMessage } from '@/modules/settings/models';
import { useCreateItemMutation, useGetInventorySettingsQuery, useUpdateItemMutation } from '../services/inventoryApi';
import { InventoryItem } from '../models';

const NONE = '__none__';

export function ItemFormDialog({
  orgId,
  item,
  trigger,
}: {
  orgId: number | string;
  item?: InventoryItem;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { data: bundle } = useGetInventorySettingsQuery(orgId, { skip: !open });
  const [createItem, { isLoading: creating }] = useCreateItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateItemMutation();
  const isLoading = creating || updating;
  const fields = bundle?.settings.catalog_fields;

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unitPrice, setUnitPrice] = useState('0');
  const [tax, setTax] = useState('0');
  const [uomId, setUomId] = useState(NONE);
  const [pricingTierId, setPricingTierId] = useState(NONE);
  const [lowStockThreshold, setLowStockThreshold] = useState('');

  useEffect(() => {
    if (!open) return;
    setSku(item?.sku ?? '');
    setName(item?.name ?? '');
    setCategory(item?.category ?? '');
    setUnitPrice(item ? String(item.unit_price) : '0');
    setTax(item ? String(item.tax) : '0');
    setUomId(item?.uom_id ? String(item.uom_id) : NONE);
    setPricingTierId(item?.pricing_tier_id ? String(item.pricing_tier_id) : NONE);
    setLowStockThreshold(item?.low_stock_threshold != null ? String(item.low_stock_threshold) : '');
  }, [open, item]);

  const show = (key: 'sku' | 'name' | 'category' | 'unitPrice' | 'tax') => fields?.[key]?.enabled !== false;
  const label = (key: 'sku' | 'name' | 'category' | 'unitPrice' | 'tax', fallback: string) =>
    fields?.[key]?.label || fallback;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const body = {
      name,
      sku,
      category,
      unitPrice: Number(unitPrice),
      tax: Number(tax),
      uomId: uomId === NONE ? null : Number(uomId),
      pricingTierId: pricingTierId === NONE ? null : Number(pricingTierId),
      lowStockThreshold: lowStockThreshold === '' ? null : Number(lowStockThreshold),
    };
    try {
      if (item) {
        await updateItem({ orgId, id: item.id, body }).unwrap();
        toast.success('Item updated');
      } else {
        await createItem({ orgId, body }).unwrap();
        toast.success('Item created');
      }
      setOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save item'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={item ? 'Edit item' : 'New item'} description="Catalog fields follow Inventory settings.">
        <form onSubmit={onSubmit} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
          {show('sku') ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {label('sku', 'SKU')}
              <Input value={sku} onChange={(e) => setSku(e.target.value)} required={fields?.sku?.required} />
            </label>
          ) : null}
          {show('name') ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {label('name', 'Name')}
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          ) : null}
          {show('category') ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {label('category', 'Category')}
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </label>
          ) : null}
          {show('unitPrice') ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {label('unitPrice', 'Unit price')}
              <Input type="number" min="0" step="any" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            </label>
          ) : null}
          {show('tax') ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {label('tax', 'Tax %')}
              <Input type="number" min="0" max="100" step="any" value={tax} onChange={(e) => setTax(e.target.value)} />
            </label>
          ) : null}
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Unit of measure
            <SelectField
              value={uomId}
              onValueChange={setUomId}
              options={[
                { value: NONE, label: 'None' },
                ...(bundle?.units ?? []).map((u) => ({ value: String(u.id), label: `${u.name} (${u.abbreviation})` })),
              ]}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Default pricing tier
            <SelectField
              value={pricingTierId}
              onValueChange={setPricingTierId}
              options={[
                { value: NONE, label: 'None' },
                ...(bundle?.pricingTiers ?? []).map((t) => ({ value: String(t.id), label: t.name })),
              ]}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Low-stock threshold override
            <Input
              type="number"
              min="0"
              step="any"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              placeholder="Use org default"
            />
          </label>
          <DialogFooter>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Saving...' : item ? 'Save changes' : 'Create item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
