import { useState } from "react";
import { motion } from "framer-motion";
import { useGetAdminStats, useListAdminUsers, useListAdminTrips, useMakeUserAdmin } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plane, Activity, Shield, TrendingUp, UserCheck, Cpu, Bell, Star } from "lucide-react";

const TABS = ["Overview", "Users", "Trips"] as const;
type Tab = typeof TABS[number];

function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }: {
  icon: any; label: string; value: number | string; sub?: string; color?: string;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`p-2.5 rounded-lg bg-secondary ${color}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold font-heading">{typeof value === "number" ? value.toLocaleString() : value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [userSearch, setUserSearch] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: users = [], isLoading: usersLoading } = useListAdminUsers();
  const { data: trips = [], isLoading: tripsLoading } = useListAdminTrips();
  const makeAdminMutation = useMakeUserAdmin();

  const filteredUsers = (users as any[]).filter(u =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleMakeAdmin = (userId: number, name: string) => {
    makeAdminMutation.mutate({ userId }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["admin"] });
        toast({ title: `${name} is now an admin` });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update role" }),
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Admin Console</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform management and analytics</p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs font-semibold border-primary/30 text-primary bg-primary/8">
          <Shield size={12} /> Admin
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "Overview" && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Users" value={stats.totalUsers} sub={`+${stats.newUsersToday} today`} />
                <StatCard icon={Plane} label="Total Trips" value={stats.totalTrips} sub={`${stats.activeTrips} active`} color="text-[#00FF88]" />
                <StatCard icon={Cpu} label="Active Agents" value={`${stats.activeAgents}/${stats.totalAgents}`} sub="agents running" color="text-yellow-400" />
                <StatCard icon={TrendingUp} label="Agent Actions" value={stats.totalAgentActions} sub="all time" color="text-purple-400" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Bell} label="Notifications" value={stats.totalNotifications} color="text-orange-400" />
                <StatCard icon={Activity} label="Active Trips" value={stats.activeTrips} color="text-[#00FF88]" />
                <StatCard icon={UserCheck} label="New Today" value={stats.newUsersToday} color="text-primary" />
                <StatCard icon={Star} label="Total Agents" value={stats.totalAgents} color="text-yellow-400" />
              </div>

              {/* Quick summary card */}
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Platform Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Agent Utilization", value: stats.totalAgents > 0 ? Math.round((stats.activeAgents / stats.totalAgents) * 100) : 0, color: "bg-[#00FF88]" },
                    { label: "Trip Activity Rate", value: stats.totalTrips > 0 ? Math.round((stats.activeTrips / stats.totalTrips) * 100) : 0, color: "bg-primary" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold">{value}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${color} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* Users tab */}
      {tab === "Users" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="flex-1 max-w-sm h-9 px-3 rounded-lg border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">{filteredUsers.length} users</span>
          </div>

          {usersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user: any) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-card transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{user.name}</span>
                        {user.isAdmin && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">Admin</Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${user.plan === "pro" ? "border-yellow-400/30 text-yellow-400" : "border-border text-muted-foreground"}`}>
                          {user.plan}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <div className="hidden sm:flex gap-4 text-xs text-muted-foreground">
                      <span className="font-medium">{user.tripCount} trips</span>
                      <span>{user.agentCount} agents</span>
                      <span>{user.taraPoints.toLocaleString()} pts</span>
                    </div>
                    {!user.isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 gap-1"
                        onClick={() => handleMakeAdmin(user.id, user.name)}
                        disabled={makeAdminMutation.isPending}
                      >
                        <Shield size={11} /> Make Admin
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trips tab */}
      {tab === "Trips" && (
        <div className="space-y-2">
          {tripsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : (trips as any[]).length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No trips found.</div>
          ) : (
            (trips as any[]).map((trip: any) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-card transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Plane size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-sm">{trip.flightNumber}</span>
                      <span className="text-sm font-medium">{trip.originCode} — {trip.destinationCode}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${
                        trip.status === "active" ? "border-[#00FF88]/30 text-[#00FF88]" :
                        trip.status === "completed" ? "border-border text-muted-foreground" :
                        "border-primary/30 text-primary"
                      }`}>
                        {trip.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trip.airline} · {trip.userName} · {new Date(trip.departureTime).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 ml-4">
                  <Badge variant="outline" className={`text-xs capitalize ${
                    trip.flightStatus === "On Time" ? "border-[#00FF88]/30 text-[#00FF88]" :
                    trip.flightStatus === "Boarding" ? "border-yellow-400/30 text-yellow-400" :
                    trip.flightStatus === "Delayed" ? "border-red-400/30 text-red-400" :
                    "border-border text-muted-foreground"
                  }`}>
                    {trip.flightStatus}
                  </Badge>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
