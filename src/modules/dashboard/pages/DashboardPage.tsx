import { usePermissions } from '@/modules/settings/hooks/usePermissions';
import { LowStockWidget } from '@/modules/inventory/components/LowStockWidget';

export default function DashboardPage() {
  const { hasAnyPermission, isLoading } = usePermissions();
  const showInventory = isLoading || hasAnyPermission(['view_inventory', 'manage_inventory', 'adjust_stock']);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your sales workspace.</p>
      </div>
      {showInventory ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <LowStockWidget />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Widgets will appear here as you gain access to more modules.</p>
      )}
    </div>
  );
}
