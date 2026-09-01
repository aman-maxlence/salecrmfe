import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useDeleteRoleMutation, useGetRolesQuery } from '../services/rolesApi';
import { Role, getErrorMessage, isRoleProtected } from '../models';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { RoleFormDialog } from '../components/RoleFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function RolesPage() {
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const navigate = useNavigate();
  const { hasPermission, isLoading: permsLoading } = usePermissions();
  const canManageRoles = permsLoading ? true : hasPermission('manage_roles');

  const { data: roles, isLoading, isError } = useGetRolesQuery(orgId ?? 0, { skip: !orgId });
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const [pendingDelete, setPendingDelete] = useState<Role | null>(null);

  if (!orgId) {
    return <p className="text-sm text-muted-foreground">No organization in context.</p>;
  }

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteRole({ orgId, id: pendingDelete.id }).unwrap();
      toast.success('Role deleted');
      setPendingDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete role - it may still be assigned to a user'));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Define roles and control what each one can access.
          </p>
        </div>
        {canManageRoles ? (
          <RoleFormDialog
            orgId={orgId}
            onCreated={(roleId) => navigate(`/settings/roles/${roleId}`)}
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Create role
              </Button>
            }
          />
        ) : null}
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading roles...</p> : null}
      {isError ? <p className="text-sm text-destructive">Failed to load roles.</p> : null}

      {roles && roles.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Flags</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roles.map((role) => {
                const protectedRole = isRoleProtected(role);
                return (
                  <tr
                    key={role.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => navigate(`/settings/roles/${role.id}`)}
                  >
                    <td className="px-4 py-2.5 font-medium">{role.role_name}</td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-muted-foreground">
                      {role.description || '-'}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={role.status === 'active' ? 'success' : 'muted'}>
                        {role.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {role.is_admin ? <Badge tone="warning">Admin</Badge> : null}
                        {role.is_default ? <Badge tone="muted">Default</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={protectedRole ? 'Super Admin cannot be deleted' : 'Delete role'}
                          disabled={!canManageRoles || protectedRole || role.is_default}
                          onClick={() => setPendingDelete(role)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {!isLoading && roles && roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No roles yet.</p>
      ) : null}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.role_name}"?`}
        description="This cannot be undone. Roles still assigned to a user, or default roles, cannot be deleted."
        confirmLabel="Delete role"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
