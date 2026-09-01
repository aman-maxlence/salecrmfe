export type CatalogFieldKey = 'sku' | 'name' | 'category' | 'unitPrice' | 'tax';

export interface CatalogFieldConfig {
  enabled: boolean;
  required: boolean;
  label: string;
}

export interface InventorySettings {
  id: number;
  org_id: number;
  catalog_fields: Record<CatalogFieldKey, CatalogFieldConfig>;
  low_stock_threshold: number | string;
  reorder_alerts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnitOfMeasure {
  id: number;
  org_id: number;
  name: string;
  abbreviation: string;
  status: 'active' | 'inactive';
}

export interface PricingTier {
  id: number;
  org_id: number;
  name: string;
  discount_percent: number | string;
  status: 'active' | 'inactive';
}

export interface Warehouse {
  id: number;
  org_id: number;
  name: string;
  code: string;
  location: string | null;
  status: 'active' | 'inactive';
}

export interface StockLevel {
  id: number;
  item_id: number;
  warehouse_id: number;
  quantity: number | string;
  version: number;
  warehouse?: Warehouse;
}

export interface ItemPriceHistory {
  id: number;
  item_id: number;
  unit_price: number | string;
  changed_by: number | null;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  org_id: number;
  sku: string;
  name: string;
  category: string | null;
  unit_price: number | string;
  tax: number | string;
  uom_id: number | null;
  pricing_tier_id: number | null;
  low_stock_threshold: number | string | null;
  status: 'active' | 'inactive';
  on_hand?: number;
  uom?: UnitOfMeasure | null;
  pricingTier?: PricingTier | null;
  stockLevels?: StockLevel[];
  priceHistory?: ItemPriceHistory[];
  dealLineItems?: Array<{
    id: number;
    quantity: number | string;
    unit_price: number | string;
    deal?: { id: number; title: string; status: string };
  }>;
}

export interface ItemSearchResult {
  items: InventoryItem[];
  categories: string[];
  groups?: Record<string, InventoryItem[]>;
}

export interface InventorySettingsBundle {
  settings: InventorySettings;
  units: UnitOfMeasure[];
  pricingTiers: PricingTier[];
  warehouses: Warehouse[];
}

export type StockAdjustmentType = 'receive' | 'issue' | 'transfer';

export interface StockAdjustment {
  id: number;
  type: StockAdjustmentType;
  quantity: number | string;
  item_id: number;
  from_warehouse_id: number | null;
  to_warehouse_id: number | null;
  reason: string | null;
}

export interface LowStockAlert {
  id: number;
  item_id: number;
  warehouse_id: number;
  threshold: number | string;
  quantity: number | string;
  status: 'open' | 'resolved';
  item?: InventoryItem;
  warehouse?: Warehouse;
  updated_at: string;
}

export function formatMoney(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

export function formatQty(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
