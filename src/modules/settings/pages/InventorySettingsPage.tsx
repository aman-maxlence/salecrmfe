import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { RootState } from '@/store/store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { getErrorMessage } from '../models';
import { usePermissions } from '../hooks/usePermissions';
import {
  useCreatePricingTierMutation,
  useCreateUomMutation,
  useCreateWarehouseMutation,
  useDeletePricingTierMutation,
  useDeleteUomMutation,
  useDeleteWarehouseMutation,
  useGetInventorySettingsQuery,
  useUpdateInventorySettingsMutation,
} from '@/modules/inventory/services/inventoryApi';
import { CatalogFieldKey } from '@/modules/inventory/models';

const FIELD_KEYS: CatalogFieldKey[] = ['sku', 'name', 'category', 'unitPrice', 'tax'];

export default function InventorySettingsPage() {
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { hasPermission, isLoading: permsLoading } = usePermissions();
  const canManage = permsLoading ? true : hasPermission('manage_inventory_settings') || hasPermission('manage_organization_settings');
  const { data, isLoading, isError } = useGetInventorySettingsQuery(orgId ?? 0, { skip: !orgId });
  const [updateSettings, { isLoading: saving }] = useUpdateInventorySettingsMutation();

  const [fields, setFields] = useState(data?.settings.catalog_fields);
  const [threshold, setThreshold] = useState('5');
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  useEffect(() => {
    if (!data) return;
    setFields(data.settings.catalog_fields);
    setThreshold(String(data.settings.low_stock_threshold));
    setAlertsEnabled(data.settings.reorder_alerts_enabled);
  }, [data]);

  if (!orgId) return <p className="text-sm text-muted-foreground">No organization in context.</p>;
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading inventory settings...</p>;
  if (isError || !data || !fields) return <p className="text-sm text-destructive">Failed to load inventory settings.</p>;

  const saveCatalogAndAlerts = async () => {
    try {
      await updateSettings({
        orgId,
        catalogFields: fields,
        lowStockThreshold: Number(threshold),
        reorderAlertsEnabled: alertsEnabled,
      }).unwrap();
      toast.success('Inventory settings saved');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save settings'));
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Catalog fields, units, warehouses, and reorder alerts. Access to inventory records is granted in{' '}
          <Link to="/settings/roles" className="text-primary hover:underline">
            Roles & Permissions
          </Link>
          .
        </p>
      </div>

      <section className="rounded-lg border border-border">
        <header className="border-b border-border bg-muted/40 px-4 py-2 text-sm font-semibold">
          Item / product catalog fields
        </header>
        <div className="divide-y divide-border">
          {FIELD_KEYS.map((key) => (
            <div key={key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-sm font-medium">{fields[key].label}</div>
                <div className="text-xs text-muted-foreground">{key}</div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs">
                  Enabled
                  <Switch
                    checked={fields[key].enabled}
                    disabled={!canManage || key === 'name'}
                    onCheckedChange={(checked) =>
                      setFields((prev) => prev && { ...prev, [key]: { ...prev[key], enabled: checked, required: checked ? prev[key].required : false } })
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-xs">
                  Required
                  <Switch
                    checked={fields[key].required}
                    disabled={!canManage || key === 'name' || !fields[key].enabled}
                    onCheckedChange={(checked) =>
                      setFields((prev) => prev && { ...prev, [key]: { ...prev[key], required: checked } })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <UnitsAndTiers orgId={orgId} canManage={canManage} />
      <Warehouses orgId={orgId} canManage={canManage} />

      <section className="rounded-lg border border-border">
        <header className="border-b border-border bg-muted/40 px-4 py-2 text-sm font-semibold">
          Low-stock threshold and reorder alerts
        </header>
        <div className="flex flex-col gap-4 p-4">
          <label className="flex max-w-xs flex-col gap-1.5 text-sm font-medium">
            Default threshold
            <Input type="number" min="0" step="any" value={threshold} disabled={!canManage} onChange={(e) => setThreshold(e.target.value)} />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>
              Reorder-alert job
              <span className="block text-xs font-normal text-muted-foreground">
                Opens alerts when on-hand quantity at a warehouse is at or below the threshold.
              </span>
            </span>
            <Switch checked={alertsEnabled} disabled={!canManage} onCheckedChange={setAlertsEnabled} />
          </label>
        </div>
      </section>

      {canManage ? (
        <div>
          <Button size="sm" onClick={saveCatalogAndAlerts} disabled={saving}>
            {saving ? 'Saving...' : 'Save catalog & alert settings'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function UnitsAndTiers({ orgId, canManage }: { orgId: number | string; canManage: boolean }) {
  const { data } = useGetInventorySettingsQuery(orgId);
  const [createUom] = useCreateUomMutation();
  const [deleteUom] = useDeleteUomMutation();
  const [createTier] = useCreatePricingTierMutation();
  const [deleteTier] = useDeletePricingTierMutation();
  const [uomName, setUomName] = useState('');
  const [uomAbbr, setUomAbbr] = useState('');
  const [tierName, setTierName] = useState('');
  const [tierDiscount, setTierDiscount] = useState('0');

  const addUom = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createUom({ orgId, name: uomName, abbreviation: uomAbbr }).unwrap();
      setUomName('');
      setUomAbbr('');
      toast.success('Unit added');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add unit'));
    }
  };

  const addTier = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createTier({ orgId, name: tierName, discountPercent: Number(tierDiscount) }).unwrap();
      setTierName('');
      setTierDiscount('0');
      toast.success('Pricing tier added');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add pricing tier'));
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-border">
        <header className="border-b border-border bg-muted/40 px-4 py-2 text-sm font-semibold">Units of measure</header>
        <ul className="divide-y divide-border">
          {data?.units.map((uom) => (
            <li key={uom.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span>
                {uom.name} <span className="text-muted-foreground">({uom.abbreviation})</span>
              </span>
              {canManage ? (
                <Button variant="ghost" size="sm" onClick={() => deleteUom({ orgId, id: uom.id })}>
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {canManage ? (
          <form onSubmit={addUom} className="flex gap-2 border-t border-border p-3">
            <Input placeholder="Name" value={uomName} onChange={(e) => setUomName(e.target.value)} />
            <Input placeholder="Abbr" className="w-24" value={uomAbbr} onChange={(e) => setUomAbbr(e.target.value)} />
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
        ) : null}
      </div>
      <div className="rounded-lg border border-border">
        <header className="border-b border-border bg-muted/40 px-4 py-2 text-sm font-semibold">Pricing tiers</header>
        <ul className="divide-y divide-border">
          {data?.pricingTiers.map((tier) => (
            <li key={tier.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span>
                {tier.name} <span className="text-muted-foreground">({tier.discount_percent}% off)</span>
              </span>
              {canManage ? (
                <Button variant="ghost" size="sm" onClick={() => deleteTier({ orgId, id: tier.id })}>
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {canManage ? (
          <form onSubmit={addTier} className="flex gap-2 border-t border-border p-3">
            <Input placeholder="Name" value={tierName} onChange={(e) => setTierName(e.target.value)} />
            <Input placeholder="%" className="w-20" type="number" value={tierDiscount} onChange={(e) => setTierDiscount(e.target.value)} />
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
        ) : null}
      </div>
    </section>
  );
}

function Warehouses({ orgId, canManage }: { orgId: number | string; canManage: boolean }) {
  const { data } = useGetInventorySettingsQuery(orgId);
  const [createWarehouse] = useCreateWarehouseMutation();
  const [deleteWarehouse] = useDeleteWarehouseMutation();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');

  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createWarehouse({ orgId, name, code, location }).unwrap();
      setName('');
      setCode('');
      setLocation('');
      toast.success('Warehouse added');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add warehouse'));
    }
  };

  return (
    <section className="rounded-lg border border-border">
      <header className="border-b border-border bg-muted/40 px-4 py-2 text-sm font-semibold">
        Warehouses / stock locations
      </header>
      <ul className="divide-y divide-border">
        {data?.warehouses.map((wh) => (
          <li key={wh.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <div>
              <div className="font-medium">
                {wh.name} <span className="font-mono text-xs text-muted-foreground">{wh.code}</span>
              </div>
              {wh.location ? <div className="text-xs text-muted-foreground">{wh.location}</div> : null}
            </div>
            {canManage ? (
              <Button variant="ghost" size="sm" onClick={() => deleteWarehouse({ orgId, id: wh.id })}>
                Remove
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {canManage ? (
        <form onSubmit={add} className="grid gap-2 border-t border-border p-3 sm:grid-cols-4">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Button type="submit" size="sm">
            Add warehouse
          </Button>
        </form>
      ) : null}
    </section>
  );
}
