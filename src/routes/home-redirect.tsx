import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useGetWorkspaceSettingsQuery } from '@/modules/settings/services/workspaceSettingsApi';
import { START_PAGE_OPTIONS } from '@/modules/settings/constants/themePalettes';
import DashboardPage from '@/modules/dashboard/pages/DashboardPage';

/**
 * Root path ("/") - redirects to the org's Workspace Profile "Default First
 * Page" setting when it's anything other than Dashboard. Renders the
 * dashboard directly (no redirect) while settings are still loading or for
 * orgs that haven't changed the default, so there's no visible flash.
 */
export function HomeRedirect() {
  const orgId = useSelector((state: RootState) => state.auth.organization?.id);
  const { data: settings } = useGetWorkspaceSettingsQuery(orgId ?? 0, { skip: !orgId });

  if (settings && settings.default_start_page !== 'dashboard') {
    const target = START_PAGE_OPTIONS.find((p) => p.value === settings.default_start_page);
    if (target) {
      return <Navigate to={target.path} replace />;
    }
  }

  return <DashboardPage />;
}

export default HomeRedirect;
