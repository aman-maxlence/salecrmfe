import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import { RootState } from '@/store/store';
import {
  useGetRoleAuditLogQuery,
  useGetRoleQuery,
  useUpdateRoleMutation,
} from '../services/rolesApi';
import { getErrorMessage, isRoleProtected, RoleStatus } from '../models';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionMatrix } from '../components/PermissionMatrix';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export default function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { hasPermission, isLoading: permsLoading } = usePermissions();
  const canManageRoles = permsLoading ? true : hasPermission('manage_roles');

  const {
    data: role,
    isLoading,
    isError,
  } = useGetRoleQuery({ orgId: orgId ?? 0, id: roleId ?? '' }, { skip: !orgId || !roleId });
  const { data: auditLog } = useGetRoleAuditLogQuery(
    { orgId: orgId ?? 0, id: roleId ?? '' },
    { skip: !orgId || !roleId }
  );
  const [updateRole, { isLoading: isSavingDetails }] = useUpdateRoleMutation();

  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (role) {
      setRoleName(role.role_name);
      setDescription(role.description ?? '');
    }
  }, [role]);

  if (!orgId) return <p className="text-sm text-muted-foreground">No organization in context.</p>;
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading role...</p>;
  if (isError || !role) return <p className="text-sm text-destructive">Role not found.</p>;

  const protectedRole = isRoleProtected(role);
  const readOnly = !canManageRoles || protectedRole;

  const handleSaveDetails = async () => {
    try {
      await updateRole({ orgId, id: role.id, roleName, description }).unwrap();
      toast.success('Role updated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update role'));
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus: RoleStatus = role.status === 'active' ? 'inactive' : 'active';
    try {
      await updateRole({ orgId, id: role.id, status: nextStatus }).unwrap();
      toast.success(`Role marked ${nextStatus}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update role status'));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          onClick={() => navigate('/settings/roles')}
          className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to roles
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{role.role_name}</h1>
          <Badge tone={role.status === 'active' ? 'success' : 'muted'}>{role.status}</Badge>
          {role.is_admin ? <Badge tone="warning">Admin</Badge> : null}
          {role.is_default ? <Badge tone="muted">Default</Badge> : null}
        </div>
        {protectedRole ? (
          <p className="mt-1 text-sm text-muted-foreground">
            This is a protected system role - its details and permissions cannot be changed.
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-border p-4">
        <h2 className="mb-3 text-sm font-semibold">Details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="roleName">
              Role name
            </label>
            <Input
              id="roleName"
              value={roleName}
              disabled={readOnly}
              onChange={(e) => setRoleName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="description">
              Description
            </label>
            <Input
              id="description"
              value={description}
              disabled={readOnly}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        {!readOnly ? (
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={handleSaveDetails} disabled={isSavingDetails}>
              {isSavingDetails ? 'Saving...' : 'Save details'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleToggleStatus} disabled={isSavingDetails}>
              Mark {role.status === 'active' ? 'inactive' : 'active'}
            </Button>
          </div>
        ) : null}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Permissions</h2>
        <PermissionMatrix orgId={orgId} role={role} readOnly={readOnly} />
      </div>

      {auditLog && auditLog.length > 0 ? (
        <div className="rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold">Audit log</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {auditLog.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <span className="capitalize">{entry.change_type.replace(/_/g, ' ')}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
