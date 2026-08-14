import { createBrowserRouter } from 'react-router-dom';
import NotFoundPage from './not-found-page';
import { ProtectedRoute } from './protected-route';
import MainLayout from '@/layouts/main-layout';
import DashboardPage from '@/modules/dashboard/pages/DashboardPage';

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          // Add as each module ships:
          // { path: '/deals', element: <DealListPage /> },
          // { path: '/tasks', element: <TaskListPage /> },
          // { path: '/meetings', element: <MeetingListPage /> },
          // { path: '/incentives', element: <IncentiveListPage /> },
          // { path: '/tickets', element: <TicketListPage /> },
          // { path: '/reports', element: <ReportsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
