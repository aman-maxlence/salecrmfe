import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { RootState } from '@/store/store';
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { SelectField } from './ui/Select';
import { useCreateTerritoryMutation, useUpdateTerritoryMutation } from '../services/territoriesApi';
import { useGetUsersQuery } from '../services/usersApi';
import { getErrorMessage, Territory } from '../models';

const NONE_VALUE = '__none__';

const territoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Territory name is required').max(100),
  managerUserId: z.string(),
});

type TerritoryFormValues = z.infer<typeof territoryFormSchema>;

/**
 * Create/edit dialog for the dedicated Territories page - complements (does
 * not replace) TerritorySelect's own create-on-the-fly flow used inline from
 * MembersTable.
 */
export function TerritoryFormDialog({
  orgId,
  territory,
  trigger,
}: {
  orgId: number | string;
  territory?: Territory;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { data: members } = useGetUsersQuery(orgId, { skip: !orgId || !open });
  const [createTerritory, { isLoading: isCreating }] = useCreateTerritoryMutation();
  const [updateTerritory, { isLoading: isUpdating }] = useUpdateTerritoryMutation();
  const isLoading = isCreating || isUpdating;
  const isEdit = !!territory;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TerritoryFormValues>({
    resolver: zodResolver(territoryFormSchema),
    defaultValues: { name: '', managerUserId: NONE_VALUE },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: territory?.name ?? '',
        managerUserId: territory?.manager_user_id ? String(territory.manager_user_id) : NONE_VALUE,
      });
    }
  }, [open, territory, reset]);

  const managerOptions = [
    { value: NONE_VALUE, label: 'No manager' },
    ...(members ?? []).map((m) => ({ value: String(m.user_id), label: m.name ?? m.email ?? `User #${m.user_id}` })),
  ];

  const onSubmit = async (values: TerritoryFormValues) => {
    const managerUserId = values.managerUserId === NONE_VALUE ? undefined : Number(values.managerUserId);
    try {
      if (isEdit) {
        await updateTerritory({
          orgId,
          id: territory.id,
          name: values.name,
          managerUserId: managerUserId ?? null,
        }).unwrap();
        toast.success('Territory updated');
      } else {
        await createTerritory({ orgId, body: { name: values.name, managerUserId } }).unwrap();
        toast.success('Territory created');
      }
      setOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to ${isEdit ? 'update' : 'create'} territory`));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={isEdit ? 'Edit territory' : 'Create territory'}
        description="Group members by region, product line, or however your team divides ownership."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="name">
              Territory name
            </label>
            <Input id="name" placeholder="e.g. West Coast" {...register('name')} />
            {errors.name ? <span className="text-xs text-destructive">{errors.name.message}</span> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Manager</label>
            <Controller
              control={control}
              name="managerUserId"
              render={({ field }) => (
                <SelectField value={field.value} onValueChange={field.onChange} options={managerOptions} />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEdit ? 'Save changes' : 'Create territory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
