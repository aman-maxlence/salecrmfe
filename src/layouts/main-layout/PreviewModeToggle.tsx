import { useState } from 'react';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import { SelectField } from '@/modules/settings/components/ui/Select';
import { getErrorMessage } from '@/modules/settings/models';
import { usePermissions } from '@/modules/settings/hooks/usePermissions';
import { useGetRolesQuery } from '@/modules/settings/services/rolesApi';
import { useSwitchMyContextMutation } from '@/modules/settings/services/usersApi';

/**
 * Dual-access preview: lets an admin (PortalUser.is_dual_access) see the app
 * the way a member with a given role would - "wear a user hat" to sanity-check
 * permissions without needing a second test account. Only ever rendered for
 * dual-access users; everyone else's PortalUser has is_dual_access: false and
 * this returns null. The actual permission swap happens server-side (see
 * PortalUserService.getWithRole) - this component just drives the toggle.
 */
export function PreviewModeToggle() {
  const { me, orgId } = usePermissions();
  const { data: roles } = useGetRolesQuery(orgId ?? 0, { skip: !orgId || !me?.is_dual_access });
  const [switchContext, { isLoading }] = useSwitchMyContextMutation();
  const [pendingRoleId, setPendingRoleId] = useState<string | undefined>(undefined);

  if (!me?.is_dual_access || !orgId) return null;

  const previewableRoles = (roles ?? []).filter((role) => !role.is_admin);
  const isPreviewing = me.active_context === 'user';

  const handlePreview = async (roleId: string) => {
    setPendingRoleId(roleId);
    try {
      await switchContext({ orgId, activeContext: 'user', previewRoleId: Number(roleId) }).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to switch preview role'));
    } finally {
      setPendingRoleId(undefined);
    }
  };

  const handleExit = async () => {
    try {
      await switchContext({ orgId, activeContext: 'admin' }).unwrap();
      toast.success('Back to admin view');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to exit preview'));
    }
  };

  if (isPreviewing) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-amber-100 px-3 py-1.5 text-sm text-amber-900">
        <Eye className="h-4 w-4" />
        Previewing as <span className="font-semibold">{me.role?.role_name ?? 'member'}</span>
        <button
          type="button"
          onClick={handleExit}
          disabled={isLoading}
          className="ml-1 inline-flex items-center gap-1 rounded border border-amber-900/30 px-2 py-0.5 text-xs font-medium transition-colors hover:bg-amber-900/10 disabled:opacity-50"
        >
          <EyeOff className="h-3 w-3" />
          Exit preview
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Eye className="h-4 w-4 text-muted-foreground" />
      <SelectField
        value={pendingRoleId}
        onValueChange={handlePreview}
        options={previewableRoles.map((role) => ({ value: String(role.id), label: role.role_name }))}
        placeholder="Preview as..."
        disabled={isLoading || previewableRoles.length === 0}
        className="h-8 w-40 text-xs"
      />
    </div>
  );
}
