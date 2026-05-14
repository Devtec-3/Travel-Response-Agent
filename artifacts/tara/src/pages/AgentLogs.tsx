import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Zap, Shield, Plane, AlertTriangle } from "lucide-react";
import { useListAgentLogs } from "@workspace/api-client-react";

export default function AgentLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const { data: logs = [], isLoading } = useListAgentLogs();

  // Mock data
  const displayLogs = logs.length > 0 ? logs : [
    { id: 1, agentName: "Flight Monitor", severity: "info", action: "Checked AP102 status. No delays.", result: "Success", timestamp: "10 mins ago", notified: false },
    { id: 2, agentName: "Refund Manager", severity: "success", action: "Initiated refund for cancelled LOS-KAN flight.", result: "₦85,000 pending", timestamp: "2 hours ago", notified: true },
    { id: 3, agentName: "Smart Advisor", severity: "warning", action: "Detected traffic accident on route to MM2.", result: "Sent early departure alert", timestamp: "5 hours ago", notified: true },
    { id: 4, agentName: "Budget Guardian", severity: "critical", action: "Hotel booking exceeds per-night budget limit.", result: "Blocked booking, requesting override", timestamp: "1 day ago", notified: true },
    { id: 5, agentName: "Boarding Pass Bot", severity: "success", action: "Generated and synced QR code to WhatsApp.", result: "Delivered", timestamp: "1 day ago", notified: true },
  ];

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "success": return "text-[hsl(150,100%,40%)] bg-[hsl(150,100%,40%)]/10 border-[hsl(150,100%,40%)]/20";
      case "warning": return "text-[hsl(43,100%,50%)] bg-[hsl(43,100%,50%)]/10 border-[hsl(43,100%,50%)]/20";
      case "critical": return "text-destructive bg-destructive/10 border-destructive/20";
      default: return "text-primary bg-primary/10 border-primary/20"; // info
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/agents" className="hover:text-foreground transition-colors">Agents</Link>
            <span>/</span>
            <span className="text-foreground">Activity Log</span>
          </div>
          <h1 className="text-3xl font-bold font-heading tracking-tight mb-2">Agent Activity Log</h1>
          <p className="text-muted-foreground">
            A real-time ledger of every decision and action taken by your AI agents.
          </p>
        </div>
      </header>

      <Card className="glass-card">
        <CardHeader className="p-4 border-b border-border bg-card/50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                placeholder="Search actions..." 
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {displayLogs.map((log) => (
              <div key={log.id} className="p-4 sm:p-6 hover:bg-white/5 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {log.severity === 'critical' || log.severity === 'warning' ? (
                      <AlertTriangle size={20} className={log.severity === 'critical' ? 'text-destructive' : 'text-[hsl(43,100%,50%)]'} />
                    ) : (
                      <Zap size={20} className={log.severity === 'success' ? 'text-[hsl(150,100%,40%)]' : 'text-primary'} />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{log.agentName}</span>
                      <span className="text-xs text-muted-foreground">• {log.timestamp}</span>
                      <Badge variant="outline" className={`text-[10px] uppercase px-1.5 py-0 ${getSeverityStyle(log.severity)}`}>
                        {log.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{log.action}</p>
                    <p className="text-xs font-mono bg-background px-2 py-1 rounded inline-block border border-border">↳ {log.result}</p>
                  </div>
                </div>
                {log.notified && (
                  <Badge variant="secondary" className="shrink-0 self-start sm:self-center text-xs">User Notified</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
