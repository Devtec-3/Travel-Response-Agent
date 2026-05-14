import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLiveAgentFeed } from "@/hooks/useLiveAgentFeed";
import { useListNotifications } from "@workspace/api-client-react";
import {
  Plane, LayoutDashboard, Settings, User as UserIcon, Bell, LogOut,
  MessageSquare, Briefcase, Map, Wallet, Activity, Menu, X
} from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: dbNotifs = [] } = useListNotifications();
  const { unreadCount: liveUnread } = useLiveAgentFeed(isAuthenticated);

  const dbUnread = (dbNotifs as any[]).filter(n => !n.read).length;
  const totalUnread = Math.max(dbUnread, liveUnread);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", match: (l: string) => l === "/dashboard" },
    { href: "/plan", icon: Map, label: "Plan Trip", match: (l: string) => l === "/plan" },
    { href: "/trips", icon: Plane, label: "My Trips", match: (l: string) => l.startsWith("/trip") },
    { href: "/agents", icon: Briefcase, label: "AI Agents", match: (l: string) => l.startsWith("/agent") },
    { href: "/wallet", icon: Wallet, label: "Wallet", match: (l: string) => l === "/wallet" },
    { href: "/notifications", icon: Bell, label: "Alerts", badge: totalUnread, match: (l: string) => l === "/notifications" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/80 backdrop-blur-sm p-4 sticky top-0 h-screen shrink-0">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2 mb-8 group">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold font-heading text-lg shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
            T
          </div>
          <div>
            <span className="text-xl font-bold font-heading tracking-tight block leading-none">TARA</span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">Travel AI</span>
          </div>
        </Link>

        {/* Agent status pill */}
        <div className="mx-2 mb-6 px-3 py-2 rounded-lg bg-[#00FF88]/8 border border-[#00FF88]/20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse shrink-0" />
          <span className="text-[11px] font-medium text-[#00FF88]">8 agents running</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label, badge, match }) => {
            const active = match(location);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all relative ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                }`}
                data-testid={`link-${label.toLowerCase().replace(" ", "-")}`}
              >
                <Icon size={18} className={active ? "text-primary" : ""} />
                <span>{label}</span>
                {badge != null && badge > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto border-t border-border pt-4 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
              <UserIcon size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-none">{user?.name || "Traveler"}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email || ""}</p>
            </div>
          </div>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
              location === "/settings"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
            }`}
          >
            <Settings size={18} /> Settings
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all"
            data-testid="button-logout"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between border-b border-border bg-card/90 backdrop-blur-sm p-4 sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold font-heading text-base">
            T
          </div>
          <span className="text-lg font-bold font-heading tracking-tight">TARA</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="relative p-2 text-muted-foreground hover:text-foreground">
            <Bell size={22} />
            {totalUnread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </Link>
          <button
            className="p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(v => !v)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile slide-out menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-72 bg-card border-l border-border z-50 md:hidden flex flex-col p-6 pt-16"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <nav className="flex-1 space-y-1">
                {navItems.map(({ href, icon: Icon, label, badge, match }) => {
                  const active = match(location);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Icon size={20} />
                      <span>{label}</span>
                      {badge != null && badge > 0 && (
                        <span className="ml-auto min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-border pt-4 space-y-1">
                <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg">
                  <Settings size={20} /> Settings
                </Link>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg">
                  <LogOut size={20} /> Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-auto relative">
        <div className="flex-1 p-4 md:p-8">
          {children}
        </div>

        {/* Floating chat button */}
        <Link
          href="/chat"
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:shadow-2xl hover:shadow-primary/40 transition-all hover:-translate-y-1 z-30"
          data-testid="link-chat"
        >
          <MessageSquare size={22} />
        </Link>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden flex items-center justify-around border-t border-border bg-card/90 backdrop-blur-sm p-2 safe-area-bottom sticky bottom-0 z-30">
        {[
          { href: "/dashboard", icon: LayoutDashboard, label: "Home", match: (l: string) => l === "/dashboard" },
          { href: "/trips", icon: Plane, label: "Trips", match: (l: string) => l.startsWith("/trip") },
          { href: "/plan", icon: Map, label: "Plan", match: (l: string) => l === "/plan" },
          { href: "/agents", icon: Briefcase, label: "Agents", match: (l: string) => l.startsWith("/agent") },
          { href: "/notifications", icon: Bell, label: "Alerts", badge: totalUnread, match: (l: string) => l === "/notifications" },
        ].map(({ href, icon: Icon, label, badge, match }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-0.5 w-16 h-12 relative ${
              match(location) ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`link-mobile-${label.toLowerCase()}`}
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
            {badge != null && badge > 0 && (
              <span className="absolute top-0 right-1 min-w-[14px] h-[14px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
