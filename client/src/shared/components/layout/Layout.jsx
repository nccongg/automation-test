/**
 * Main Application Layout
 * 
 * Provides sidebar navigation and main content area
 */

import { NavLink, Outlet } from 'react-router-dom';
import { Activity, LayoutDashboard, Settings as SettingsIcon, SquareKanban, TestTube2, FileText, PlayCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

const navItems = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', Icon: SquareKanban },
  { to: '/test-cases', label: 'Test Cases', Icon: TestTube2 },
  { to: '/results', label: 'Results', Icon: FileText },
  { to: '/test-runner', label: 'Test Runner', Icon: PlayCircle },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow)]">
              <Activity className="size-5" />
            </div>
            <div className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              AutoTesting
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)]'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  ].join(' ')
                }
              >
                <item.Icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User Profile */}
          <div className="mt-auto px-6 pb-6">
            <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-background/30 px-3 py-2">
              <div className="grid size-8 place-items-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                <span className="text-xs font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-sidebar-foreground">
                  {user?.name || 'User'}
                </div>
                <div className="truncate text-[11px] text-sidebar-foreground/60">
                  {user?.email || 'user@example.com'}
                </div>
              </div>
              <button
                onClick={logout}
                className="rounded p-1 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                title="Logout"
              >
                ←
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
