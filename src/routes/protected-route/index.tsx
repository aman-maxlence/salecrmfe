import { Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { RootState } from '@/store/store';
import { useGetMeQuery } from '@/modules/auth/services';
import { setUser } from '@/modules/auth/auth-slice';
import { LOGIN_URL, USER_SERVICE_URL } from '@/app/constants';

/**
 * Login itself happens in the shell app (userpmfe) on a different origin.
 * This confirms the shared `accessToken` cookie still resolves to a user via
 * userbd's GET /api/users/me, then redirects to the shell's login page if not.
 */
const ProtectedRoute = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data, isLoading, isError, error } = useGetMeQuery(undefined, { skip: !!user });

  useEffect(() => {
    if (data?.status === 'success' && data.data?.user) {
      dispatch(setUser({ user: data.data.user, organization: data.data.organization }));
    }
  }, [data, dispatch]);

  if (!user && isLoading) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!user && (isError || !data || data.status !== 'success')) {
    // TEMPORARY DEBUG MODE: redirect disabled so the real error is readable
    // on screen instead of racing DevTools. Remove this block and restore
    // `window.location.href = LOGIN_URL; return null;` once the cause is fixed.
    return (
      <pre className="m-6 whitespace-pre-wrap rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-xs text-destructive">
        {JSON.stringify({ calledUrl: `${USER_SERVICE_URL}/users/me`, isError, error, data }, null, 2)}
      </pre>
    );
  }

  return <Outlet />;
};

export { ProtectedRoute };
