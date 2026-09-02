/*----------------------------------------------------------------------------
 * Shared salecrmbd response envelope
 *
 * Every salecrmbd endpoint responds with `{ success: true, data, ... }` on
 * success or `{ success: false, error: { code, message, statusCode, ... } }`
 * on failure. RTK Query's `transformResponse` unwraps `data` for us so hooks
 * return clean typed values; `getErrorMessage` below reads the error shape
 * for toasts.
 *--------------------------------------------------------------------------*/
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
    timestamp: string;
  };
}

/** Best-effort extraction of a human-readable message from an RTK Query error. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: Partial<ApiErrorBody> }).data;
    if (data?.error?.message) return data.error.message;
  }
  return fallback;
}

/*----------------------------------------------------------------------------
 * Roles & permissions
 *--------------------------------------------------------------------------*/
export type RoleStatus = 'active' | 'inactive';

export interface Role {
  id: number;
  org_id: number;
  role_name: string;
  description: string | null;
  is_admin: boolean;
  permissions: Record<string, boolean>;
  is_default: boolean;
  status: RoleStatus;
  created_at: string;
  updated_at: string;
}

export const SUPER_ADMIN_ROLE_NAME = 'Super Admin';

/** True when the role's edit/permissions/delete actions must be disabled client-side. */
export function isRoleProtected(role: Pick<Role, 'role_name' | 'is_admin'>): boolean {
  return role.role_name === SUPER_ADMIN_ROLE_NAME || role.is_admin === true;
}

export type AuditChangeType =
  | 'create_role'
  | 'update_role'
  | 'update_permissions'
  | 'delete_role';

export interface AuditLogEntry {
  id: number;
  org_id: number;
  role_id: number;
  changed_by: number | string;
  change_type: AuditChangeType;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  created_at: string;
}

export interface PermissionDef {
  key: string;
  label: string;
}

export interface PermissionGroup {
  title: string;
  permissions: PermissionDef[];
}

/** The full permission catalog, grouped for the permission-matrix editor UI. */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: 'Org / Roles / Territories',
    permissions: [
      { key: 'manage_organization_settings', label: 'Manage organization settings' },
      { key: 'manage_roles', label: 'Manage roles' },
      { key: 'view_roles', label: 'View roles' },
      { key: 'invite_users', label: 'Invite users' },
      { key: 'manage_users', label: 'Manage users' },
      { key: 'manage_territories', label: 'Manage territories' },
      { key: 'manage_departments', label: 'Manage departments' },
      { key: 'manage_teams', label: 'Manage teams' },
    ],
  },
  {
    title: 'Leads / Deals',
    permissions: [
      { key: 'view_all_leads', label: 'View all leads' },
      { key: 'create_lead', label: 'Create lead' },
      { key: 'delete_lead', label: 'Delete lead' },
      { key: 'assign_leads', label: 'Assign leads' },
      { key: 'view_all_deals', label: 'View all deals' },
      { key: 'manage_pipeline', label: 'Manage pipeline' },
    ],
  },
  {
    title: 'Tasks / Meetings / Tickets',
    permissions: [
      { key: 'view_all_tasks', label: 'View all tasks' },
      { key: 'assign_tasks', label: 'Assign tasks' },
      { key: 'manage_meetings', label: 'Manage meetings' },
      { key: 'manage_tickets', label: 'Manage tickets' },
      { key: 'assign_tickets', label: 'Assign tickets' },
      { key: 'view_tickets', label: 'View tickets' },
    ],
  },
  {
    title: 'Onboarding',
    permissions: [{ key: 'import_leads', label: 'Import leads' }],
  },
  {
    title: 'Incentives / Reports / Dashboard',
    permissions: [
      { key: 'manage_incentive_plans', label: 'Manage incentive plans' },
      { key: 'approve_payouts', label: 'Approve payouts' },
      { key: 'generate_reports', label: 'Generate reports' },
      { key: 'manage_dashboard', label: 'Manage dashboard' },
    ],
  },
  {
    title: 'Inventory',
    permissions: [
      { key: 'view_inventory', label: 'View inventory' },
      { key: 'manage_inventory', label: 'Manage items' },
      { key: 'adjust_stock', label: 'Adjust stock' },
      { key: 'manage_inventory_settings', label: 'Manage inventory settings' },
    ],
  },
];

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
);

/*----------------------------------------------------------------------------
 * Territories
 *--------------------------------------------------------------------------*/
export interface Territory {
  id: number;
  org_id: number;
  name: string;
  manager_user_id: number | string | null;
  status: RoleStatus;
  created_at: string;
  updated_at: string;
}

/*----------------------------------------------------------------------------
 * Departments
 *--------------------------------------------------------------------------*/
export interface Department {
  id: number;
  org_id: number;
  name: string;
  description: string | null;
  head_user_id: number | string | null;
  status: RoleStatus;
  created_at: string;
  updated_at: string;
}

/*----------------------------------------------------------------------------
 * Teams - always nested under exactly one Department and one Territory
 *--------------------------------------------------------------------------*/
export interface TeamMemberSummary {
  id: number;
  user_id: number | string;
  name: string | null;
  email: string | null;
}

export interface Team {
  id: number;
  org_id: number;
  department_id: number;
  territory_id: number;
  name: string;
  description: string | null;
  manager_user_id: number | string | null;
  status: RoleStatus;
  department?: Department;
  territory?: Territory;
  members?: TeamMemberSummary[];
  created_at: string;
  updated_at: string;
}

/*----------------------------------------------------------------------------
 * Workspace Settings - Sale CRM's own branding/personalisation, one row per
 * org (separate from userbd's Organization, which owns the canonical legal
 * name/domain shared across all products).
 *--------------------------------------------------------------------------*/
export type StartPage = 'dashboard' | 'deals' | 'inventory';

export interface WorkspaceSettings {
  id: number;
  org_id: number;
  logo_url: string | null;
  company_name: string | null;
  location: string | null;
  default_start_page: StartPage;
  font_preference: string;
  theme_palette: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateWorkspaceSettingsBody {
  logoUrl?: string | null;
  companyName?: string | null;
  location?: string | null;
  defaultStartPage?: StartPage;
  fontPreference?: string;
  themePalette?: string;
}

/*----------------------------------------------------------------------------
 * Company Details - legal/billing info (contact, tax ID, bank details) used
 * on invoices. Deliberately separate from WorkspaceSettings (branding).
 *--------------------------------------------------------------------------*/
export interface CompanyDetails {
  orgId: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  companyName: string | null;
  vatId: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  bankName: string | null;
  bankAddress: string | null;
  bankRoutingNumber: string | null;
  bankAccountHolderName: string | null;
  bankAccountNumber: string | null;
  iban: string | null;
  swiftCode: string | null;
  bic: string | null;
}

export type UpdateCompanyDetailsBody = Partial<Omit<CompanyDetails, 'orgId'>>;

export interface CreateTeamBody {
  name: string;
  departmentId: number | string;
  territoryId: number | string;
  description?: string;
  managerUserId?: number | string;
  memberUserIds?: (number | string)[];
}

/*----------------------------------------------------------------------------
 * Portal users (org members) - the RBAC source of truth for this frontend
 *--------------------------------------------------------------------------*/
export interface PortalUser {
  id: number;
  user_id: number | string;
  org_id: number;
  role_id: number;
  territory_id: number | null;
  team_id: number | null;
  manager_id: number | string | null;
  status: string;
  has_onboarded: boolean;
  role: Role;
  territory: Territory | null;
  // Looked up from the shared Redis cache (userbd owns the actual record) -
  // null if the user has never logged in / cache was flushed since.
  name: string | null;
  email: string | null;
  // Dual-access preview (admin only) - see the "Preview as" control in
  // main-layout. When `active_context` is 'user', `role` above is already
  // swapped server-side for the preview role (see
  // PortalUserService.getWithRole), so every permission check just works
  // without special-casing this - these fields exist purely to drive the
  // toggle UI itself.
  is_dual_access: boolean;
  active_context: 'admin' | 'user';
  preview_role_id: number | null;
  real_role?: Role;
}

/*----------------------------------------------------------------------------
 * Invitations
 *--------------------------------------------------------------------------*/
export type InvitationStatus = 'pending' | 'accepted' | 'revoked';

export interface Invitation {
  id: number;
  org_id: number;
  email: string;
  role_id: number;
  territory_id: number | null;
  status: InvitationStatus;
  user_id: number | string | null;
  user_service_invite_id: string | null;
  created_by: number | string;
  role: Role;
  territory: Territory | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInvitePayload {
  email: string;
  roleId: number;
  territoryId?: number;
  message?: string;
}

/*----------------------------------------------------------------------------
 * Invite link - the reusable, non-email-bound "Invite with a link" counterpart
 * to Invitation above. One per org.
 *--------------------------------------------------------------------------*/
export type InviteLinkStatus = 'active' | 'revoked';

export interface InviteLink {
  id: number;
  org_id: number;
  role_id: number;
  territory_id: number | null;
  status: InviteLinkStatus;
  url: string | null;
  role: Role;
  territory: Territory | null;
  created_at: string;
  updated_at: string;
}
