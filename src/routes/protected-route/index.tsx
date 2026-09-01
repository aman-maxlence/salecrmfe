import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { RootState } from '@/store/store';
import { useGetMeQuery } from '@/modules/auth/services';
import { useGetMyPortalUserQuery } from '@/modules/settings/services/usersApi';
import { setUser } from '@/modules/auth/auth-slice';
import { LOGIN_URL, USER_SERVICE_URL } from '@/app/constants';

const ONBOARDING_PATH = '/onboarding';

/**
 * Login itself happens in the shell app (userpmfe) on a different origin.
 * This confirms the shared `accessToken` cookie still resolves to a user via
 * userbd's GET /api/users/me, then redirects to the shell's login page if not.
 *
 * A second, independent guard layer lives here too: has this user finished
 * *this CRM's own* onboarding wizard (salecrmbd's `PortalUser.has_onboarded`)?
 * That's unrelated to "is there a logged-in user" above - a user can be fully
 * authenticated and still mid-wizard. This component sits as the shared
 * parent of both the `MainLayout` route subtree and the sibling `/onboarding`
 * route (see src/routes/index.tsx), so it can look at the current URL and
 * bounce either direction: not-onboarded users away from any `MainLayout`
 * route, and already-onboarded users away from `/onboarding` itself (design
 * doc QA requirement - neither state may reach the other's screens via a
 * direct URL).
 *
 * Reuses the same `useGetMyPortalUserQuery` the settings module already
 * calls (via its `usePermissions()` hook) - RTK Query dedupes/caches this by
 * `orgId` instead of firing a second network request.
 */
const ProtectedRoute = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { data, isLoading, isError, error } = useGetMeQuery(undefined, { skip: !!user });

  useEffect(() => {
    if (data?.status === 'success' && data.data?.user) {
      dispatch(setUser({ user: data.data.user, organization: data.data.organization }));
    }
  }, [data, dispatch]);

  const { data: portalUser, isLoading: isPortalUserLoading } = useGetMyPortalUserQuery(orgId ?? 0, {
    skip: !user || !orgId,
  });

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

  // Only gate on onboarding status once we actually have both a user and an
  // org to look up a PortalUser for - if `orgId` is missing the query above
  // is skipped and `portalUser` stays undefined forever, so this block is a
  // no-op in that edge case rather than blocking access.
  if (user && orgId) {
    if (isPortalUserLoading) {
      return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;
    }

    if (portalUser) {
      const onOnboardingRoute = location.pathname.startsWith(ONBOARDING_PATH);
      if (!portalUser.has_onboarded && !onOnboardingRoute) {
        return <Navigate to={ONBOARDING_PATH} replace />;
      }
      if (portalUser.has_onboarded && onOnboardingRoute) {
        return <Navigate to="/" replace />;
      }
    }
  }

  return <Outlet />;
};

export { ProtectedRoute };
