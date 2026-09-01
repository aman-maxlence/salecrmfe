import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import { RootState } from '@/store/store';
import { Button } from '@/modules/settings/components/ui/Button';
import { Input } from '@/modules/settings/components/ui/Input';
import { Badge } from '@/modules/settings/components/ui/Badge';
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from '@/modules/settings/components/ui/Dialog';
import { getErrorMessage } from '@/modules/settings/models';
import { useCreateDealMutation, useGetDealsQuery } from '../services/dealsApi';

export default function DealListPage() {
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { data: deals, isLoading, isError } = useGetDealsQuery(orgId ?? 0, { skip: !orgId });
  const [createDeal, { isLoading: creating }] = useCreateDealMutation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  if (!orgId) return <p className="text-sm text-muted-foreground">No organization in context.</p>;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createDeal({ orgId, title }).unwrap();
      toast.success('Deal created');
      setOpen(false);
      setTitle('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create deal'));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Deals</h1>
          <p className="text-sm text-muted-foreground">Attach catalog items and quantities on the deal detail page.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New deal
            </Button>
          </DialogTrigger>
          <DialogContent title="New deal">
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Title
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <DialogFooter>
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading deals...</p> : null}
      {isError ? <p className="text-sm text-destructive">Failed to load deals.</p> : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Deal</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Lines</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(deals ?? []).map((deal) => (
              <tr key={deal.id}>
                <td className="px-4 py-2.5">
                  <Link to={`/deals/${deal.id}`} className="font-medium hover:underline">
                    {deal.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={deal.status === 'open' ? 'default' : 'muted'}>{deal.status}</Badge>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{deal.lineItems?.length ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isLoading && (deals?.length ?? 0) === 0 ? <p className="text-sm text-muted-foreground">No deals yet.</p> : null}
    </div>
  );
}
