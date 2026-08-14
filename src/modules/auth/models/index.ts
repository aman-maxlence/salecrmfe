export interface IUser {
  id: string | number;
  email: string;
  name: string;
  org_id?: number;
  is_active?: boolean;
}

export interface IOrganization {
  id: number;
  name: string;
  slug: string;
  userRole: string;
}

export interface ISubscription {
  id: number;
  status: string;
  isActive: boolean;
  isTrialExpired: boolean;
  expiresAt: string;
  plan: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

/**
 * Shape returned by userbd's GET /api/users/me (UserController.getCurrentUser ->
 * UserService.getCurrentUserWithOrgAndSubscription). Note userbd's BaseController
 * wraps responses as `{ status: 'success', data, message, statusCode }` -
 * different from salecrmbd's own `{ success: true, ... }` convention, since
 * they're two separately-written services.
 */
export interface IMeResponse {
  status: string;
  message: string;
  statusCode: number;
  data: {
    user: IUser;
    organization: IOrganization;
    subscription: ISubscription | null;
  };
}
