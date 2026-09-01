import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useCreateRoleMutation } from '../services/rolesApi';
import { getErrorMessage } from '../models';

const roleFormSchema = z.object({
  roleName: z.string().trim().min(1, 'Role name is required').max(100),
  description: z.string().trim().max(500).optional(),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

export function RoleFormDialog({
  orgId,
  onCreated,
  trigger,
}: {
  orgId: number | string;
  onCreated?: (roleId: number) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [createRole, { isLoading }] = useCreateRoleMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { roleName: '', description: '' },
  });

  useEffect(() => {
    if (!open) reset({ roleName: '', description: '' });
  }, [open, reset]);

  const onSubmit = async (values: RoleFormValues) => {
    try {
      const role = await createRole({
        orgId,
        body: { roleName: values.roleName, description: values.description || undefined },
      }).unwrap();
      toast.success('Role created. New roles start with every permission off.');
      setOpen(false);
      onCreated?.(role.id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create role'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title="Create role"
        description="New roles start with every permission turned off - configure them after creating."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="roleName">
              Role name
            </label>
            <Input id="roleName" placeholder="e.g. Sales Manager" {...register('roleName')} />
            {errors.roleName ? (
              <span className="text-xs text-destructive">{errors.roleName.message}</span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="description">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input id="description" placeholder="What this role is for" {...register('description')} />
          </div>
          <DialogFooter>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
