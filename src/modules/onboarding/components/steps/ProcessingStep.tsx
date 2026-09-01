import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Check, ChevronRight } from 'lucide-react';
import { AppDispatch, RootState } from '@/store/store';
import { usersApi } from '@/modules/settings/services/usersApi';
import { getErrorMessage } from '@/modules/settings/models';
import { useCompleteOnboardingMutation } from '../../services/onboardingApi';

const SUBTITLE = 'We are collecting your inputs to feed AI on future steps';

/**
 * Design doc §4.2 Screen 7 - a progress bar that climbs while `POST
 * /complete` (marks `PortalUser.has_onboarded = true`) is in flight, then a
 * success state before navigating to `/`.
 *
 * `POST /complete` lives on `onboardingApi`, but the route guard
 * (ProtectedRoute) reads `has_onboarded` off `usersApi`'s cached
 * `getMyPortalUser` result - a different RTK Query slice with its own tag
 * space, so completing onboarding does NOT automatically update that cache.
 * That update is deliberately deferred to the "Proceed" click below, not
 * fired the moment `/complete` succeeds - ProtectedRoute itself redirects an
 * onboarded user away from `/onboarding` on sight, so updating any earlier
 * bounces the user straight to `/` before they ever see this success screen.
 *
 * The cache is patched directly (`updateQueryData`) rather than invalidated
 * - invalidating just schedules a refetch, and ProtectedRoute would keep
 * serving the stale `has_onboarded: false` value for that round-trip,
 * bouncing back toward `/onboarding` before correcting itself to `/` (a
 * visible loading/flicker). A direct, synchronous patch is already correct
 * by the time `navigate` below causes a re-render, so there's nothing to
 * wait on.
 */
export function ProcessingStep() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const [progress, setProgress] = useState(0);
  const [completeOnboarding, { isLoading: isCompleting }] = useCompleteOnboardingMutation();
  const [isDone, setIsDone] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Climbs toward 90% on its own, independent of how long the request
  // actually takes, so the bar never looks stuck at 0% - the real API
  // completion below snaps it the rest of the way to 100%.
  useEffect(() => {
    if (isDone) return;
    const timer = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 3 : p));
    }, 120);
    return () => clearInterval(timer);
  }, [isDone]);

  useEffect(() => {
    let cancelled = false;
    setHasFailed(false);
    setProgress(0);
    const run = async () => {
      try {
        await completeOnboarding().unwrap();
        if (cancelled) return;
        setProgress(100);
        setTimeout(() => {
          if (!cancelled) setIsDone(true);
        }, 400);
      } catch (err) {
        if (!cancelled) {
          setHasFailed(true);
          toast.error(getErrorMessage(err, 'Failed to complete onboarding'));
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // Intentionally only re-runs on retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      {isDone ? (
        <>
          <div>
            <h1 className="text-2xl font-bold">Congratulation! Your Account is all set</h1>
            <p className="mt-2 text-sm text-muted-foreground">{SUBTITLE}</p>
          </div>
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-green-500">
            <Check className="h-10 w-10 text-green-500" strokeWidth={2.5} />
          </div>
          <button
            type="button"
            onClick={() => {
              // Patch the route guard's cached PortalUser directly so it
              // picks up `has_onboarded: true` with no network round-trip -
              // deferred to here (see the comment above) so it doesn't
              // redirect out from under this screen before the user has
              // clicked through it.
              if (orgId) {
                dispatch(
                  usersApi.util.updateQueryData('getMyPortalUser', orgId, (draft) => {
                    draft.has_onboarded = true;
                  })
                );
              }
              navigate('/', { replace: true });
            }}
            className="flex items-center gap-1.5 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Proceed
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-xl font-bold">Please wait we are grouping your entries ...</h1>
            <p className="mt-2 text-sm text-muted-foreground">{SUBTITLE}</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500 transition-[width] duration-200 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          {hasFailed ? (
            <button
              type="button"
              className="text-sm text-primary underline"
              onClick={() => setAttempt((a) => a + 1)}
              disabled={isCompleting}
            >
              Retry
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
