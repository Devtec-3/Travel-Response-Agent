import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Shield, Activity, RefreshCw, Zap, Plane, Hotel, MessageSquare,
  Navigation, DollarSign, GitBranch, Clock, TrendingUp, ExternalLink
} from "lucide-react";
import { useListAgents, useUpdateAgent, useGetAgentStats } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListAgentsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const AGENT_ICONS: Record<string, typeof Plane> = {
  flight_monitor: Plane,
  boarding_pass: GitBranch,
  hotel_coordinator: Hotel,
  whatsapp_notifier: MessageSquare,
  departure_advisor: Navigation,
  refund_manager: RefreshCw,
  budget_guardian: DollarSign,
  itinerary_optimizer: TrendingUp,
};

function computeHealthScore(agent: any): number {
  if (!agent.enabled) return 0;
  if (agent.actionsTotal === 0) return 85;
  const hasRecentActivity = agent.lastCheck && (Date.now() - new Date(agent.lastCheck).getTime()) < 10 * 60 * 1000;
  const base = hasRecentActivity ? 95 : 80;
  const bonus = Math.min(agent.actionsTotal, 50) / 50 * 5;
  return Math.round(base + bonus);
}

function formatLastCheck(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function Agents() {
  const { data: agents = [], isLoading } = useListAgents();
  const { data: agentStats } = useGetAgentStats();
  const updateMutation = useUpdateAgent();
  const qc = useQueryClient();
  const { toast } = useToast();

  const handleToggle = (id: string, enabled: boolean) => {
    updateMutation.mutate({ agentId: id, data: { enabled } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAgentsQueryKey() });
        toast({ title: `Agent ${enabled ? "activated" : "deactivated"}` });
      },
    });
  };

  const handleFrequencyChange = (id: string, frequency: number) => {
    updateMutation.mutate({ agentId: id, data: { frequency } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAgentsQueryKey() });
        toast({ title: "Frequency updated", description: `Agent will now check every ${frequency} minutes.` });
      },
    });
  };

  const activeCount = agents.filter((a: any) => a.enabled).length;
  const totalActionsToday = agents.reduce((s: number, a: any) => s + (a.actionsToday || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight mb-2 flex items-center gap-3">
            Autonomous Agents
            <Badge variant="outline" className="bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/30">
              {activeCount} active
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Manage the AI agents running your travel operations 24/7.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xl font-bold font-heading tabular-nums">{totalActionsToday}</div>
            <div className="text-xs text-muted-foreground">actions today</div>
          </div>
          <Link href="/agents/log">
            <Button variant="outline" size="sm" className="gap-2">
              <Activity size={14} /> Activity Log
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat pills */}
      {agentStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Actions", value: (agentStats as any).totalActions?.toLocaleString() ?? "—", icon: Zap },
            { label: "Active Agents", value: `${activeCount}/8`, icon: Shield },
            { label: "Actions Today", value: totalActionsToday, icon: Clock },
            { label: "Health Score", value: `${agents.length ? Math.round(agents.reduce((s: number, a: any) => s + computeHealthScore(a), 0) / agents.length) : 0}%`, icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="p-4 rounded-xl border border-border bg-card/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <div className="text-2xl font-bold font-heading tabular-nums">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Agent grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-56 bg-muted/40 animate-pulse rounded-xl border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent: any, i: number) => {
            const Icon = AGENT_ICONS[agent.type] ?? Zap;
            const health = computeHealthScore(agent);

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className={`glass-card overflow-hidden transition-all duration-300 h-full ${
                  agent.enabled ? "border-primary/20 hover:border-primary/40" : "opacity-65 grayscale-[0.4]"
                }`}>
                  <div className={`h-0.5 ${agent.enabled ? "bg-gradient-to-r from-primary/40 via-[#00FF88]/40 to-primary/40" : "bg-border"}`} />
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${agent.enabled ? "bg-primary/10 border-primary/20" : "bg-secondary border-border"}`}>
                          <Icon size={18} className={agent.enabled ? "text-primary" : "text-muted-foreground"} />
                        </div>
                        <div>
                          <CardTitle className="text-base font-heading leading-tight">{agent.name}</CardTitle>
                          <div className={`flex items-center gap-1 mt-0.5 ${agent.enabled ? "text-[#00FF88]" : "text-muted-foreground"}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${agent.enabled ? "bg-[#00FF88] animate-pulse" : "bg-muted-foreground"}`} />
                            <span className="text-[10px] font-medium uppercase tracking-wide">
                              {agent.enabled ? agent.status || "active" : "disabled"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={agent.enabled}
                        onCheckedChange={val => handleToggle(agent.id, val)}
                      />
                    </div>
                    <CardDescription className="text-xs leading-snug mt-2 line-clamp-2">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Check every</span>
                      <Select
                        disabled={!agent.enabled}
                        value={String(agent.frequency ?? 5)}
                        onValueChange={val => handleFrequencyChange(agent.id, Number(val))}
                      >
                        <SelectTrigger className="h-7 w-[95px] text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 mins</SelectItem>
                          <SelectItem value="15">15 mins</SelectItem>
                          <SelectItem value="30">30 mins</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Health</span>
                        <span className={`font-semibold ${health >= 90 ? "text-[#00FF88]" : health >= 70 ? "text-yellow-400" : "text-red-400"}`}>
                          {health}%
                        </span>
                      </div>
                      <Progress
                        value={health}
                        className="h-1.5"
                      />
                    </div>

                    <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground mb-0.5">Last check</div>
                        <div className="font-medium">{formatLastCheck(agent.lastCheck)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-0.5">Actions today</div>
                        <div className="font-bold text-sm tabular-nums">{agent.actionsToday || 0}</div>
                      </div>
                    </div>

                    {agent.lastAction && (
                      <div className="text-[11px] text-muted-foreground bg-background/50 rounded-md px-2 py-1.5 border border-border/50 leading-snug line-clamp-2">
                        {agent.lastAction}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
