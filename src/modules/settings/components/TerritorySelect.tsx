import { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { RootState } from '@/store/store';
import { useCreateTerritoryMutation, useGetTerritoriesQuery } from '../services/territoriesApi';
import { getErrorMessage } from '../models';
import { SelectField } from './ui/Select';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

const NONE_VALUE = '__none__';
const CREATE_VALUE = '__create__';

/**
 * Territory picker with an inline "+ Create new" row (mirrors maxpmfe's
 * invite-form pattern) - territories don't get a dedicated CRUD screen in
 * this pass, just create-on-the-fly here.
 */
export function TerritorySelect({
  value,
  onChange,
  disabled,
  allowNone = true,
}: {
  value: number | undefined;
  onChange: (territoryId: number | undefined) => void;
  disabled?: boolean;
  allowNone?: boolean;
}) {
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { data: territories } = useGetTerritoriesQuery(orgId ?? 0, { skip: !orgId });
  const [createTerritory, { isLoading: isCreating }] = useCreateTerritoryMutation();
  const [creatingName, setCreatingName] = useState<string | null>(null);

  const options = [
    ...(allowNone ? [{ value: NONE_VALUE, label: 'No territory' }] : []),
    ...(territories ?? []).map((t) => ({ value: String(t.id), label: t.name })),
    { value: CREATE_VALUE, label: '+ Create new territory' },
  ];

  const handleSelect = (v: string) => {
    if (v === CREATE_VALUE) {
      setCreatingName('');
      return;
    }
    if (v === NONE_VALUE) {
      onChange(undefined);
      return;
    }
    onChange(Number(v));
  };

  const handleCreate = async () => {
    if (!orgId || !creatingName || !creatingName.trim()) return;
    try {
      const territory = await createTerritory({ orgId, body: { name: creatingName.trim() } }).unwrap();
      toast.success('Territory created');
      setCreatingName(null);
      onChange(territory.id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create territory'));
    }
  };

  if (creatingName !== null) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          autoFocus
          placeholder="New territory name"
          value={creatingName}
          onChange={(e) => setCreatingName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleCreate();
            }
            if (e.key === 'Escape') setCreatingName(null);
          }}
        />
        <Button type="button" size="sm" onClick={handleCreate} disabled={isCreating || !creatingName.trim()}>
          Add
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setCreatingName(null)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <SelectField
      value={value !== undefined ? String(value) : NONE_VALUE}
      onValueChange={handleSelect}
      options={options}
      placeholder="No territory"
      disabled={disabled}
    />
  );
}
