import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Copy, RefreshCw, Ban, Users } from 'lucide-react';
import { RootState } from '@/store/store';
import { Dialog, DialogContent, DialogFooter } from './ui/Dialog';
import { Button } from './ui/Button';
import { RoleSelect } from './RoleSelect';
import { TerritorySelect } from './TerritorySelect';
import { getErrorMessage } from '../models';
import {
  useGetInviteLinkQuery,
  useUpdateInviteLinkMutation,
  useRegenerateInviteLinkMutation,
  useRevokeInviteLinkMutation,
} from '../services/inviteLinkApi';
import { useCreateInvitesMutation } from '../services/invitesApi';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  raw
    .split(/[,\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .forEach((email) => {
      if (EMAIL_REGEX.test(email) && !seen.has(email)) {
        seen.add(email);
        result.push(email);
      }
    });
  return result;
}

export function InviteModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const organization = useSelector((state: RootState) => state.auth.organization);
  const orgId = organization?.id;

  const { data: inviteLink, isFetching: isLoadingLink } = useGetInviteLinkQuery(orgId ?? 0, {
    skip: !orgId || !open,
  });
  const [updateInviteLink] = useUpdateInviteLinkMutation();
  const [regenerateInviteLink, { isLoading: isRegenerating }] = useRegenerateInviteLinkMutation();
  const [revokeInviteLink, { isLoading: isRevoking }] = useRevokeInviteLinkMutation();
  const [createInvites, { isLoading: isInviting }] = useCreateInvitesMutation();

  const [linkRoleId, setLinkRoleId] = useState<number | undefined>();
  const [linkTerritoryId, setLinkTerritoryId] = useState<number | undefined>();

  const [emailsRaw, setEmailsRaw] = useState('');
  const [emailRoleId, setEmailRoleId] = useState<number | undefined>();
  const [emailTerritoryId, setEmailTerritoryId] = useState<number | undefined>();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (inviteLink) {
      setLinkRoleId(inviteLink.role_id);
      setLinkTerritoryId(inviteLink.territory_id ?? undefined);
    }
  }, [inviteLink]);

  const handleCopy = async () => {
    if (!inviteLink?.url) return;
    try {
      await navigator.clipboard.writeText(inviteLink.url);
      toast.success('Invite link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const saveLinkSettings = async (roleId: number | undefined, territoryId: number | undefined) => {
    if (!orgId || !roleId) return;
    try {
      await updateInviteLink({ orgId, roleId, territoryId }).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update invite link settings'));
    }
  };

  const handleRegenerate = async () => {
    if (!orgId) return;
    try {
      await regenerateInviteLink(orgId).unwrap();
      toast.success('Invite link regenerated - the old link no longer works');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to regenerate invite link'));
    }
  };

  const handleRevoke = async () => {
    if (!orgId) return;
    try {
      await revokeInviteLink(orgId).unwrap();
      toast.success('Invite link revoked');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to revoke invite link'));
    }
  };

  const parsedEmails = parseEmails(emailsRaw);

  const handleSendInvites = async () => {
    if (!orgId) return;
    if (parsedEmails.length === 0) {
      toast.error('Enter at least one valid email address');
      return;
    }
    if (!emailRoleId) {
      toast.error('Select a role for the invited users');
      return;
    }
    try {
      await createInvites({
        orgId,
        invites: parsedEmails.map((email) => ({
          email,
          roleId: emailRoleId,
          territoryId: emailTerritoryId,
          message: message.trim() || undefined,
        })),
      }).unwrap();
      toast.success(`Sent ${parsedEmails.length} invite${parsedEmails.length > 1 ? 's' : ''}`);
      setEmailsRaw('');
      setMessage('');
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send invites'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={`Invite to ${organization?.name || 'MaxSales CRM'}`} className="max-w-xl">
        <div className="space-y-5">
          {/* Invite with a link */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Invite with a link
              {inviteLink?.status === 'active' && organization?.domain ? (
                <span className="font-normal text-muted-foreground"> (anyone with @{organization.domain} email)</span>
              ) : null}
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={isLoadingLink ? 'Loading...' : inviteLink?.url ?? ''}
                onFocus={(e) => e.currentTarget.select()}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground truncate"
              />
              <Button type="button" onClick={handleCopy} disabled={!inviteLink?.url}>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs pt-0.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </button>
                {inviteLink?.status === 'active' ? (
                  <button
                    type="button"
                    onClick={handleRevoke}
                    disabled={isRevoking}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive font-medium disabled:opacity-50"
                  >
                    <Ban className="h-3 w-3" />
                    Revoke
                  </button>
                ) : inviteLink ? (
                  <span className="text-amber-600 font-medium">Revoked - regenerate to re-enable</span>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <RoleSelect
                value={linkRoleId}
                onChange={(roleId) => {
                  setLinkRoleId(roleId);
                  saveLinkSettings(roleId, linkTerritoryId);
                }}
                placeholder="Role for link joiners"
              />
              <TerritorySelect
                value={linkTerritoryId}
                onChange={(territoryId) => {
                  setLinkTerritoryId(territoryId);
                  saveLinkSettings(linkRoleId, territoryId);
                }}
              />
            </div>
          </div>

          {/* Invite with email */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Invite with email</p>
              <Button type="button" variant="outline" size="sm" disabled title="Coming soon">
                Invite from Google Workspace
              </Button>
            </div>
            <textarea
              value={emailsRaw}
              onChange={(e) => setEmailsRaw(e.target.value)}
              placeholder="Name@example.com, Name@example.com, Name@exampl....."
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <div className="grid grid-cols-2 gap-2">
              <RoleSelect value={emailRoleId} onChange={setEmailRoleId} placeholder="Role" />
              <TerritorySelect value={emailTerritoryId} onChange={setEmailTerritoryId} />
            </div>
          </div>

          {/* Message */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">Write a message (optional)</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message"
              rows={3}
              maxLength={500}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSendInvites} disabled={isInviting}>
            <Users className="h-4 w-4" />
            {isInviting ? 'Sending...' : 'Invite'}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InviteModal;
