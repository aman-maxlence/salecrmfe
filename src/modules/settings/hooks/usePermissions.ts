import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useGetMyPortalUserQuery } from '../services/usersApi';
import { isRoleProtected } from '../models';

/**
 * The frontend's real RBAC hook. `state.auth.organization.userRole` (set by
 * the auth module) is userbd's coarse admin/member flag - this hook instead
 * fetches this org's PortalUser record for the current user (salecrmbd's
 * `GET /org/:orgId/users/me`) and reads the fine-grained `role.permissions`
 * map off it, mirroring the reference implementation's `useRbac()`.
 *
 * This only gates UI (hide/disable actions) - the server is the actual
 * security boundary and re-checks every request.
 */
export function usePermissions() {
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);

  const { data: me, isLoading, isFetching, isError } = useGetMyPortalUserQuery(orgId ?? 0, {
    skip: !orgId,
  });

  const permissions = me?.role?.permissions ?? {};
  const isSuperAdmin = me?.role ? isRoleProtected(me.role) : false;

  const hasPermission = (key: string): boolean => isSuperAdmin || permissions[key] === true;

  const hasAnyPermission = (keys: string[]): boolean => keys.some((key) => hasPermission(key));

  return {
    me,
    orgId,
    isLoading,
    isFetching,
    isError,
    hasPermission,
    hasAnyPermission,
    isSuperAdmin,
  };
}
