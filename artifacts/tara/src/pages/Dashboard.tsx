import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, AlertTriangle, CloudRain, Clock, MapPin, Zap } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Hardcoded for now until we hook up actual APIs
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight mb-2">
            Good morning, {user?.name?.split(' ')[0] || "Traveler"}.
          </h1>
          <p className="text-muted-foreground">
            TARA is monitoring <span className="font-medium text-foreground">1 active trip</span>.
          </p>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Trips" value="12" />
        <StatCard title="Miles Traveled" value="4,280 km" />
        <StatCard title="Money Saved" value="₦45,000" highlight />
        <StatCard title="Active Agents" value="8/8" />
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Active Trip */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold font-heading">Active Trip</h2>
          
          <Card className="glass-card overflow-hidden border-primary/20">
            <div className="h-1 bg-gradient-to-r from-primary via-[#00FF88] to-primary"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00FF88] agent-active-glow animate-pulse"></div>
                  <span className="text-sm font-medium text-[#00FF88]">Flight Monitor Agent Active</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  On Time
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold font-heading mb-1">LOS</div>
                  <div className="text-sm text-muted-foreground">Lagos</div>
                  <div className="font-mono text-sm mt-2">08:00 AM</div>
                </div>
                
                <div className="flex-1 flex items-center justify-center px-4 relative">
                  <div className="absolute w-full h-[2px] bg-border left-0 top-1/2 -translate-y-1/2"></div>
                  <Plane className="text-primary relative z-10 bg-card p-1 -mt-1" size={28} />
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold font-heading mb-1">ABJ</div>
                  <div className="text-sm text-muted-foreground">Abuja</div>
                  <div className="font-mono text-sm mt-2">09:15 AM</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-background/50 border border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Flight</div>
                  <div className="font-medium">Air Peace 9J102</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Gate</div>
                  <div className="font-medium">D4</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Seat</div>
                  <div className="font-medium">12A (Window)</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Boarding</div>
                  <div className="font-medium text-warning">07:20 AM</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Activity Feed */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-heading">Agent Activity</h2>
          
          <Card className="h-[400px] flex flex-col">
            <CardHeader className="py-4 border-b border-border">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap size={16} className="text-primary" /> Live Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              <div className="divide-y divide-border">
                <ActivityRow 
                  agent="Hotel Coordinator" 
                  time="2m ago" 
                  action="Confirmed late check-in for Transcorp Hilton."
                  type="success"
                />
                <ActivityRow 
                  agent="Flight Monitor" 
                  time="15m ago" 
                  action="Checked AP102 status. No delays detected."
                  type="info"
                />
                <ActivityRow 
                  agent="Smart Advisor" 
                  time="1h ago" 
                  action="Traffic heavy on Airport Road. Leave 20m earlier."
                  type="warning"
                />
                <ActivityRow 
                  agent="WhatsApp Notifier" 
                  time="1h ago" 
                  action="Boarding pass delivered to +234***"
                  type="success"
                />
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, highlight = false }: { title: string, value: string, highlight?: boolean }) {
  return (
    <Card className={`overflow-hidden ${highlight ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardContent className="p-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">{title}</div>
        <div className={`text-2xl font-bold font-heading ${highlight ? 'text-primary' : ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function ActivityRow({ agent, time, action, type }: { agent: string, time: string, action: string, type: 'info'|'success'|'warning' }) {
  const colors = {
    info: "text-primary bg-primary/10",
    success: "text-[hsl(150,100%,40%)] bg-[hsl(150,100%,40%)]/10",
    warning: "text-[hsl(43,100%,50%)] bg-[hsl(43,100%,50%)]/10"
  };

  return (
    <div className="p-4 flex gap-4 text-sm hover:bg-muted/50 transition-colors">
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors[type].split(' ')[0].replace('text-', 'bg-')}`}></div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-foreground">{agent}</span>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="text-muted-foreground leading-relaxed">{action}</p>
      </div>
    </div>
  );
}
