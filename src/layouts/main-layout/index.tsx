import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
  LayoutDashboard,
  LogOut,
  Settings,
  Package,
  Handshake,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Globe,
  Building2,
  Network,
  Mail,
  Zap,
  Users,
  ShieldCheck,
  Shield,
  CreditCard,
  Target,
  Award,
  CheckSquare,
  History,
  UserCheck,
  KeyRound,
  Play,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { RootState } from '@/store/store';
import { LOGIN_URL } from '@/app/constants';
import { logout } from '@/modules/auth/auth-slice';
import { useLogoutUserMutation } from '@/modules/auth/services';
import { usePermissions } from '@/modules/settings/hooks/usePermissions';
import { useGetWorkspaceSettingsQuery } from '@/modules/settings/services/workspaceSettingsApi';
import { PreviewModeToggle } from './PreviewModeToggle';

const workspaceNavItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    to: '/inventory',
    label: 'Inventory',
    icon: Package,
    permissions: ['view_inventory', 'manage_inventory', 'adjust_stock', 'manage_inventory_settings'],
  },
  {
    to: '/deals',
    label: 'Deals',
    icon: Handshake,
    permissions: ['view_all_deals', 'manage_pipeline'],
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
    permissions: ['view_roles', 'manage_roles', 'manage_users', 'invite_users', 'manage_inventory_settings'],
  },
];

const settingsSections = [
  {
    title: 'WORKSPACE SETTINGS',
    items: [
      { to: '/settings/profile', label: 'Profile & Theme', icon: User },
      { to: '/settings/company-details', label: 'Company Details', icon: Building2 },
      { to: '/settings/territories', label: 'Hierarchy Management', icon: Network },
      { to: '/settings/inventory', label: 'Inventory Settings', icon: Package },
    ],
  },
  {
    title: 'SYSTEM SETTINGS',
    items: [
      { to: '/settings/team', label: 'Team and Invites', icon: Users },
      { to: '/settings/roles', label: 'Roles & Permissions', icon: Shield },
    ],
  },
];

const BREADCRUMB_MAP: Record<string, { category: string; title: string }> = {
  '/settings/profile': { category: 'Workspace Settings', title: 'Profile & Theme' },
  '/settings/company-details': { category: 'Workspace Settings', title: 'Company Details' },
  '/settings/territories': { category: 'Workspace Settings', title: 'Hirearchy planner' },
  '/settings/hierarchy': { category: 'Workspace Settings', title: 'Hirearchy planner' },
  '/settings/inventory': { category: 'Workspace Settings', title: 'Inventory Settings' },
  '/settings/team': { category: 'System Settings', title: 'Team and Invites' },
  '/settings/roles': { category: 'System Settings', title: 'Roles & Permissions' },
};

export default function MainLayout() {
  const user = useSelector((state: RootState) => state.auth.user);
  const org = useSelector((state: RootState) => state.auth.organization);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasAnyPermission, isLoading: permsLoading } = usePermissions();
  const [logoutUser] = useLogoutUserMutation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { data: workspaceSettings } = useGetWorkspaceSettingsQuery(org?.id ?? 0, { skip: !org?.id });
  const brandName = workspaceSettings?.company_name || 'Sales CRM';
  const brandInitials = brandName.slice(0, 2).toUpperCase();

  const isSettingsRoute = location.pathname.startsWith('/settings');

  const visibleWorkspaceNavItems = workspaceNavItems.filter(
    (item) => !item.permissions || permsLoading || hasAnyPermission(item.permissions)
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser().unwrap();
    } catch {
      // Ignore expiration
    }
    dispatch(logout());
    toast.success('Logged out successfully');
    window.location.href = LOGIN_URL;
  };

  const currentBreadcrumb =
    BREADCRUMB_MAP[location.pathname] || {
      category: 'Workspace Settings',
      title: 'Hirearchy planner',
    };

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'dark bg-background text-foreground' : 'bg-background text-foreground'}`}>
      {/* ---------------------------------------------------- */}
      {/* SIDEBAR (Unified Modern UI)                          */}
      {/* ---------------------------------------------------- */}
      <aside
        id="app-main-sidebar"
        className={`flex flex-col border-r border-border bg-card transition-all duration-300 ${
          isSidebarOpen ? 'w-60' : 'w-20'
        }`}
      >
        {/* Top SC Avatar & Collapse Button */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xs">
              {workspaceSettings?.logo_url ? (
                <img src={workspaceSettings.logo_url} alt={brandName} className="h-full w-full object-cover" />
              ) : (
                brandInitials
              )}
            </div>
            {isSidebarOpen && (
              <span className="font-semibold text-foreground text-sm tracking-tight truncate">
                {brandName}
              </span>
            )}
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-4.5 w-4.5" />
            ) : (
              <PanelLeftOpen className="h-4.5 w-4.5" />
            )}
          </button>
        </div>

        {isSettingsRoute ? (
          /* SETTINGS MODE NAVIGATION */
          <>
            {/* Back to Workspace Navigation Button */}
            <div className="p-3 border-b border-border">
              <button
                onClick={() => navigate('/')}
                className={`w-full flex items-center ${
                  isSidebarOpen ? 'justify-start gap-2 px-3 py-2' : 'justify-center p-2'
                } rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all group`}
                title="Back to Workspace"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 text-foreground" />
                {isSidebarOpen && <span>Back to Workspace</span>}
              </button>
            </div>

            {/* Categorized Settings Navigation Items */}
            <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5 thin-scrollbar">
              {settingsSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  {isSidebarOpen ? (
                    <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                      {section.title}
                    </h3>
                  ) : (
                    <div className="h-px bg-border/60 mx-2 my-2" />
                  )}

                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive =
                        location.pathname === item.to ||
                        (item.to === '/settings/territories' && location.pathname === '/settings');
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`flex items-center ${
                            isSidebarOpen ? 'justify-start gap-2.5 px-3 py-2' : 'justify-center p-2'
                          } rounded-lg text-xs font-medium transition-all group relative ${
                            isActive
                              ? 'bg-primary/10 text-primary font-semibold shadow-2xs'
                              : 'text-foreground/80 hover:bg-accent hover:text-foreground'
                          }`}
                          title={isSidebarOpen ? '' : item.label}
                        >
                          <Icon
                            className={`h-4 w-4 flex-shrink-0 transition-colors ${
                              isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                            }`}
                          />
                          {isSidebarOpen && <span className="truncate">{item.label}</span>}
                          {!isSidebarOpen && (
                            <div className="absolute left-full ml-2 px-2.5 py-1 bg-popover text-popover-foreground border border-border rounded-md text-xs shadow-md whitespace-nowrap hidden group-hover:block z-50">
                              <p className="font-semibold">{item.label}</p>
                              <p className="text-[10px] text-muted-foreground">{section.title}</p>
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </>
        ) : (
          /* WORKSPACE DEFAULT NAVIGATION */
          <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 thin-scrollbar">
            {visibleWorkspaceNavItems.map(({ to, label, icon: Icon }) => {
              const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={`flex items-center ${
                    isSidebarOpen ? 'justify-start gap-2.5 px-3 py-2' : 'justify-center p-2'
                  } rounded-lg text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold shadow-2xs'
                      : 'text-foreground/80 hover:bg-accent hover:text-foreground'
                  }`}
                  title={isSidebarOpen ? '' : label}
                >
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  {isSidebarOpen && <span className="truncate text-sm">{label}</span>}
                  {!isSidebarOpen && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-popover text-popover-foreground border border-border rounded-md text-xs shadow-md whitespace-nowrap hidden group-hover:block z-50">
                      <p className="font-semibold">{label}</p>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        )}

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-border mt-auto">
          <div
            className={`flex items-center ${
              isSidebarOpen ? 'gap-2.5 px-2' : 'justify-center'
            } text-xs text-muted-foreground`}
          >
            <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-foreground flex-shrink-0">
              {user?.email ? user.email.substring(0, 1).toUpperCase() : 'U'}
            </div>
            {isSidebarOpen && (
              <span className="truncate font-medium text-foreground/80">
                {user?.email ?? 'Workspace'}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------- */}
      {/* MAIN CONTENT WRAPPER                                */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER BAR MATCHING SCREENSHOT */}
        <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-6 text-sm">
          {/* Left empty container / brand area */}
          <div className="flex items-center gap-2" />

          {/* Right: Actions Toolbar */}
          <div className="flex items-center gap-3 ml-auto">
            {/* See plans button */}
            <button
              onClick={() => navigate('/settings/billing')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50/70 dark:bg-purple-950/30 px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-300 hover:bg-purple-100 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>See plans</span>
            </button>

            <div className="h-4 w-px bg-border mx-1" />

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User Profile Avatar */}
            <button
              onClick={() => navigate('/settings/profile')}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:opacity-90 transition-opacity"
              title={user?.email ?? 'Profile'}
            >
              {workspaceSettings?.logo_url ? (
                <img src={workspaceSettings.logo_url} alt={brandName} className="h-full w-full object-cover" />
              ) : (
                brandInitials
              )}
            </button>

            <PreviewModeToggle />

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isLoggingOut ? 'Signing out...' : 'Logout'}</span>
            </button>
          </div>
        </header>

        {/* BREADCRUMB BAR (WHEN ON SETTINGS) */}
        {isSettingsRoute && (
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-border bg-card/60 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Settings className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{currentBreadcrumb.category}</span>
              </div>
              <span className="text-muted-foreground/60">/</span>
              <span className="font-semibold text-primary">
                {currentBreadcrumb.title}
              </span>
            </div>
          </div>
        )}

        {/* MAIN OUTLET CONTAINER */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
