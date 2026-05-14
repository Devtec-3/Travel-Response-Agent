import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { useGetTrip, useGetBoardingPass, useGetTripAlerts, useListAgentLogs } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Plane, AlertCircle, MapPin, Share2, Wallet, Clock, Hotel, ChevronLeft, Activity, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const STATUS_STEPS = ["On Time", "Check-In Open", "Boarding", "Final Call", "Departed", "In Air", "Landing", "Landed"];
const STATUS_INDEX: Record<string, number> = {
  "On Time": 0, "Check-In Open": 1, "Boarding": 2, "Final Call": 3,
  "Departed": 4, "In Air": 5, "Landing": 6, "Landed": 7, "Delayed": 1, "Cancelled": 0,
};
const COMPACT_STEPS = ["Scheduled", "Boarding", "In Air", "Landed"];
const COMPACT_INDEX: Record<string, number> = {
  "On Time": 0, "Check-In Open": 0, "Boarding": 1, "Final Call": 1,
  "Departed": 2, "In Air": 2, "Landing": 3, "Landed": 3, "Delayed": 0,
};

const STATUS_COLOR: Record<string, string> = {
  "On Time": "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30",
  "Check-In Open": "bg-primary/15 text-primary border-primary/30",
  "Boarding": "bg-yellow-400/15 text-yellow-400 border-yellow-400/30",
  "Final Call": "bg-red-400/15 text-red-400 border-red-400/30",
  "Departed": "bg-muted text-muted-foreground border-border",
  "In Air": "bg-primary/15 text-primary border-primary/30",
  "Landing": "bg-yellow-400/15 text-yellow-400 border-yellow-400/30",
  "Landed": "bg-muted text-muted-foreground border-border",
  "Delayed": "bg-red-400/15 text-red-400 border-red-400/30",
};

const ALERT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-red-400/10", text: "text-red-400", border: "border-red-400/20" },
  warning: { bg: "bg-yellow-400/10", text: "text-yellow-400", border: "border-yellow-400/20" },
  info: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
};

function FlightCountdown({ departureTime }: { departureTime: string }) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    const update = () => {
      const ms = new Date(departureTime).getTime() - Date.now();
      if (ms <= 0) { setDisplay("Departed"); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setDisplay(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [departureTime]);
  return <span className="font-mono tabular-nums">{display}</span>;
}

function BoardingPassCard({ trip, passengerName }: { trip: any; passengerName: string }) {
  const [flipped, setFlipped] = useState(false);
  const boardingTime = new Date(trip.departureTime);
  boardingTime.setMinutes(boardingTime.getMinutes() - 40);

  return (
    <div
      className="relative h-[340px] cursor-pointer perspective-1000"
      onClick={() => setFlipped(f => !f)}
      title="Click to flip"
    >
      <motion.div
        className="absolute inset-0 w-full h-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 w-full rounded-xl overflow-hidden shadow-2xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="bg-[#0A0F2C] text-white h-full flex flex-col">
            <div className="bg-[#0047BB] px-5 py-3 flex justify-between items-center">
              <span className="font-bold tracking-widest text-base">{trip.airline}</span>
              <Plane size={20} />
            </div>
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-4xl font-bold font-heading">{trip.originCode}</div>
                  <div className="text-xs text-white/60 mt-0.5">{trip.origin}</div>
                  <div className="font-mono text-sm mt-2 text-white/80">
                    {new Date(trip.departureTime).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <Plane size={22} className="text-white/30" />
                <div className="text-right">
                  <div className="text-4xl font-bold font-heading">{trip.destinationCode}</div>
                  <div className="text-xs text-white/60 mt-0.5">{trip.destination}</div>
                  <div className="font-mono text-sm mt-2 text-white/80">
                    {new Date(trip.arrivalTime).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Flight</div>
                  <div className="font-mono text-sm">{trip.flightNumber}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Gate</div>
                  <div className="font-mono text-sm text-[#00FF88] font-bold">{trip.gate || "TBD"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Seat</div>
                  <div className="font-mono text-sm">{trip.seat || "—"}</div>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-white/10 pt-4">
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Passenger</div>
                  <div className="font-bold text-sm uppercase tracking-wide">{passengerName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Boarding</div>
                  <div className="font-bold">
                    {boardingTime.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back — QR Code */}
        <div
          className="absolute inset-0 w-full rounded-xl overflow-hidden shadow-2xl bg-white flex flex-col items-center justify-center p-6 gap-4"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="w-40 h-40 border-4 border-gray-900 p-2">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {Array.from({ length: 10 }).map((_, r) =>
                Array.from({ length: 10 }).map((_, c) => {
                  const seed = (r * 13 + c * 7 + r * c * 3) % 17;
                  return seed < 8 ? (
                    <rect key={`${r}-${c}`} x={c * 10} y={r * 10} width={9} height={9} fill="#000" />
                  ) : null;
                })
              )}
              <rect x={0} y={0} width={30} height={30} fill="#000" rx={2} />
              <rect x={3} y={3} width={24} height={24} fill="#fff" rx={1} />
              <rect x={6} y={6} width={18} height={18} fill="#000" rx={1} />
              <rect x={70} y={0} width={30} height={30} fill="#000" rx={2} />
              <rect x={73} y={3} width={24} height={24} fill="#fff" rx={1} />
              <rect x={76} y={6} width={18} height={18} fill="#000" rx={1} />
              <rect x={0} y={70} width={30} height={30} fill="#000" rx={2} />
              <rect x={3} y={73} width={24} height={24} fill="#fff" rx={1} />
              <rect x={6} y={76} width={18} height={18} fill="#000" rx={1} />
            </svg>
          </div>
          <p className="font-mono text-xs text-center text-gray-400">
            TARA-{trip.flightNumber}-{trip.originCode}-{trip.destinationCode}
          </p>
          <p className="text-xs text-gray-500 text-center">Tap to flip back</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function TripDetail() {
  const params = useParams<{ id: string }>();
  const tripId = Number(params.id);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: trip, isLoading: tripLoading } = useGetTrip(tripId);
  const { data: alerts = [] } = useGetTripAlerts(tripId);
  const { data: agentLogs = [] } = useListAgentLogs();

  const handleWhatsApp = () => {
    toast({ title: "Sent to WhatsApp", description: "Boarding pass sent to your registered number." });
  };

  if (tripLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 h-96 bg-muted animate-pulse rounded-xl" />
          <div className="lg:col-span-7 h-96 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-5xl mx-auto text-center py-24">
        <p className="text-muted-foreground mb-4">Trip not found.</p>
        <Link href="/trips"><Button variant="outline">Back to Trips</Button></Link>
      </div>
    );
  }

  const statusIdx = COMPACT_INDEX[trip.flightStatus] ?? 0;
  const progressPct = (statusIdx / (COMPACT_STEPS.length - 1)) * 100;
  const minsUntilDep = (new Date(trip.departureTime).getTime() - Date.now()) / 60000;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/trips" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft size={14} /> Trips
        </Link>
        <span>/</span>
        <span className="text-foreground">{trip.originCode} to {trip.destinationCode}</span>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left — Boarding Pass */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading">Digital Pass</h2>
            <Badge variant="outline" className={`text-xs font-bold ${STATUS_COLOR[trip.flightStatus] ?? ""}`}>
              {trip.flightStatus}
            </Badge>
          </div>

          <BoardingPassCard trip={trip} passengerName={user?.name?.toUpperCase() || "PASSENGER"} />

          <div className="flex gap-3">
            <Button onClick={handleWhatsApp} className="flex-1 gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white border-0">
              <Share2 size={15} /> WhatsApp
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <Wallet size={15} /> Add to Wallet
            </Button>
          </div>

          {/* Trip details */}
          <Card className="glass-card">
            <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Airline</div>
                <div className="font-semibold">{trip.airline}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Terminal</div>
                <div className="font-semibold">{trip.terminal || "TBD"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Date</div>
                <div className="font-semibold">
                  {new Date(trip.departureTime).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}
                </div>
              </div>
              {minsUntilDep > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Departs in</div>
                  <div className="font-semibold text-primary">
                    <FlightCountdown departureTime={trip.departureTime} />
                  </div>
                </div>
              )}
              {trip.hotelName && (
                <div className="col-span-2 border-t border-border/50 pt-3">
                  <div className="flex items-center gap-2">
                    <Hotel size={14} className="text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Hotel</div>
                      <div className="font-semibold">{trip.hotelName}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — Tracker & Alerts */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-xl font-bold font-heading">Live Status</h2>

          {/* Flight tracker */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
                  <span className="text-xs font-medium text-[#00FF88]">Flight Monitor Active</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {/* Route display */}
              <div className="flex items-center justify-between mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold font-heading">{trip.originCode}</div>
                  <div className="text-xs text-muted-foreground mt-1">{trip.origin}</div>
                  <div className="font-mono text-sm mt-1 text-muted-foreground">
                    {new Date(trip.departureTime).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center px-4 relative">
                  <div className="absolute w-full h-px bg-border top-3" />
                  <motion.div
                    className="relative z-10"
                    animate={{ x: [`${Math.min(progressPct, 90) - 10}%`, `${Math.min(progressPct, 90)}%`] }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                  >
                    <Plane className="text-primary" size={22} />
                  </motion.div>
                  <div className="text-[10px] text-muted-foreground mt-2">{trip.flightNumber}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold font-heading">{trip.destinationCode}</div>
                  <div className="text-xs text-muted-foreground mt-1">{trip.destination}</div>
                  <div className="font-mono text-sm mt-1 text-muted-foreground">
                    {new Date(trip.arrivalTime).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              {/* Status timeline */}
              <div className="relative pt-2 pb-6">
                <div className="absolute left-0 top-5 w-full h-1 bg-secondary rounded-full" />
                <motion.div
                  className="absolute left-0 top-5 h-1 bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <div className="relative flex justify-between">
                  {COMPACT_STEPS.map((step, i) => {
                    const done = i <= statusIdx;
                    const current = i === statusIdx;
                    return (
                      <div key={step} className="flex flex-col items-center gap-2">
                        <div className={`w-4 h-4 rounded-full z-10 transition-all ${done ? "bg-primary" : "bg-secondary"} ${current ? "ring-2 ring-primary/40 ring-offset-1 ring-offset-background" : ""}`} />
                        <span className={`text-xs font-medium ${current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Smart Alerts */}
          {alerts.length > 0 && (
            <>
              <h2 className="text-lg font-bold font-heading">Smart Alerts</h2>
              <div className="space-y-3">
                {alerts.map((alert: any) => {
                  const colors = ALERT_COLORS[alert.severity] ?? ALERT_COLORS.info;
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-lg ${colors.bg} border ${colors.border} flex gap-3 items-start`}
                    >
                      <AlertCircle className={colors.text} size={18} />
                      <div>
                        <h4 className={`font-semibold text-sm ${colors.text} mb-1 capitalize`}>{alert.type.replace("_", " ")}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          via {alert.agentName} · {new Date(alert.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {/* Agent activity on this trip */}
          {agentLogs.length > 0 && (
            <>
              <h2 className="text-lg font-bold font-heading flex items-center gap-2">
                <Activity size={16} className="text-[#00FF88]" /> Agent Activity
              </h2>
              <div className="space-y-2">
                {agentLogs.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="p-3 rounded-lg bg-card/40 border border-border/50">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-muted-foreground">{log.agentName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(log.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground leading-snug">{log.action}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Budget summary */}
          {trip.budgetNgn && (
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Trip Budget</span>
                  <span className="text-sm text-muted-foreground">
                    ₦{(trip.spentNgn || 0).toLocaleString()} / ₦{trip.budgetNgn.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(((trip.spentNgn || 0) / trip.budgetNgn) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ₦{(trip.budgetNgn - (trip.spentNgn || 0)).toLocaleString()} remaining
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
