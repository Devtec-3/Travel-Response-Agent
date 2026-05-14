import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useDeleteNotification } from "@workspace/api-client-react";
import { useLiveAgentFeed } from "@/hooks/useLiveAgentFeed";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plane, Zap, Hotel, DollarSign, RefreshCw, Info,
  Trash2, CheckCircle2, Bell, BellOff, Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListNotificationsQueryKey } from "@workspace/api-client-react";

const TYPE_META: Record<string, { icon: typeof Plane; color: string; bg: string; border: string }> = {
  flight_update: { icon: Plane, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
  boarding: { icon: Plane, color: "text-yellow-400", bg: "bg-yellow-400/5", border: "border-yellow-400/20" },
  agent_action: { icon: Zap, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
  hotel: { icon: Hotel, color: "text-[#00FF88]", bg: "bg-[#00FF88]/5", border: "border-[#00FF88]/20" },
  budget: { icon: DollarSign, color: "text-yellow-400", bg: "bg-yellow-400/5", border: "border-yellow-400/20" },
  refund: { icon: RefreshCw, color: "text-purple-400", bg: "bg-purple-400/5", border: "border-purple-400/20" },
  default: { icon: Info, color: "text-muted-foreground", bg: "bg-secondary/30", border: "border-border" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Notifications() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useListNotifications();
  const { notifications: liveNotifs } = useLiveAgentFeed(isAuthenticated);
  const markAllReadMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();
  const deleteMutation = useDeleteNotification();

  // Merge DB notifications with live ones (deduplicate by id)
  const dbIds = new Set(notifications.map((n: any) => n.id));
  const merged = [
    ...liveNotifs.filter(n => !dbIds.has(n.id)),
    ...notifications,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered = merged.filter((n: any) => {
    const matchType = typeFilter === "all" || n.type === typeFilter;
    const matchRead = !showUnreadOnly || !n.read;
    return matchType && matchRead;
  });

  const unreadCount = merged.filter((n: any) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast({ title: "Done", description: "All notifications marked as read." });
      },
    });
  };

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast({ title: "Deleted" });
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight mb-2 flex items-center gap-3">
            Alerts Center
            {unreadCount > 0 && (
              <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            Real-time alerts from your AI agents and flight updates.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUnreadOnly(v => !v)}
            className={`gap-2 ${showUnreadOnly ? "border-primary/50 text-primary" : ""}`}
          >
            {showUnreadOnly ? <Bell size={14} /> : <BellOff size={14} />}
            {showUnreadOnly ? "Unread only" : "All"}
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
              <CheckCircle2 size={14} /> Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Filter size={15} className="text-muted-foreground shrink-0" />
        <div className="flex gap-2 flex-wrap">
          {["all", "flight_update", "boarding", "agent_action", "budget", "hotel", "refund"].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${
                typeFilter === type
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {type === "all" ? "All" : type.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/40 animate-pulse rounded-xl border border-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Bell size={32} className="mx-auto mb-3 opacity-20" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((n: any) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.default;
              const Icon = meta.icon;
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className={`border transition-colors overflow-hidden ${
                    !n.read ? `${meta.bg} ${meta.border} shadow-sm` : "border-border bg-card"
                  }`}>
                    <div className="flex gap-4 p-4 sm:p-5">
                      <div className={`mt-0.5 shrink-0 p-2 rounded-lg ${!n.read ? meta.bg : "bg-secondary/50"}`}>
                        <Icon className={!n.read ? meta.color : "text-muted-foreground"} size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm leading-tight">{n.title}</h3>
                            {!n.read && (
                              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            )}
                            {(n as any).isNew && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-primary/10 text-primary border-primary/20">
                                NEW
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!n.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-primary px-2"
                                onClick={() => handleMarkRead(n.id)}
                              >
                                Read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                              onClick={() => handleDelete(n.id)}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{n.body}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-muted-foreground font-mono">{timeAgo(n.createdAt)}</span>
                          <span className="text-xs text-muted-foreground capitalize">{n.type.replace("_", " ")}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
