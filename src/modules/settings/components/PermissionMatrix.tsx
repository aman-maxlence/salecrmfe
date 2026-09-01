import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { PERMISSION_GROUPS, Role, getErrorMessage } from '../models';
import { useUpdateRolePermissionsMutation } from '../services/rolesApi';
import { Switch } from './ui/Switch';
import { Button } from './ui/Button';

export function PermissionMatrix({
  orgId,
  role,
  readOnly,
}: {
  orgId: number | string;
  role: Role;
  readOnly: boolean;
}) {
  const [draft, setDraft] = useState<Record<string, boolean>>(role.permissions ?? {});
  const [updatePermissions, { isLoading }] = useUpdateRolePermissionsMutation();

  // Reset local draft whenever the underlying role data changes (e.g. after
  // a successful save, or navigating between roles).
  useEffect(() => {
    setDraft(role.permissions ?? {});
  }, [role.id, role.permissions]);

  const changedKeys = useMemo(
    () =>
      Object.keys(draft).filter((key) => Boolean(draft[key]) !== Boolean(role.permissions?.[key])),
    [draft, role.permissions]
  );

  const isDirty = changedKeys.length > 0;

  const toggle = (key: string, checked: boolean) => {
    if (readOnly) return;
    setDraft((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSave = async () => {
    if (!isDirty) return;
    const changedOnly: Record<string, boolean> = {};
    changedKeys.forEach((key) => {
      changedOnly[key] = draft[key];
    });
    try {
      await updatePermissions({ orgId, id: role.id, permissions: changedOnly }).unwrap();
      toast.success('Permissions updated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update permissions'));
      setDraft(role.permissions ?? {});
    }
  };

  const handleReset = () => setDraft(role.permissions ?? {});

  return (
    <div className="flex flex-col gap-6">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.title} className="rounded-lg border border-border">
          <div className="border-b border-border bg-muted/40 px-4 py-2 text-sm font-semibold">
            {group.title}
          </div>
          <div className="divide-y divide-border">
            {group.permissions.map((perm) => (
              <div key={perm.key} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <div>
                  <div className="text-sm">{perm.label}</div>
                  <div className="text-xs text-muted-foreground">{perm.key}</div>
                </div>
                <Switch
                  checked={Boolean(draft[perm.key])}
                  onCheckedChange={(checked) => toggle(perm.key, checked)}
                  disabled={readOnly || isLoading}
                  aria-label={perm.label}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {!readOnly ? (
        <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <span className="text-sm text-muted-foreground">
            {isDirty ? `${changedKeys.length} permission(s) changed` : 'No changes'}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={!isDirty || isLoading}>
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty || isLoading}>
              {isLoading ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
