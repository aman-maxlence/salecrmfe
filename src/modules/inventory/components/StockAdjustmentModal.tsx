import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from '@/modules/settings/components/ui/Dialog';
import { Button } from '@/modules/settings/components/ui/Button';
import { Input } from '@/modules/settings/components/ui/Input';
import { SelectField } from '@/modules/settings/components/ui/Select';
import { getErrorMessage } from '@/modules/settings/models';
import { useAdjustStockMutation, useGetInventorySettingsQuery } from '../services/inventoryApi';
import { InventoryItem, StockAdjustmentType } from '../models';

export function StockAdjustmentModal({
  orgId,
  item,
  trigger,
}: {
  orgId: number | string;
  item: Pick<InventoryItem, 'id' | 'name' | 'sku'>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<StockAdjustmentType>('receive');
  const [quantity, setQuantity] = useState('1');
  const [warehouseId, setWarehouseId] = useState('');
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [reason, setReason] = useState('');
  const { data: bundle } = useGetInventorySettingsQuery(orgId, { skip: !open });
  const [adjust, { isLoading }] = useAdjustStockMutation();

  const warehouses = (bundle?.warehouses ?? []).filter((w) => w.status === 'active');
  const warehouseOptions = warehouses.map((w) => ({ value: String(w.id), label: `${w.name} (${w.code})` }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);
    try {
      await adjust({
        orgId,
        body: {
          type,
          itemId: item.id,
          quantity: qty,
          reason: reason.trim() || undefined,
          ...(type === 'transfer'
            ? { fromWarehouseId: Number(fromWarehouseId), toWarehouseId: Number(toWarehouseId) }
            : { warehouseId: Number(warehouseId) }),
        },
      }).unwrap();
      toast.success('Stock updated');
      setOpen(false);
      setQuantity('1');
      setReason('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to adjust stock'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title="Adjust stock" description={`${item.sku} · ${item.name}`}>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Type
            <SelectField
              value={type}
              onValueChange={(v) => setType(v as StockAdjustmentType)}
              options={[
                { value: 'receive', label: 'Receive' },
                { value: 'issue', label: 'Issue' },
                { value: 'transfer', label: 'Transfer' },
              ]}
            />
          </label>
          {type === 'transfer' ? (
            <>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                From warehouse
                <SelectField value={fromWarehouseId} onValueChange={setFromWarehouseId} options={warehouseOptions} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                To warehouse
                <SelectField value={toWarehouseId} onValueChange={setToWarehouseId} options={warehouseOptions} />
              </label>
            </>
          ) : (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Warehouse
              <SelectField value={warehouseId} onValueChange={setWarehouseId} options={warehouseOptions} />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Quantity
            <Input type="number" min="0.0001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Reason
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
          </label>
          <DialogFooter>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Apply'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
