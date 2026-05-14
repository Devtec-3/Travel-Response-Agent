import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Plane, LayoutDashboard, Settings, User as UserIcon, Bell, LogOut, MessageSquare, Briefcase, Map, Wallet } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-4">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-heading">
            T
          </div>
          <span className="text-xl font-bold font-heading tracking-tight">TARA</span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" active={location === "/dashboard"} />
          <NavItem href="/plan" icon={<Map size={20} />} label="Plan Trip" active={location === "/plan"} />
          <NavItem href="/trips" icon={<Plane size={20} />} label="My Trips" active={location.startsWith("/trip")} />
          <NavItem href="/agents" icon={<Briefcase size={20} />} label="AI Agents" active={location.startsWith("/agent")} />
          <NavItem href="/wallet" icon={<Wallet size={20} />} label="Wallet" active={location === "/wallet"} />
          <NavItem href="/notifications" icon={<Bell size={20} />} label="Alerts" active={location === "/notifications"} />
        </nav>

        <div className="mt-auto border-t border-border pt-4">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
              <UserIcon size={20} className="text-secondary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">{user?.name || "Traveler"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.plan || "Pro"} Plan</p>
            </div>
          </div>
          <nav className="space-y-1">
            <NavItem href="/settings" icon={<Settings size={20} />} label="Settings" active={location === "/settings"} />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              data-testid="button-logout"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </nav>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between border-b border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-heading">
            T
          </div>
          <span className="text-xl font-bold font-heading tracking-tight">TARA</span>
        </div>
        <Link href="/notifications" className="p-2 text-muted-foreground hover:text-foreground relative">
          <Bell size={24} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary agent-active-glow"></span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <div className="flex-1 p-4 md:p-8">
          {children}
        </div>
        
        {/* Floating Chat Button */}
        <Link href="/chat" className="fixed bottom-20 md:bottom-8 right-4 md:right-8 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 z-50 agent-active-glow" data-testid="link-chat">
          <MessageSquare size={24} />
        </Link>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden flex items-center justify-around border-t border-border bg-card p-2 safe-area-bottom">
        <MobileNavItem href="/dashboard" icon={<LayoutDashboard size={24} />} label="Home" active={location === "/dashboard"} />
        <MobileNavItem href="/trips" icon={<Plane size={24} />} label="Trips" active={location.startsWith("/trip")} />
        <MobileNavItem href="/plan" icon={<Map size={24} />} label="Plan" active={location === "/plan"} />
        <MobileNavItem href="/agents" icon={<Briefcase size={24} />} label="Agents" active={location.startsWith("/agent")} />
        <MobileNavItem href="/settings" icon={<Settings size={24} />} label="Menu" active={location === "/settings"} />
      </nav>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
      data-testid={`link-${label.toLowerCase().replace(" ", "-")}`}
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNavItem({ href, icon, label, active }: { href: string; icon: ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center w-16 h-12 ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
      data-testid={`link-mobile-${label.toLowerCase()}`}
    >
      {icon}
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </Link>
  );
}
