import { useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogTrigger } from './ui/Dialog';
import { TerritorySelect } from './TerritorySelect';
import { useGetUsersQuery, useUpdateUserTerritoryMutation } from '../services/usersApi';
import { getErrorMessage, Territory } from '../models';

/**
 * Shows the members currently assigned to one territory and lets an admin
 * reassign them in place - reuses the same TerritorySelect + mutation
 * MembersTable already uses, just scoped to one territory's roster.
 */
export function TerritoryMembersPanel({
  orgId,
  territory,
  trigger,
}: {
  orgId: number | string;
  territory: Territory;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { data: members, isLoading } = useGetUsersQuery(orgId, { skip: !orgId || !open });
  const [updateUserTerritory] = useUpdateUserTerritoryMutation();

  const assigned = (members ?? []).filter((m) => m.territory_id === territory.id);

  const handleReassign = async (userId: number | string, territoryId: number | undefined) => {
    if (territoryId === undefined) return;
    try {
      await updateUserTerritory({ orgId, userId, territoryId }).unwrap();
      toast.success('Territory updated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update territory'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={`Members in "${territory.name}"`}
        description="Reassign a member to a different territory, or remove them from this one."
      >
        {isLoading ? <p className="text-sm text-muted-foreground">Loading members...</p> : null}
        {!isLoading && assigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members are assigned to this territory yet.</p>
        ) : null}
        {assigned.length > 0 ? (
          <div className="flex flex-col gap-3">
            {assigned.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{member.name ?? `User #${member.user_id}`}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email ?? '-'}</p>
                </div>
                <div className="w-48 shrink-0">
                  <TerritorySelect
                    value={member.territory_id ?? undefined}
                    onChange={(territoryId) => handleReassign(member.user_id, territoryId)}
                    allowNone={false}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
