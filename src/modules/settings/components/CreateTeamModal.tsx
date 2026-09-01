import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { RootState } from '@/store/store';
import { useGetDepartmentsQuery } from '../services/departmentsApi';
import { useGetTerritoriesQuery } from '../services/territoriesApi';
import { useGetUsersQuery } from '../services/usersApi';
import { useCreateTeamMutation, useUpdateTeamMutation } from '../services/teamsApi';
import { getErrorMessage, PortalUser, Team } from '../models';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Dialog, DialogContent, DialogFooter } from './ui/Dialog';

/**
 * Create AND edit a team - a team always nests under exactly one Department
 * and one Territory. Shared by Hierarchy Management and the Team & Invites
 * page(s) so team creation/editing works the same way everywhere. Pass
 * `team` to edit an existing one; omit it to create a new one.
 */
export function CreateTeamModal({
  open,
  onOpenChange,
  team,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team | null;
}) {
  const org = useSelector((state: RootState) => state.auth.organization);
  const orgId = org?.id;
  const isEditing = !!team;

  const { data: apiDepartments } = useGetDepartmentsQuery(orgId ?? 0, { skip: !orgId });
  const { data: apiTerritories } = useGetTerritoriesQuery(orgId ?? 0, { skip: !orgId });
  const { data: members, refetch: refetchUsers } = useGetUsersQuery(orgId ?? 0, { skip: !orgId });
  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
  const [updateTeam, { isLoading: isUpdating }] = useUpdateTeamMutation();
  const isSaving = isCreating || isUpdating;

  const departmentsList = apiDepartments ?? [];
  const territories = apiTerritories ?? [];
  const userList: PortalUser[] = members ?? [];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deptId, setDeptId] = useState('');
  const [territoryId, setTerritoryId] = useState('');
  const [managerUserId, setManagerUserId] = useState('');
  const [memberUserIds, setMemberUserIds] = useState<(number | string)[]>([]);

  // Reset (or pre-fill, when editing) every time the modal opens.
  useEffect(() => {
    if (!open) return;
    if (team) {
      setName(team.name);
      setDescription(team.description ?? '');
      setDeptId(String(team.department_id));
      setTerritoryId(String(team.territory_id));
      setManagerUserId(team.manager_user_id ? String(team.manager_user_id) : '');
      setMemberUserIds((team.members ?? []).map((m) => m.user_id));
    } else {
      setName('');
      setDescription('');
      setDeptId('');
      setTerritoryId('');
      setManagerUserId('');
      setMemberUserIds([]);
    }
  }, [open, team]);

  const territoryMembers: PortalUser[] = territoryId
    ? userList.filter((u) => String(u.territory_id) === territoryId)
    : [];

  const toggleMember = (userId: number | string) => {
    setMemberUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter team name');
      return;
    }
    if (!deptId) {
      toast.error('Please select a department');
      return;
    }
    if (!territoryId) {
      toast.error('Please select a territory');
      return;
    }
    if (!orgId) return;

    try {
      if (isEditing && team) {
        await updateTeam({
          orgId,
          id: team.id,
          name: name.trim(),
          departmentId: deptId,
          territoryId,
          description: description.trim() || null,
          managerUserId: managerUserId || null,
          memberUserIds,
        }).unwrap();
        toast.success(`Team "${name}" updated successfully!`);
      } else {
        await createTeam({
          orgId,
          body: {
            name: name.trim(),
            departmentId: deptId,
            territoryId,
            description: description.trim() || undefined,
            managerUserId: managerUserId || undefined,
            memberUserIds,
          },
        }).unwrap();
        toast.success(`Team "${name}" created successfully!`);
      }
      onOpenChange(false);
      // Creating/editing a team sets team_id on its members server-side
      // (usersApi's own cache), which teamsApi's tag invalidation can't know
      // about - refetch explicitly so anything reading `team_id` picks it up.
      refetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} team`));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEditing ? 'Edit Team' : 'Add New Team'}
        description="Pick a department and a territory first - the team's member picker is scoped to that territory"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Select Department <span className="text-destructive">*</span>
            </label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a Department</option>
              {departmentsList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Select Territory <span className="text-destructive">*</span>
            </label>
            <select
              value={territoryId}
              onChange={(e) => {
                // Members/manager are scoped to the territory - clear them on
                // an actual user change so a stale pick from the previous
                // territory can't leak through (but not on the initial
                // pre-fill when opening in edit mode - that sets all three
                // fields together via the effect above).
                setTerritoryId(e.target.value);
                setMemberUserIds([]);
                setManagerUserId('');
              }}
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a Territory</option>
              {territories.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              {isEditing
                ? 'Changing the territory clears current members unless you reselect them below'
                : 'This team will belong to the selected department and territory'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Team Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g., Enterprise Sales, Digital Marketing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-border"
            />
          </div>

          {territoryId && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Team Manager (optional)</label>
                <select
                  value={managerUserId}
                  onChange={(e) => setManagerUserId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">No manager</option>
                  {territoryMembers.map((u) => (
                    <option key={u.id} value={u.user_id}>
                      {u.name || u.email} ({u.role?.role_name || 'Member'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Members from this territory ({memberUserIds.length} selected)
                </label>
                {territoryMembers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                    No members assigned to this territory yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {territoryMembers.map((u) => {
                      const checked = memberUserIds.some((id) => String(id) === String(u.user_id));
                      const memberName = u.name || u.email || 'User';
                      return (
                        <label
                          key={u.id}
                          className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 cursor-pointer hover:bg-accent"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMember(u.user_id)}
                            className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-white text-xs font-bold flex-shrink-0">
                            {memberName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{memberName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{u.role?.role_name || 'Member'}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description (optional)</label>
            <textarea
              placeholder="What does this team do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTeamModal;
