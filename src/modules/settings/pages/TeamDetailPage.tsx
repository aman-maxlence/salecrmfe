import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ArrowLeft, UserPlus, Pencil } from 'lucide-react';
import { RootState } from '@/store/store';
import { usePermissions } from '../hooks/usePermissions';
import { useGetTeamsQuery, useUpdateTeamMutation } from '../services/teamsApi';
import { useGetUsersQuery } from '../services/usersApi';
import { getErrorMessage, PortalUser } from '../models';
import { InviteModal } from '../components/InviteModal';
import { CreateTeamModal } from '../components/CreateTeamModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Button } from '../components/ui/Button';

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { hasPermission, hasAnyPermission, isLoading: permsLoading } = usePermissions();

  const canManageTeams = permsLoading ? true : hasPermission('manage_teams');
  const canInvite = permsLoading ? true : hasAnyPermission(['invite_users', 'manage_users']);

  const { data: teams } = useGetTeamsQuery({ orgId: orgId ?? 0 }, { skip: !orgId });
  const { data: members } = useGetUsersQuery(orgId ?? 0, { skip: !orgId });
  const [updateTeam, { isLoading: isRemoving }] = useUpdateTeamMutation();

  const team = (teams ?? []).find((t) => String(t.id) === teamId);
  const userList: PortalUser[] = members ?? [];

  // Team.members (the raw association) only carries PortalUser's own
  // columns - no name/email/role/territory (those live in usersApi's
  // Redis-enriched list) - so look each member up there for display.
  const teamMembers = (team?.members ?? [])
    .map((tm) => userList.find((u) => String(u.user_id) === String(tm.user_id)))
    .filter((u): u is PortalUser => !!u);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingRemoveMember, setPendingRemoveMember] = useState<{ userId: number | string; name: string } | null>(null);

  const handleRemoveMember = async () => {
    if (!pendingRemoveMember || !team || !orgId) return;
    try {
      const remaining = teamMembers
        .map((m) => m.user_id)
        .filter((id) => String(id) !== String(pendingRemoveMember.userId));
      await updateTeam({ orgId, id: team.id, memberUserIds: remaining }).unwrap();
      toast.success(`${pendingRemoveMember.name} removed from ${team.name}`);
      setPendingRemoveMember(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove member from team'));
    }
  };

  if (!orgId) {
    return <p className="text-sm text-muted-foreground">No organization in context.</p>;
  }

  if (!team) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/settings/team')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <p className="text-sm text-muted-foreground">Team not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate('/settings/team')}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{team.name}</h1>
          <p className="text-sm text-muted-foreground">
            {team.department?.name || 'Department'} · {team.territory?.name || 'Territory'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManageTeams && (
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
          {canInvite && (
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          )}
        </div>
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
            {teamMembers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No members in this team yet.
                </td>
              </tr>
            ) : (
              teamMembers.map((member) => {
                const memberName = member.name ?? `User #${member.user_id}`;
                return (
                  <tr key={member.id}>
                    <td className="px-4 py-2.5 font-medium">{memberName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{member.territory?.name ?? '-'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{member.email ?? '-'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{member.role?.role_name ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right">
                      {canManageTeams && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPendingRemoveMember({ userId: member.user_id, name: memberName })}
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

      {canInvite ? (
        <InviteModal open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen} />
      ) : null}

      {canManageTeams ? (
        <CreateTeamModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} team={team} />
      ) : null}

      <ConfirmDialog
        open={!!pendingRemoveMember}
        onOpenChange={(open) => !open && setPendingRemoveMember(null)}
        title="Remove member from team?"
        description={`${pendingRemoveMember?.name ?? 'This member'} will be removed from ${team.name}, but stays active in the org.`}
        confirmLabel="Remove"
        isLoading={isRemoving}
        onConfirm={handleRemoveMember}
      />
    </div>
  );
}
