import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useGetDashboardStats, useListActiveTrips } from "@workspace/api-client-react";
import { useLiveAgentFeed } from "@/hooks/useLiveAgentFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plane, Bot, Zap, TrendingUp, Bell, ArrowRight,
  Clock, MapPin, Shield, Activity, RefreshCw, AlertTriangle
} from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  info: "text-primary border-primary/30 bg-primary/10",
  warning: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  critical: "text-red-400 border-red-400/30 bg-red-400/10",
};

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-primary",
  warning: "bg-yellow-400",
  critical: "bg-red-400 animate-pulse",
};

const AGENT_ICONS: Record<string, typeof Bot> = {
  default: Bot,
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function FlightCountdown({ departureTime }: { departureTime: string }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const update = () => {
      const ms = new Date(departureTime).getTime() - Date.now();
      if (ms <= 0) { setDisplay("Departed"); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      if (h > 0) setDisplay(`${h}h ${m}m`);
      else if (m > 0) setDisplay(`${m}m ${s}s`);
      else setDisplay(`${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [departureTime]);

  return <span className="font-mono tabular-nums">{display}</span>;
}

function StatCard({
  title, value, sub, highlight, icon: Icon
}: {
  title: string; value: string | number; sub?: string; highlight?: boolean; icon?: typeof Plane
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`glass-card ${highlight ? "border-[#00FF88]/30" : ""}`}>
        <CardContent className="pt-5 pb-4">
          {Icon && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${highlight ? "bg-[#00FF88]/15" : "bg-primary/10"}`}>
              <Icon size={16} className={highlight ? "text-[#00FF88]" : "text-primary"} />
            </div>
          )}
          <div className={`text-2xl font-bold font-heading tabular-nums ${highlight ? "text-[#00FF88]" : ""}`}>{value}</div>
          <div className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wide">{title}</div>
          {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  "On Time": "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30",
  "Check-In Open": "bg-primary/15 text-primary border-primary/30",
  "Boarding": "bg-yellow-400/15 text-yellow-400 border-yellow-400/30",
  "Final Call": "bg-red-400/15 text-red-400 border-red-400/30 animate-pulse",
  "Departed": "bg-muted text-muted-foreground border-border",
  "In Air": "bg-primary/15 text-primary border-primary/30",
  "Landing": "bg-yellow-400/15 text-yellow-400 border-yellow-400/30",
  "Landed": "bg-muted text-muted-foreground border-border",
  "Delayed": "bg-red-400/15 text-red-400 border-red-400/30",
};

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activeTrips = [], isLoading: tripsLoading } = useListActiveTrips();
  const { logs, notifications, unreadCount } = useLiveAgentFeed(isAuthenticated);

  const greeting = getGreeting();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-8">

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight mb-2">
            {greeting}, {user?.name?.split(" ")[0] || "Traveler"}.
          </h1>
          <p className="text-muted-foreground">
            TARA is monitoring{" "}
            <span className="font-semibold text-foreground">
              {statsLoading ? "..." : `${stats?.activeTrips ?? 0} active ${(stats?.activeTrips ?? 0) === 1 ? "trip" : "trips"}`}
            </span>
            {" "}with{" "}
            <span className="font-semibold text-[#00FF88]">
              {stats?.activeAgents ?? 8} agents
            </span>
            {" "}running autonomously.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Link href="/notifications">
              <Button variant="outline" size="sm" className="relative gap-2">
                <Bell size={14} />
                Alerts
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </Button>
            </Link>
          )}
          <Link href="/chat">
            <Button size="sm" className="gap-2">
              <Bot size={14} /> Ask TARA
            </Button>
          </Link>
        </div>
      </motion.header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Trips"
          value={stats?.totalTrips ?? "—"}
          icon={Plane}
        />
        <StatCard
          title="Distance Flown"
          value={stats?.totalKm ? `${stats.totalKm.toLocaleString()} km` : "—"}
          icon={MapPin}
        />
        <StatCard
          title="AI Savings"
          value={stats?.moneySavedNgn ? `₦${stats.moneySavedNgn.toLocaleString()}` : "—"}
          highlight
          icon={TrendingUp}
        />
        <StatCard
          title="Active Agents"
          value={stats?.activeAgents ? `${stats.activeAgents}/8` : "8/8"}
          icon={Shield}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Active Trips - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading">Active Trips</h2>
            <Link href="/trips">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">
                All trips <ArrowRight size={12} />
              </Button>
            </Link>
          </div>

          {tripsLoading ? (
            <Card className="glass-card h-40 animate-pulse" />
          ) : activeTrips.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Plane size={32} className="mx-auto mb-3 opacity-30" />
                <p>No active trips. TARA is standing by.</p>
                <Link href="/plan">
                  <Button variant="outline" size="sm" className="mt-4">Plan a trip</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeTrips.map((trip: any, i: number) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link href={`/trip/${trip.id}`}>
                    <Card className="glass-card border-primary/20 hover:border-primary/50 transition-all cursor-pointer group overflow-hidden">
                      <div className="h-0.5 bg-gradient-to-r from-primary/60 via-[#00FF88]/60 to-primary/60" />
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#00FF88] agent-active-glow animate-pulse shrink-0" />
                            <span className="text-xs font-medium text-[#00FF88]">Agents active</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[trip.flightStatus] ?? "bg-muted text-muted-foreground"}`}
                          >
                            {trip.flightStatus}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between mb-5">
                          <div className="text-center">
                            <div className="text-3xl font-bold font-heading">{trip.originCode}</div>
                            <div className="text-xs text-muted-foreground mt-1">{trip.origin}</div>
                            <div className="font-mono text-sm mt-1.5 text-muted-foreground">
                              {new Date(trip.departureTime).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col items-center px-4 relative">
                            <div className="absolute w-full h-px bg-border top-1/2 -translate-y-3" />
                            <Plane className="text-primary relative z-10 bg-card/80 p-0.5" size={22} />
                            <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                              {trip.airline} {trip.flightNumber}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-3xl font-bold font-heading">{trip.destinationCode}</div>
                            <div className="text-xs text-muted-foreground mt-1">{trip.destination}</div>
                            <div className="font-mono text-sm mt-1.5 text-muted-foreground">
                              {new Date(trip.arrivalTime).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 pt-3 border-t border-border/50 text-xs">
                          <div>
                            <div className="text-muted-foreground mb-0.5">Gate</div>
                            <div className="font-semibold">{trip.gate ?? "TBD"}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-0.5">Seat</div>
                            <div className="font-semibold">{trip.seat ?? "—"}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-0.5">Departs in</div>
                            <div className="font-semibold text-primary">
                              <FlightCountdown departureTime={trip.departureTime} />
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-0.5">Date</div>
                            <div className="font-semibold">
                              {new Date(trip.departureTime).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* TARA Suggestions */}
          {stats?.suggestedDestinations && stats.suggestedDestinations.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold font-heading mb-3">TARA Suggests</h2>
              <div className="grid grid-cols-2 gap-3">
                {stats.suggestedDestinations.slice(0, 2).map((dest: any, i: number) => (
                  <motion.div
                    key={dest.code}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <Card className="glass-card overflow-hidden hover:border-primary/40 transition-all cursor-pointer group">
                      <div className="h-20 bg-gradient-to-br from-primary/20 to-[#00FF88]/10 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl font-bold font-heading text-white/10 select-none">{dest.code}</span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="text-[10px] bg-background/60 backdrop-blur-sm border-white/20">
                            from ₦{(dest.priceFrom / 1000).toFixed(0)}k
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <div className="font-semibold text-sm">{dest.city}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{dest.reason}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Agent Feed - 1 col */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading flex items-center gap-2">
              <Activity size={16} className="text-[#00FF88]" />
              Agent Feed
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88] agent-active-glow animate-pulse" />
              <span className="text-[10px] text-[#00FF88] font-medium uppercase tracking-wide">Live</span>
            </div>
          </div>

          <div className="space-y-2">
            <AnimatePresence initial={false} mode="popLayout">
              {logs.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="py-8 text-center">
                    <RefreshCw size={20} className="mx-auto mb-2 text-muted-foreground animate-spin" />
                    <p className="text-xs text-muted-foreground">Agents initializing...</p>
                  </CardContent>
                </Card>
              ) : (
                logs.slice(0, 12).map((log) => (
                  <motion.div
                    key={log.id}
                    layout
                    initial={log.isNew ? { opacity: 0, x: 20, scale: 0.95 } : false}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className={`p-3 rounded-lg border transition-colors ${
                      log.isNew
                        ? "bg-primary/5 border-primary/30"
                        : "bg-card/40 border-border/50"
                    }`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[log.severity] ?? "bg-primary"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-[10px] font-semibold text-muted-foreground truncate">
                              {log.agentName.replace(" Agent", "")}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                              {formatTimeAgo(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-foreground leading-snug line-clamp-2">{log.action}</p>
                          {log.severity !== "info" && (
                            <Badge
                              variant="outline"
                              className={`mt-1.5 text-[9px] h-4 px-1.5 ${SEVERITY_COLORS[log.severity]}`}
                            >
                              {log.severity.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <Link href="/agents/log">
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1">
              View full activity log <ArrowRight size={12} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
