import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListAgentLogsQueryKey, getListNotificationsQueryKey, getListAgentsQueryKey, getListActiveTripsQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";

export interface LiveLog {
  id: number;
  agentId: string;
  agentName: string;
  tripId: number | null;
  userId: number;
  action: string;
  result: string;
  severity: "info" | "warning" | "critical";
  notified: boolean;
  createdAt: string;
  isNew?: boolean;
}

export interface LiveNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  tripId: number | null;
  agentId: string | null;
  createdAt: string;
  isNew?: boolean;
}

export function useLiveAgentFeed(isAuthenticated: boolean) {
  const [logs, setLogs] = useState<LiveLog[]>([]);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchRef = useRef<number>(Date.now() - 60000);
  const qc = useQueryClient();

  const fetchRecentActivity = useCallback(async () => {
    const token = localStorage.getItem("tara_token");
    if (!token) return;
    try {
      const res = await fetch(`/api/sse/recent-activity?since=${lastFetchRef.current}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      lastFetchRef.current = data.serverTime;

      if (data.logs?.length) {
        setLogs(prev => {
          const existingIds = new Set(prev.map((l: LiveLog) => l.id));
          const newOnes = (data.logs as LiveLog[]).filter(l => !existingIds.has(l.id)).map(l => ({ ...l, isNew: true }));
          if (!newOnes.length) return prev;
          return [...newOnes, ...prev].slice(0, 50);
        });
      }

      if (data.notifications?.length) {
        setNotifications(prev => {
          const existingIds = new Set(prev.map((n: LiveNotification) => n.id));
          const newOnes = (data.notifications as LiveNotification[]).filter(n => !existingIds.has(n.id)).map(n => ({ ...n, isNew: true }));
          if (!newOnes.length) return prev;
          const unread = newOnes.filter(n => !n.read).length;
          setUnreadCount(c => c + unread);
          return [...newOnes, ...prev].slice(0, 30);
        });
      }

      // Invalidate React Query caches to refresh UI data
      if (data.logs?.length || data.notifications?.length) {
        qc.invalidateQueries({ queryKey: getListAgentLogsQueryKey() });
        qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      }
      if (data.agents?.length) {
        qc.invalidateQueries({ queryKey: getListAgentsQueryKey() });
      }
      if (data.trips?.length) {
        qc.invalidateQueries({ queryKey: getListActiveTripsQueryKey() });
      }
    } catch {
      // Silently fail — polling will retry
    }
  }, [qc]);

  const connectSSE = useCallback(() => {
    const token = localStorage.getItem("tara_token");
    if (!token || esRef.current) return;

    const url = `/api/sse/agents`;
    // SSE doesn't support custom headers, so we can't pass Bearer token directly.
    // Fall back to polling strategy which uses fetch with auth headers.
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial fetch immediately
    fetchRecentActivity();

    // Poll every 15 seconds for live updates
    pollRef.current = setInterval(fetchRecentActivity, 15000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
    };
  }, [isAuthenticated, fetchRecentActivity]);

  // Clear "isNew" flag after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLogs(prev => prev.map(l => ({ ...l, isNew: false })));
      setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
    }, 3000);
    return () => clearTimeout(timer);
  }, [logs.length, notifications.length]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return { logs, notifications, unreadCount, isConnected, markAllRead };
}
