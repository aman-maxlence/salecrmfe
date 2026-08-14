import { Outlet, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { LayoutDashboard } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
];

export default function MainLayout() {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-border bg-card p-4">
        <div className="mb-6 text-lg font-semibold">Sale CRM</div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex h-14 items-center justify-end border-b border-border px-6 text-sm text-muted-foreground">
          {user?.email ?? ''}
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
