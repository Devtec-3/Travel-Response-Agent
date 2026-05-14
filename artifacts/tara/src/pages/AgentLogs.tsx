import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertTriangle, Zap, RefreshCw, ChevronLeft, Bell } from "lucide-react";
import { useListAgentLogs } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListAgentLogsQueryKey } from "@workspace/api-client-react";

const SEVERITY_STYLES: Record<string, string> = {
  info: "text-primary bg-primary/10 border-primary/20",
  warning: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  critical: "text-red-400 bg-red-400/10 border-red-400/20",
};

const AGENT_LABELS: Record<string, string> = {
  flight_monitor: "Flight Monitor",
  boarding_pass: "Boarding Pass",
  hotel_coordinator: "Hotel Coordinator",
  whatsapp_notifier: "WhatsApp Notifier",
  departure_advisor: "Departure Advisor",
  refund_manager: "Refund Manager",
  budget_guardian: "Budget Guardian",
  itinerary_optimizer: "Itinerary Optimizer",
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AgentLogs() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const qc = useQueryClient();

  const { data: logs = [], isLoading, dataUpdatedAt } = useListAgentLogs();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await qc.invalidateQueries({ queryKey: getListAgentLogsQueryKey() });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Auto-refresh every 15s
  useEffect(() => {
    const t = setInterval(() => {
      qc.invalidateQueries({ queryKey: getListAgentLogsQueryKey() });
    }, 15000);
    return () => clearInterval(t);
  }, [qc]);

  const filtered = logs.filter((log: any) => {
    const matchSeverity = severity === "all" || log.severity === severity;
    const matchAgent = agentFilter === "all" || log.agentName.toLowerCase().includes(agentFilter.replace("_", " ").replace("_", " "));
    const matchSearch = !search || log.action.toLowerCase().includes(search.toLowerCase()) || log.result.toLowerCase().includes(search.toLowerCase());
    return matchSeverity && matchAgent && matchSearch;
  });

  const criticalCount = logs.filter((l: any) => l.severity === "critical").length;
  const warnCount = logs.filter((l: any) => l.severity === "warning").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/agents" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft size={14} /> Agents
        </Link>
        <span>/</span>
        <span className="text-foreground">Activity Log</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight mb-2">Agent Activity Log</h1>
          <p className="text-muted-foreground">
            A real-time ledger of every decision and action taken by your AI agents.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="outline" className="bg-red-400/10 text-red-400 border-red-400/30 gap-1">
                <AlertTriangle size={10} /> {criticalCount} critical
              </Badge>
            )}
            {warnCount > 0 && (
              <Badge variant="outline" className="bg-yellow-400/10 text-yellow-400 border-yellow-400/30 gap-1">
                {warnCount} warnings
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["all", "info", "warning", "critical"] as const).map(s => {
          const count = s === "all" ? logs.length : logs.filter((l: any) => l.severity === s).length;
          return (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`p-3 rounded-lg border text-left transition-all ${
                severity === s ? "border-primary/50 bg-primary/5" : "border-border bg-card/40 hover:border-border/80"
              }`}
            >
              <div className="text-xl font-bold font-heading tabular-nums">{count}</div>
              <div className="text-xs text-muted-foreground capitalize mt-0.5">{s === "all" ? "Total Events" : `${s} Events`}</div>
            </button>
          );
        })}
      </div>

      <Card className="glass-card">
        <CardHeader className="p-4 border-b border-border bg-card/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <Input
                placeholder="Search actions, results..."
                className="pl-9 bg-background h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background h-9">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {Object.entries(AGENT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background h-9">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 sm:p-5 flex gap-4">
                  <div className="w-5 h-5 bg-muted animate-pulse rounded-full mt-1 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-full" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Zap size={28} className="mx-auto mb-3 opacity-30" />
              <p>No matching agent activity.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((log: any, i: number) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="p-4 sm:p-5 hover:bg-white/3 transition-colors flex flex-col sm:flex-row gap-3 sm:items-start"
                >
                  <div className="mt-0.5 shrink-0">
                    {log.severity === "critical" ? (
                      <AlertTriangle size={18} className="text-red-400" />
                    ) : log.severity === "warning" ? (
                      <AlertTriangle size={18} className="text-yellow-400" />
                    ) : (
                      <Zap size={18} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-semibold text-sm">{log.agentName}</span>
                      <span className="text-xs text-muted-foreground font-mono">{formatTimeAgo(log.createdAt)}</span>
                      <Badge variant="outline" className={`text-[10px] h-4 px-1.5 uppercase tracking-wide ${SEVERITY_STYLES[log.severity] ?? SEVERITY_STYLES.info}`}>
                        {log.severity}
                      </Badge>
                      {log.notified && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-0.5">
                          <Bell size={9} /> Notified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground mb-1.5 leading-snug">{log.action}</p>
                    <p className="text-xs font-mono bg-background/60 px-2 py-1 rounded border border-border/50 inline-block leading-relaxed text-muted-foreground">
                      {log.result}
                    </p>
                    <div className="text-[10px] text-muted-foreground mt-1.5 font-mono">
                      {new Date(log.createdAt).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && logs.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {filtered.length} of {logs.length} events · Auto-refreshes every 15s
          {dataUpdatedAt ? ` · Last updated ${formatTimeAgo(new Date(dataUpdatedAt).toISOString())}` : ""}
        </p>
      )}
    </div>
  );
}
