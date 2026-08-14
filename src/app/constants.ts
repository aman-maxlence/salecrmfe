export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Sale CRM';

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api';

export const LOGIN_URL =
  import.meta.env.VITE_LOGIN_URL || 'http://localhost:5173/login';

export const USER_SERVICE_URL =
  import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001/api';

// The productID this frontend identifies itself with on every request,
// mirroring how max_pm's frontend sends header `productID: '1'`.
// "Sales CRM" is already registered as product id 2 in two places:
// userbd/scripts/seedProductsAndPlans.js (seeded 2nd, after Project Management)
// and userpmfe's ProductSelectionPage (hardcoded `id: 2`, launches
// VITE_PRODUCT_CRM_URL = http://localhost:5175 in dev - this app's port).
// Confirm `2` against the live `products` table before relying on it in prod.
export const PRODUCT_ID =
  import.meta.env.VITE_PRODUCT_ID || '2';

export const API_ENDPOINTS = {
  AUTH: '/auth',
  // Add as each module ships: DEALS, TASKS, MEETINGS, INCENTIVES, TICKETS, REPORTS, DASHBOARD
};

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
};
