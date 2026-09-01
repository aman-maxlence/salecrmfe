import { useState } from 'react';
import { toast } from 'react-toastify';
import { RotateCw, X } from 'lucide-react';
import {
  useGetInvitesQuery,
  useResendInviteMutation,
  useRevokeInviteMutation,
} from '../services/invitesApi';
import { getErrorMessage, Invitation, InvitationStatus } from '../models';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

const TABS: { value: InvitationStatus | 'all'; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'all', label: 'All' },
];

const statusTone: Record<InvitationStatus, 'success' | 'muted' | 'destructive'> = {
  accepted: 'success',
  pending: 'muted',
  revoked: 'destructive',
};

export function InvitesTable({ orgId }: { orgId: number | string }) {
  const [tab, setTab] = useState<InvitationStatus | 'all'>('pending');
  const { data: invites, isLoading } = useGetInvitesQuery({
    orgId,
    status: tab === 'all' ? undefined : tab,
  });
  const [revokeInvite, { isLoading: isRevoking }] = useRevokeInviteMutation();
  const [resendInvite] = useResendInviteMutation();
  const [busyId, setBusyId] = useState<number | string | null>(null);

  const handleRevoke = async (invite: Invitation) => {
    setBusyId(invite.id);
    try {
      await revokeInvite({ orgId, id: invite.id }).unwrap();
      toast.success('Invite revoked');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to revoke invite'));
    } finally {
      setBusyId(null);
    }
  };

  const handleResend = async (invite: Invitation) => {
    setBusyId(invite.id);
    try {
      await resendInvite({ orgId, id: invite.id }).unwrap();
      toast.success('Invite resent');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to resend invite (this can depend on a backend service that is not always available)'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-2 text-sm ${
              tab === t.value
                ? 'border-b-2 border-primary font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading invites...</p> : null}

      {invites && invites.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Territory</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invites.map((invite) => (
                <tr key={invite.id}>
                  <td className="px-4 py-2.5">{invite.email}</td>
                  <td className="px-4 py-2.5">{invite.role?.role_name ?? '-'}</td>
                  <td className="px-4 py-2.5">{invite.territory?.name ?? '-'}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={statusTone[invite.status]}>{invite.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    {invite.status === 'pending' ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Resend invite"
                          disabled={busyId === invite.id}
                          onClick={() => handleResend(invite)}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Revoke invite"
                          disabled={busyId === invite.id || isRevoking}
                          onClick={() => handleRevoke(invite)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="block text-right text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !isLoading ? (
        <p className="text-sm text-muted-foreground">No {tab === 'all' ? '' : tab} invites.</p>
      ) : null}
    </div>
  );
}
