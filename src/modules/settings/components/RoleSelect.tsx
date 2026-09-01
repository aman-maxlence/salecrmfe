import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useGetRolesQuery } from '../services/rolesApi';
import { SelectField } from './ui/Select';

export function RoleSelect({
  value,
  onChange,
  disabled,
  placeholder = 'Select a role',
}: {
  value: number | undefined;
  onChange: (roleId: number) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { data: roles } = useGetRolesQuery(orgId ?? 0, { skip: !orgId });

  const options = (roles ?? [])
    .filter((r) => r.status === 'active')
    .map((r) => ({ value: String(r.id), label: r.role_name }));

  return (
    <SelectField
      value={value !== undefined ? String(value) : undefined}
      onValueChange={(v) => onChange(Number(v))}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
