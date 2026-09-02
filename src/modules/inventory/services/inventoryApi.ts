import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/api';
import { INVENTORY_API_ENDPOINTS } from '@/app/apiEndpoints';
import { ApiSuccessResponse } from '@/modules/settings/models';
import {
  InventoryItem,
  InventorySettingsBundle,
  ItemSearchResult,
  LowStockAlert,
  PricingTier,
  StockAdjustment,
  StockAdjustmentType,
  UnitOfMeasure,
  Warehouse,
} from '../models';

export interface ItemSearchArgs {
  orgId: number | string;
  q?: string;
  category?: string;
  groupByCategory?: boolean;
}

export interface ItemPayload {
  sku?: string;
  name: string;
  category?: string;
  unitPrice?: number;
  tax?: number;
  uomId?: number | null;
  pricingTierId?: number | null;
  lowStockThreshold?: number | null;
  status?: 'active' | 'inactive';
}

export interface AdjustStockBody {
  type: StockAdjustmentType;
  itemId: number;
  quantity: number;
  warehouseId?: number;
  fromWarehouseId?: number;
  toWarehouseId?: number;
  reason?: string;
}

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['InventorySettings', 'InventoryItem', 'InventoryAlert'],
  endpoints: (builder) => ({
    getInventorySettings: builder.query<InventorySettingsBundle, number | string>({
      query: (orgId) => ({ url: INVENTORY_API_ENDPOINTS.SETTINGS(orgId), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<InventorySettingsBundle>) => response.data,
      providesTags: ['InventorySettings'],
    }),

    updateInventorySettings: builder.mutation<
      InventorySettingsBundle,
      {
        orgId: number | string;
        catalogFields?: InventorySettingsBundle['settings']['catalog_fields'];
        lowStockThreshold?: number;
        reorderAlertsEnabled?: boolean;
      }
    >({
      query: ({ orgId, ...body }) => ({
        url: INVENTORY_API_ENDPOINTS.SETTINGS(orgId),
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<InventorySettingsBundle>) => response.data,
      invalidatesTags: ['InventorySettings', 'InventoryAlert'],
    }),

    createUom: builder.mutation<UnitOfMeasure, { orgId: number | string; name: string; abbreviation: string }>({
      query: ({ orgId, ...body }) => ({ url: INVENTORY_API_ENDPOINTS.UOMS(orgId), method: 'POST', body }),
      transformResponse: (response: ApiSuccessResponse<UnitOfMeasure>) => response.data,
      invalidatesTags: ['InventorySettings'],
    }),

    deleteUom: builder.mutation<void, { orgId: number | string; id: number }>({
      query: ({ orgId, id }) => ({ url: INVENTORY_API_ENDPOINTS.UOM(orgId, id), method: 'DELETE' }),
      invalidatesTags: ['InventorySettings'],
    }),

    createPricingTier: builder.mutation<
      PricingTier,
      { orgId: number | string; name: string; discountPercent: number }
    >({
      query: ({ orgId, ...body }) => ({ url: INVENTORY_API_ENDPOINTS.PRICING_TIERS(orgId), method: 'POST', body }),
      transformResponse: (response: ApiSuccessResponse<PricingTier>) => response.data,
      invalidatesTags: ['InventorySettings'],
    }),

    deletePricingTier: builder.mutation<void, { orgId: number | string; id: number }>({
      query: ({ orgId, id }) => ({ url: INVENTORY_API_ENDPOINTS.PRICING_TIER(orgId, id), method: 'DELETE' }),
      invalidatesTags: ['InventorySettings'],
    }),

    createWarehouse: builder.mutation<
      Warehouse,
      { orgId: number | string; name: string; code: string; location?: string }
    >({
      query: ({ orgId, ...body }) => ({ url: INVENTORY_API_ENDPOINTS.WAREHOUSES(orgId), method: 'POST', body }),
      transformResponse: (response: ApiSuccessResponse<Warehouse>) => response.data,
      invalidatesTags: ['InventorySettings'],
    }),

    deleteWarehouse: builder.mutation<void, { orgId: number | string; id: number }>({
      query: ({ orgId, id }) => ({ url: INVENTORY_API_ENDPOINTS.WAREHOUSE(orgId, id), method: 'DELETE' }),
      invalidatesTags: ['InventorySettings'],
    }),

    searchItems: builder.query<ItemSearchResult, ItemSearchArgs>({
      query: ({ orgId, q, category, groupByCategory }) => ({
        url: INVENTORY_API_ENDPOINTS.ITEMS(orgId),
        method: 'GET',
        params: {
          ...(q ? { q } : {}),
          ...(category ? { category } : {}),
          ...(groupByCategory ? { groupByCategory: 'true' } : {}),
        },
      }),
      transformResponse: (response: ApiSuccessResponse<ItemSearchResult>) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({ type: 'InventoryItem' as const, id: item.id })),
              { type: 'InventoryItem' as const, id: 'LIST' },
            ]
          : [{ type: 'InventoryItem' as const, id: 'LIST' }],
    }),

    getItem: builder.query<InventoryItem, { orgId: number | string; id: number | string }>({
      query: ({ orgId, id }) => ({ url: INVENTORY_API_ENDPOINTS.ITEM(orgId, id), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<InventoryItem>) => response.data,
      providesTags: (_r, _e, { id }) => [{ type: 'InventoryItem', id }],
    }),

    createItem: builder.mutation<InventoryItem, { orgId: number | string; body: ItemPayload }>({
      query: ({ orgId, body }) => ({ url: INVENTORY_API_ENDPOINTS.ITEMS(orgId), method: 'POST', body }),
      transformResponse: (response: ApiSuccessResponse<InventoryItem>) => response.data,
      invalidatesTags: [{ type: 'InventoryItem', id: 'LIST' }],
    }),

    updateItem: builder.mutation<InventoryItem, { orgId: number | string; id: number | string; body: ItemPayload }>({
      query: ({ orgId, id, body }) => ({ url: INVENTORY_API_ENDPOINTS.ITEM(orgId, id), method: 'PUT', body }),
      transformResponse: (response: ApiSuccessResponse<InventoryItem>) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'InventoryItem', id },
        { type: 'InventoryItem', id: 'LIST' },
      ],
    }),

    /** Archives the item (backend soft-deletes: status -> 'inactive') - blocked if it's on any deal line items. */
    deleteItem: builder.mutation<void, { orgId: number | string; id: number | string }>({
      query: ({ orgId, id }) => ({ url: INVENTORY_API_ENDPOINTS.ITEM(orgId, id), method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'InventoryItem', id },
        { type: 'InventoryItem', id: 'LIST' },
      ],
    }),

    adjustStock: builder.mutation<StockAdjustment, { orgId: number | string; body: AdjustStockBody }>({
      query: ({ orgId, body }) => ({ url: INVENTORY_API_ENDPOINTS.ADJUST(orgId), method: 'POST', body }),
      transformResponse: (response: ApiSuccessResponse<StockAdjustment>) => response.data,
      invalidatesTags: ['InventoryItem', 'InventoryAlert'],
    }),

    getLowStockAlerts: builder.query<LowStockAlert[], number | string>({
      query: (orgId) => ({ url: INVENTORY_API_ENDPOINTS.ALERTS(orgId), method: 'GET' }),
      transformResponse: (response: ApiSuccessResponse<LowStockAlert[]>) => response.data,
      providesTags: ['InventoryAlert'],
    }),
  }),
});

export const {
  useGetInventorySettingsQuery,
  useUpdateInventorySettingsMutation,
  useCreateUomMutation,
  useDeleteUomMutation,
  useCreatePricingTierMutation,
  useDeletePricingTierMutation,
  useCreateWarehouseMutation,
  useDeleteWarehouseMutation,
  useSearchItemsQuery,
  useGetItemQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useAdjustStockMutation,
  useGetLowStockAlertsQuery,
} = inventoryApi;
