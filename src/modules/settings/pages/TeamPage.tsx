import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { UserPlus, Plus } from 'lucide-react';
import { RootState } from '@/store/store';
import { usePermissions } from '../hooks/usePermissions';
import { useGetUsersQuery, useRemoveUserMutation } from '../services/usersApi';
import { useGetTeamsQuery, useDeleteTeamMutation } from '../services/teamsApi';
import { getErrorMessage } from '../models';
import { InviteModal } from '../components/InviteModal';
import { CreateTeamModal } from '../components/CreateTeamModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Button } from '../components/ui/Button';

export default function TeamPage() {
  const navigate = useNavigate();
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { hasPermission, hasAnyPermission, isLoading: permsLoading } = usePermissions();

  const canManageUsers = permsLoading ? true : hasPermission('manage_users');
  const canInvite = permsLoading ? true : hasAnyPermission(['invite_users', 'manage_users']);
  const canManageTeams = permsLoading ? true : hasPermission('manage_teams');

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [pendingRemoveUser, setPendingRemoveUser] = useState<{ userId: number | string; name: string } | null>(null);
  const [pendingRemoveTeam, setPendingRemoveTeam] = useState<{ id: number; name: string } | null>(null);

  const { data: members } = useGetUsersQuery(orgId ?? 0, { skip: !orgId });
  const { data: teams } = useGetTeamsQuery({ orgId: orgId ?? 0 }, { skip: !orgId });
  const [removeUser, { isLoading: isRemovingUser }] = useRemoveUserMutation();
  const [deleteTeam, { isLoading: isRemovingTeam }] = useDeleteTeamMutation();

  const userList = members ?? [];
  const teamsList = teams ?? [];

  const handleRemoveUser = async () => {
    if (!pendingRemoveUser || !orgId) return;
    try {
      await removeUser({ orgId, userId: pendingRemoveUser.userId }).unwrap();
      toast.success(`${pendingRemoveUser.name} removed from the organization`);
      setPendingRemoveUser(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove user'));
    }
  };

  const handleRemoveTeam = async () => {
    if (!pendingRemoveTeam || !orgId) return;
    try {
      await deleteTeam({ orgId, id: pendingRemoveTeam.id }).unwrap();
      toast.success(`Team "${pendingRemoveTeam.name}" removed`);
      setPendingRemoveTeam(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove team'));
    }
  };

  if (!orgId) {
    return <p className="text-sm text-muted-foreground">No organization in context.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Team and Invites</h1>
        <p className="text-sm text-muted-foreground">
          Manage org members and teams.
        </p>
      </div>

      {/* Manage Users */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Manage Users</h2>
          {canInvite && (
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Location</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium text-right">Remove User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {userList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No members yet.
                  </td>
                </tr>
              ) : (
                userList.map((member) => {
                  const memberName = member.name ?? `User #${member.user_id}`;
                  return (
                    <tr key={member.id}>
                      <td className="px-4 py-2.5 font-medium">{memberName}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{member.territory?.name ?? '-'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{member.email ?? '-'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{member.role?.role_name ?? '-'}</td>
                      <td className="px-4 py-2.5 text-right">
                        {canManageUsers && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPendingRemoveUser({ userId: member.user_id, name: memberName })}
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Team List */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Team List</h2>
          {canManageTeams && (
            <Button onClick={() => setIsTeamModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Location</th>
                <th className="px-4 py-2.5 font-medium">Manager</th>
                <th className="px-4 py-2.5 font-medium">Number of members</th>
                <th className="px-4 py-2.5 font-medium text-right">Remove Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teamsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No teams yet.
                  </td>
                </tr>
              ) : (
                teamsList.map((team) => {
                  const manager = userList.find((u) => String(u.user_id) === String(team.manager_user_id));
                  const managerName = manager?.name || manager?.email || '-';
                  return (
                    <tr
                      key={team.id}
                      onClick={() => navigate(`/settings/team/${team.id}`)}
                      className="cursor-pointer hover:bg-accent/50"
                    >
                      <td className="px-4 py-2.5 font-medium">{team.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{team.territory?.name ?? '-'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{managerName}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{team.members?.length ?? 0}</td>
                      <td className="px-4 py-2.5 text-right">
                        {canManageTeams && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingRemoveTeam({ id: team.id, name: team.name });
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {canInvite ? (
        <InviteModal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} />
      ) : null}

      <CreateTeamModal open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen} />

      <ConfirmDialog
        open={!!pendingRemoveUser}
        onOpenChange={(open) => !open && setPendingRemoveUser(null)}
        title="Remove user?"
        description={`${pendingRemoveUser?.name ?? 'This user'} will be removed from the organization.`}
        confirmLabel="Remove"
        isLoading={isRemovingUser}
        onConfirm={handleRemoveUser}
      />

      <ConfirmDialog
        open={!!pendingRemoveTeam}
        onOpenChange={(open) => !open && setPendingRemoveTeam(null)}
        title="Remove team?"
        description={`"${pendingRemoveTeam?.name}" will be deleted and its members unassigned.`}
        confirmLabel="Remove"
        isLoading={isRemovingTeam}
        onConfirm={handleRemoveTeam}
      />
    </div>
  );
}
