import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Shield, Activity, Settings2, Power, AlertTriangle, MessageSquare, Briefcase, RefreshCw, Zap } from "lucide-react";
import { useListAgents, useUpdateAgent } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Agents() {
  const { data: agents = [], isLoading } = useListAgents();
  const updateMutation = useUpdateAgent();
  const { toast } = useToast();

  const handleToggle = (id: string, enabled: boolean) => {
    updateMutation.mutate({ id, data: { enabled } }, {
      onSuccess: () => {
        toast({ title: "Agent Updated", description: `Agent ${enabled ? 'activated' : 'deactivated'} successfully.` });
      }
    });
  };

  if (isLoading) {
    return <div className="p-8">Loading agents...</div>;
  }

  // Mock data if API is empty
  const displayAgents = agents.length > 0 ? agents : [
    { id: "1", name: "Flight Monitor", description: "Checks for delays and gate changes every 5 mins.", status: "active", enabled: true, healthScore: 98, actionsToday: 42, frequency: 5 },
    { id: "2", name: "Refund Manager", description: "Automatically initiates and tracks refund requests.", status: "idle", enabled: true, healthScore: 100, actionsToday: 0, frequency: 60 },
    { id: "3", name: "Boarding Pass Bot", description: "Syncs passes to WhatsApp and Apple Wallet.", status: "active", enabled: true, healthScore: 100, actionsToday: 2, frequency: 30 },
    { id: "4", name: "Hotel Coordinator", description: "Sends pre-arrival messages to confirm late check-in.", status: "idle", enabled: true, healthScore: 95, actionsToday: 1, frequency: 120 },
    { id: "5", name: "Smart Departure", description: "Monitors traffic to airport and alerts when to leave.", status: "active", enabled: true, healthScore: 92, actionsToday: 15, frequency: 15 },
    { id: "6", name: "Budget Guardian", description: "Tracks spending against trip budget in real-time.", status: "error", enabled: true, healthScore: 45, actionsToday: 8, frequency: 60 },
    { id: "7", name: "Itinerary Optimizer", description: "Suggests alternative routes to save money.", status: "idle", enabled: false, healthScore: 0, actionsToday: 0, frequency: 1440 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight mb-2 flex items-center gap-3">
            Autonomous Agents
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">8 Active</Badge>
          </h1>
          <p className="text-muted-foreground">
            Manage the AI agents running your travel operations in the background.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href='/agents/log'}>View Activity Log</Button>
          <Button size="sm" className="gap-2"><RefreshCw size={14} /> Restart All</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent, onToggle }: { agent: any, onToggle: (id: string, val: boolean) => void }) {
  const getStatusColor = (status: string, enabled: boolean) => {
    if (!enabled) return "bg-muted text-muted-foreground";
    if (status === "active") return "bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/30 agent-active-glow";
    if (status === "error") return "bg-destructive/20 text-destructive border-destructive/30";
    return "bg-secondary text-secondary-foreground";
  };

  return (
    <Card className={`glass-card overflow-hidden transition-all duration-300 ${agent.enabled ? 'border-primary/20' : 'opacity-75 grayscale-[0.5]'}`}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-background border border-border">
              <Zap size={20} className={agent.enabled ? "text-primary" : "text-muted-foreground"} />
            </div>
            <div>
              <CardTitle className="text-lg font-heading">{agent.name}</CardTitle>
            </div>
          </div>
          <Switch checked={agent.enabled} onCheckedChange={(val) => onToggle(agent.id, val)} />
        </div>
        <CardDescription className="line-clamp-2">{agent.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline" className={`uppercase text-[10px] tracking-wider font-bold ${getStatusColor(agent.status, agent.enabled)}`}>
              {agent.enabled ? agent.status : "Disabled"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Check Frequency</span>
            <Select disabled={!agent.enabled} defaultValue={agent.frequency.toString()}>
              <SelectTrigger className="h-7 w-[100px] text-xs">
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

          <div className="pt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Health Score</span>
              <span className={agent.healthScore < 80 ? "text-destructive" : "text-foreground"}>{agent.healthScore}%</span>
            </div>
            <Progress value={agent.healthScore} className="h-1.5" />
          </div>

          <div className="pt-4 border-t border-border flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{agent.actionsToday}</span> actions today
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" disabled={!agent.enabled}>
              <Activity size={12} className="mr-1" /> View Logic
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
