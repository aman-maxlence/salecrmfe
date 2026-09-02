/*----------------------- user-service (auth) endpoints -----------------------*/
export const AUTH_API_ENDPOINTS = {
  ME: '/users/me',
  LOGOUT: '/users/logout',
};

/*----------------------- salecrmbd: settings endpoints -----------------------
 * All paths are scoped under /org/:orgId/... - the backend always re-scopes
 * to the caller's own session org, but the :orgId path segment must still be
 * present/correct (see src/routes/protected-route for where org id comes from).
 *--------------------------------------------------------------------------*/
type OrgId = number | string;
type Id = number | string;

export const ROLES_API_ENDPOINTS = {
  BASE: (orgId: OrgId) => `/org/${orgId}/roles`,
  BY_ID: (orgId: OrgId, id: Id) => `/org/${orgId}/roles/${id}`,
  PERMISSIONS: (orgId: OrgId, id: Id) => `/org/${orgId}/roles/${id}/permissions`,
  AUDIT_LOG: (orgId: OrgId, id: Id) => `/org/${orgId}/roles/${id}/audit-log`,
};

export const TERRITORIES_API_ENDPOINTS = {
  BASE: (orgId: OrgId) => `/org/${orgId}/territories`,
  BY_ID: (orgId: OrgId, id: Id) => `/org/${orgId}/territories/${id}`,
};

export const DEPARTMENTS_API_ENDPOINTS = {
  BASE: (orgId: OrgId) => `/org/${orgId}/departments`,
  BY_ID: (orgId: OrgId, id: Id) => `/org/${orgId}/departments/${id}`,
};

export const TEAMS_API_ENDPOINTS = {
  BASE: (orgId: OrgId) => `/org/${orgId}/teams`,
  BY_ID: (orgId: OrgId, id: Id) => `/org/${orgId}/teams/${id}`,
};

export const WORKSPACE_SETTINGS_API_ENDPOINTS = {
  BASE: (orgId: OrgId) => `/org/${orgId}/workspace-settings`,
  LOGO_PRESIGNED_URL: (orgId: OrgId) => `/org/${orgId}/workspace-settings/logo/presigned-url`,
};

export const COMPANY_DETAILS_API_ENDPOINTS = {
  BASE: (orgId: OrgId) => `/org/${orgId}/company-details`,
};

export const USERS_API_ENDPOINTS = {
  BASE: (orgId: OrgId) => `/org/${orgId}/users`,
  ME: (orgId: OrgId) => `/org/${orgId}/users/me`,
  MY_CONTEXT: (orgId: OrgId) => `/org/${orgId}/users/me/context`,
  ROLE: (orgId: OrgId, userId: Id) => `/org/${orgId}/users/${userId}/role`,
  TERRITORY: (orgId: OrgId, userId: Id) => `/org/${orgId}/users/${userId}/territory`,
  TEAM: (orgId: OrgId, userId: Id) => `/org/${orgId}/users/${userId}/team`,
  MANAGER: (orgId: OrgId, userId: Id) => `/org/${orgId}/users/${userId}/manager`,
  BY_ID: (orgId: OrgId, userId: Id) => `/org/${orgId}/users/${userId}`,
};

export const INVITES_API_ENDPOINTS = {
  BASE: (orgId: OrgId) => `/org/${orgId}/invites`,
  BY_ID: (orgId: OrgId, id: Id) => `/org/${orgId}/invites/${id}`,
  RESEND: (orgId: OrgId, id: Id) => `/org/${orgId}/invites/${id}/resend`,
};

export const INVITE_LINK_API_ENDPOINTS = {
  BASE: (orgId: OrgId) => `/org/${orgId}/invite-link`,
  REGENERATE: (orgId: OrgId) => `/org/${orgId}/invite-link/regenerate`,
  REVOKE: (orgId: OrgId) => `/org/${orgId}/invite-link/revoke`,
};

/*----------------------- salecrmbd: onboarding endpoints ---------------------
 * Mounted at /api/onboarding - unlike the settings endpoints above, these are
 * NOT scoped by an :orgId path segment. The backend derives org/user entirely
 * from the authenticated session (see salecrmbd's OnboardingController._ctx).
 *--------------------------------------------------------------------------*/
export const ONBOARDING_API_ENDPOINTS = {
  STATE: '/onboarding/state',
  PROFILE: '/onboarding/profile',
  COMPANY: '/onboarding/company',
  IMPORT: '/onboarding/import',
  PREFERENCES: '/onboarding/preferences',
  COMPLETE: '/onboarding/complete',
};

/*----------------------- salecrmbd: inventory + deals ------------------------*/
export const INVENTORY_API_ENDPOINTS = {
  SETTINGS: (orgId: OrgId) => `/org/${orgId}/inventory/settings`,
  UOMS: (orgId: OrgId) => `/org/${orgId}/inventory/uoms`,
  UOM: (orgId: OrgId, id: Id) => `/org/${orgId}/inventory/uoms/${id}`,
  PRICING_TIERS: (orgId: OrgId) => `/org/${orgId}/inventory/pricing-tiers`,
  PRICING_TIER: (orgId: OrgId, id: Id) => `/org/${orgId}/inventory/pricing-tiers/${id}`,
  WAREHOUSES: (orgId: OrgId) => `/org/${orgId}/inventory/warehouses`,
  WAREHOUSE: (orgId: OrgId, id: Id) => `/org/${orgId}/inventory/warehouses/${id}`,
  ITEMS: (orgId: OrgId) => `/org/${orgId}/inventory/items`,
  ITEM: (orgId: OrgId, id: Id) => `/org/${orgId}/inventory/items/${id}`,
  ADJUST: (orgId: OrgId) => `/org/${orgId}/inventory/stock/adjust`,
  ALERTS: (orgId: OrgId) => `/org/${orgId}/inventory/alerts`,
};

export const DEALS_API_ENDPOINTS = {
  BASE: (orgId: OrgId) => `/org/${orgId}/deals`,
  BY_ID: (orgId: OrgId, id: Id) => `/org/${orgId}/deals/${id}`,
  LINE_ITEMS: (orgId: OrgId, id: Id) => `/org/${orgId}/deals/${id}/line-items`,
  LINE_ITEM: (orgId: OrgId, id: Id, lineId: Id) => `/org/${orgId}/deals/${id}/line-items/${lineId}`,
};
