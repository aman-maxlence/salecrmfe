export interface DealLineItem {
  id: number;
  deal_id: number;
  item_id: number;
  quantity: number | string;
  unit_price: number | string;
  tax: number | string;
  pricing_tier_id: number | null;
  warehouse_id: number | null;
  item?: { id: number; sku: string; name: string };
  pricingTier?: { id: number; name: string; discount_percent: number | string } | null;
  warehouse?: { id: number; name: string; code: string } | null;
}

export interface Deal {
  id: number;
  org_id: number;
  title: string;
  stage: string;
  status: 'open' | 'won' | 'lost';
  owner_user_id: number | null;
  lineItems?: DealLineItem[];
  created_at: string;
  updated_at: string;
}
