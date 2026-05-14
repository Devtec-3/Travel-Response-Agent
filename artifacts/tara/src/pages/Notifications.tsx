import { useState } from "react";
import { useListNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useDeleteNotification } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Zap, Hotel, DollarSign, RefreshCw, Info, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const { data: notifications = [], isLoading } = useListNotifications();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();
  const deleteMutation = useDeleteNotification();
  const { toast } = useToast();

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => toast({ title: "Done", description: "All notifications marked as read." })
    });
  };

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate({ id });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => toast({ title: "Deleted", description: "Notification removed." })
    });
  };

  // Mock data
  const displayNotifs = notifications.length > 0 ? notifications : [
    { id: 1, type: "flight", title: "Gate Change: Air Peace 9J102", body: "Your flight from Lagos to Abuja has been moved to Gate D4.", read: false, createdAt: "2024-05-15T07:15:00Z" },
    { id: 2, type: "agent", title: "Hotel Checked In", body: "Hotel Coordinator agent successfully confirmed your late arrival at Transcorp Hilton.", read: false, createdAt: "2024-05-14T18:30:00Z" },
    { id: 3, type: "refund", title: "Refund Processed", body: "₦85,000 has been credited to your wallet for the cancelled Kano flight.", read: true, createdAt: "2024-05-12T09:00:00Z" },
    { id: 4, type: "budget", title: "Budget Alert", body: "You are currently ₦12,000 under budget for your active trip.", read: true, createdAt: "2024-05-10T14:20:00Z" },
  ];

  const getIcon = (type: string) => {
    switch(type) {
      case 'flight': return <Plane className="text-destructive" size={20} />;
      case 'agent': return <Zap className="text-primary" size={20} />;
      case 'hotel': return <Hotel className="text-[hsl(150,100%,40%)]" size={20} />;
      case 'budget': return <DollarSign className="text-[hsl(43,100%,50%)]" size={20} />;
      case 'refund': return <RefreshCw className="text-[hsl(280,100%,60%)]" size={20} />;
      default: return <Info className="text-muted-foreground" size={20} />;
    }
  };

  const getBgStyle = (type: string, read: boolean) => {
    if (read) return "bg-card";
    switch(type) {
      case 'flight': return "bg-destructive/5";
      case 'agent': return "bg-primary/5";
      case 'hotel': return "bg-[hsl(150,100%,40%)]/5";
      case 'budget': return "bg-[hsl(43,100%,50%)]/5";
      case 'refund': return "bg-[hsl(280,100%,60%)]/5";
      default: return "bg-secondary/50";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight mb-2">Alerts Center</h1>
          <p className="text-muted-foreground">
            Stay updated on your flights, agent actions, and account changes.
          </p>
        </div>
        <Button variant="outline" onClick={handleMarkAllRead} className="gap-2 shrink-0">
          <CheckCircle2 size={16} /> Mark all as read
        </Button>
      </header>

      <div className="space-y-4">
        {displayNotifs.map((n) => (
          <Card key={n.id} className={`border transition-colors ${getBgStyle(n.type, n.read)} ${n.read ? 'border-border' : 'border-primary/20 shadow-md'}`}>
            <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
              <div className="flex gap-4 flex-1">
                <div className="mt-1 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${n.read ? 'text-foreground' : 'text-foreground'}`}>{n.title}</h3>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary agent-active-glow"></span>}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">{n.body}</p>
                  <div className="text-xs text-muted-foreground font-mono">
                    {new Date(n.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className="flex sm:flex-col justify-end gap-2 shrink-0 border-t border-border pt-3 sm:border-0 sm:pt-0">
                {!n.read && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-primary" onClick={() => handleMarkRead(n.id)}>
                    Mark Read
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(n.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {displayNotifs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground glass-card rounded-xl">
            No notifications yet.
          </div>
        )}
      </div>
    </div>
  );
}
