import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListTrips, useGetDashboardStats } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Calendar, Search, Filter, TrendingUp, MapPin, Plus, Star } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30",
  upcoming: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-red-400/15 text-red-400 border-red-400/30",
};

function getMostVisited(trips: any[]): string {
  if (!trips.length) return "—";
  const counts: Record<string, number> = {};
  trips.forEach(t => { counts[t.destinationCode] = (counts[t.destinationCode] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}

function getFavoriteAirline(trips: any[]): string {
  if (!trips.length) return "—";
  const counts: Record<string, number> = {};
  trips.forEach(t => { counts[t.airline] = (counts[t.airline] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}

export default function Trips() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: trips = [], isLoading } = useListTrips();
  const { data: stats } = useGetDashboardStats();

  const displayed = useMemo(() => {
    return trips.filter((t: any) => {
      const matchStatus = filter === "all" || t.status === filter;
      const q = search.toLowerCase();
      const matchSearch = !search ||
        t.origin.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        t.originCode.toLowerCase().includes(q) ||
        t.destinationCode.toLowerCase().includes(q) ||
        t.airline.toLowerCase().includes(q) ||
        t.flightNumber.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [trips, filter, search]);

  const mostVisited = getMostVisited(trips);
  const favoriteAirline = getFavoriteAirline(trips);
  const totalSavings = stats?.moneySavedNgn ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight mb-2">My Trips</h1>
          <p className="text-muted-foreground">
            A complete record of your travels managed by TARA.
          </p>
        </div>
        <Link href="/plan">
          <Button className="gap-2 shrink-0">
            <Plus size={15} /> Plan New Trip
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Most Visited</span>
          </div>
          <div className="text-2xl font-bold font-heading">{mostVisited}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Top Airline</span>
          </div>
          <div className="text-lg font-bold font-heading truncate">{favoriteAirline}</div>
        </div>
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-xs text-muted-foreground">AI Savings</span>
          </div>
          <div className="text-2xl font-bold font-heading text-primary">
            ₦{totalSavings.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Plane size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Trips</span>
          </div>
          <div className="text-2xl font-bold font-heading">{trips.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <Input
            placeholder="Search trips, cities, airlines..."
            className="pl-9 h-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-10">
            <Filter size={15} className="mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trips</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trip list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted/40 animate-pulse rounded-xl border border-border" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Plane size={36} className="mx-auto mb-4 opacity-20" />
          <p className="mb-4">No trips found.</p>
          {filter !== "all" && (
            <Button variant="outline" size="sm" onClick={() => setFilter("all")}>Clear filter</Button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[27px] top-4 bottom-4 w-px bg-border hidden md:block" />
          <div className="space-y-5">
            {displayed.map((trip: any, i: number) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative flex gap-6 md:gap-8 group"
              >
                <div className="hidden md:flex flex-col items-center shrink-0 w-14">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-background z-10 transition-all ${
                    trip.status === "active" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-secondary text-muted-foreground"
                  }`}>
                    <Plane size={20} />
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-2 rotate-180 text-center" style={{ writingMode: "vertical-rl" }}>
                    {new Date(trip.departureTime).toLocaleDateString("en-NG", { month: "short", year: "2-digit" })}
                  </div>
                </div>

                <Link href={`/trip/${trip.id}`} className="flex-1 min-w-0">
                  <Card className="glass-card hover:border-primary/30 transition-all cursor-pointer group-hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold font-heading">{trip.originCode}</div>
                            <div className="text-xs text-muted-foreground">{trip.origin}</div>
                          </div>
                          <div className="w-14 h-px bg-border relative">
                            <Plane size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold font-heading">{trip.destinationCode}</div>
                            <div className="text-xs text-muted-foreground">{trip.destination}</div>
                          </div>
                        </div>
                        <div className="flex flex-col md:items-end gap-2">
                          <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wide w-fit ${STATUS_COLORS[trip.status] ?? ""}`}>
                            {trip.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(trip.departureTime).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/50 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{trip.airline}</span>
                        <span>·</span>
                        <span>{trip.flightNumber}</span>
                        <span>·</span>
                        <span>₦{trip.pricePaidNgn.toLocaleString()}</span>
                        {trip.flightStatus && trip.status !== "completed" && (
                          <>
                            <span>·</span>
                            <span className={`font-medium ${
                              trip.flightStatus === "Boarding" || trip.flightStatus === "Final Call" ? "text-yellow-400" : "text-muted-foreground"
                            }`}>{trip.flightStatus}</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
