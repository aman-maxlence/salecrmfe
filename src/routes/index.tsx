import { createBrowserRouter, Navigate } from 'react-router-dom';
import NotFoundPage from './not-found-page';
import { ProtectedRoute } from './protected-route';
import MainLayout from '@/layouts/main-layout';
import { HomeRedirect } from './home-redirect';
import SettingsLayout from '@/modules/settings/pages/SettingsLayout';
import RolesPage from '@/modules/settings/pages/RolesPage';
import RoleDetailPage from '@/modules/settings/pages/RoleDetailPage';
import TeamPage from '@/modules/settings/pages/TeamPage';
import TeamDetailPage from '@/modules/settings/pages/TeamDetailPage';
import HierarchyPage from '@/modules/settings/pages/HierarchyPage';
import ProfilePage from '@/modules/settings/pages/ProfilePage';
import InventorySettingsPage from '@/modules/settings/pages/InventorySettingsPage';

import OnboardingWizardPage from '@/modules/onboarding/pages/OnboardingWizardPage';
import ItemListPage from '@/modules/inventory/pages/ItemListPage';
import ItemDetailPage from '@/modules/inventory/pages/ItemDetailPage';
import AlertsPage from '@/modules/inventory/pages/AlertsPage';
import DealListPage from '@/modules/deals/pages/DealListPage';
import DealDetailPage from '@/modules/deals/pages/DealDetailPage';

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <HomeRedirect /> },
          { path: '/inventory', element: <ItemListPage /> },
          { path: '/inventory/alerts', element: <AlertsPage /> },
          { path: '/inventory/items/:itemId', element: <ItemDetailPage /> },
          { path: '/deals', element: <DealListPage /> },
          { path: '/deals/:dealId', element: <DealDetailPage /> },
          {
            path: '/settings',
            element: <SettingsLayout />,
            children: [
              { index: true, element: <Navigate to="territories" replace /> },
              { path: 'profile', element: <ProfilePage /> },
              { path: 'territories', element: <HierarchyPage /> },
              { path: 'hierarchy', element: <HierarchyPage /> },
              { path: 'roles', element: <RolesPage /> },
              { path: 'roles/:roleId', element: <RoleDetailPage /> },
              { path: 'team', element: <TeamPage /> },
              { path: 'team/:teamId', element: <TeamDetailPage /> },
              { path: 'inventory', element: <InventorySettingsPage /> },
            ],
          },
        ],
      },
      { path: '/onboarding', element: <OnboardingWizardPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
