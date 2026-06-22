/**
 * Main Application Layout
 *
 * Provides sidebar navigation and main content area
 */

import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Settings as SettingsIcon,
  SquareKanban,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTheme } from "@/features/theme/ThemeContext";
import useDocumentTitle, { titleFromPathname } from "@/hooks/useDocumentTitle";
import { useState, useEffect } from "react";

const navItems = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/projects", label: "Projects", Icon: SquareKanban },
  { to: "/settings", label: "Settings", Icon: SettingsIcon },
];

const THEME_CYCLE = ["light", "dark", "system"];
const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor };
const THEME_LABELS = { light: "Light", dark: "Dark", system: "System" };

function ThemeToggle({ collapsed }) {
  const { theme, setTheme } = useTheme();
  const Icon = THEME_ICONS[theme] || Monitor;

  function cycleTheme() {
    const idx = THEME_CYCLE.indexOf(theme);
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
  }

  if (collapsed) {
    return (
      <button
        onClick={cycleTheme}
        title={`Theme: ${THEME_LABELS[theme]}`}
        className="mx-auto flex size-9 items-center justify-center rounded-xl text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
      >
        <Icon className="size-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-sidebar-border px-3 py-2 mb-2">
      <span className="text-xs text-sidebar-foreground/60 font-medium">Theme</span>
      <div className="flex items-center gap-0.5">
        {THEME_CYCLE.map((t) => {
          const TIcon = THEME_ICONS[t];
          return (
            <button
              key={t}
              onClick={() => setTheme(t)}
              title={THEME_LABELS[t]}
              className={[
                "flex size-7 items-center justify-center rounded-lg transition-colors text-xs",
                theme === t
                  ? "bg-[var(--brand-primary)] text-white"
                  : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              ].join(" ")}
            >
              <TIcon className="size-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useDocumentTitle(titleFromPathname(location.pathname));

  // Auto-collapse sidebar when on project detail pages (where there are two sidebars)
  useEffect(() => {
    const isProjectDetailPage = /^\/projects\/\d+(\/.*)?$/.test(
      location.pathname,
    );
    // Only auto-collapse on project detail pages where both sidebars exist
    setIsSidebarCollapsed(isProjectDetailPage);
  }, [location.pathname]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Determine if sidebar should be collapsed (considering hover state)
  const showExpanded = isHovering || !isSidebarCollapsed;

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar transition-transform duration-300 ease-in-out md:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow)]">
              <Activity className="size-5" />
            </div>
            <div className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              AutoTesting
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)]"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                ].join(" ")
              }
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <item.Icon className="size-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile User Profile */}
        <div className="mt-auto px-3 pb-6 flex flex-col gap-2">
          <ThemeToggle collapsed={false} />
          <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-background/30 px-3 py-2">
            <div className="grid size-8 place-items-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              <span className="text-xs font-semibold">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-sidebar-foreground">
                {user?.name || "User"}
              </div>
              <div className="truncate text-[11px] text-sidebar-foreground/60">
                {user?.email || "user@example.com"}
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

      {/* Desktop Sidebar */}
      <aside
        className={`hidden flex-col border-r bg-sidebar md:flex transition-all duration-300 ease-in-out ${
          showExpanded ? "w-64" : "w-16"
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Header with Logo and Collapse Toggle */}
        <div
          className={`flex items-center justify-between ${showExpanded ? "px-6 py-6" : "px-2 py-6"}`}
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          {showExpanded && (
            // click -> navigate to home
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow)]">
                <Activity className="size-5" />
              </div>
              <div className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                AutoTesting
              </div>
            </div>
          )}
          {!showExpanded && (
            <div className="mx-auto p-0">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow)]">
                <Activity className="size-5" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)]"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  !showExpanded ? "justify-center px-2" : "",
                ].join(" ")
              }
            >
              <item.Icon className="size-4 shrink-0" />
              {showExpanded && item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Profile + Theme */}
        <div className="mt-auto px-3 pb-6 flex flex-col gap-2">
          {showExpanded ? (
            <ThemeToggle collapsed={false} />
          ) : (
            <ThemeToggle collapsed={true} />
          )}
          <div
            className={`flex items-center gap-3 rounded-2xl border border-sidebar-border bg-background/30 px-3 py-2 ${
              !showExpanded ? "justify-center" : ""
            }`}
          >
            <div className="grid size-8 place-items-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              <span className="text-xs font-semibold">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
            {showExpanded && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-sidebar-foreground">
                    {user?.name || "User"}
                  </div>
                  <div className="truncate text-[11px] text-sidebar-foreground/60">
                    {user?.email || "user@example.com"}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="rounded p-1 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  title="Logout"
                >
                  ←
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-foreground/80 hover:bg-accent hover:text-foreground"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow)]">
              <Activity className="size-5" />
            </div>
            <div className="text-sm font-semibold tracking-tight">
              AutoTesting
            </div>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
