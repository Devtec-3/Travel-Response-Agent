import { useState } from "react";
import { Link } from "wouter";
import { useListTrips, useGetDashboardStats } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, MapPin, Calendar, Search, Filter } from "lucide-react";

export default function Trips() {
  const [filter, setFilter] = useState("all");
  const { data: trips = [], isLoading } = useListTrips();
  const { data: stats } = useGetDashboardStats();

  // Mock data for UI
  const displayTrips = trips.length > 0 ? trips : [
    { id: 1, originCode: "LOS", destinationCode: "ABJ", origin: "Lagos", destination: "Abuja", airline: "Air Peace", departureTime: "2024-05-15T08:00:00Z", status: "active", pricePaidNgn: 45000, savings: 12000 },
    { id: 2, originCode: "ABJ", destinationCode: "PHC", origin: "Abuja", destination: "Port Harcourt", airline: "Ibom Air", departureTime: "2024-04-10T14:30:00Z", status: "completed", pricePaidNgn: 65000, savings: 5000 },
    { id: 3, originCode: "LOS", destinationCode: "KAN", origin: "Lagos", destination: "Kano", airline: "Max Air", departureTime: "2024-02-22T09:15:00Z", status: "completed", pricePaidNgn: 85000, savings: 0 },
    { id: 4, originCode: "LOS", destinationCode: "ABJ", origin: "Lagos", destination: "Abuja", airline: "Air Peace", departureTime: "2024-06-01T07:00:00Z", status: "upcoming", pricePaidNgn: 40000, savings: 25000 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight mb-2">Trip History</h1>
          <p className="text-muted-foreground">
            A complete record of your travels managed by TARA.
          </p>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-xs text-muted-foreground mb-1">Most Visited</div>
          <div className="text-xl font-bold font-heading">Abuja (ABJ)</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-xs text-muted-foreground mb-1">Favorite Airline</div>
          <div className="text-xl font-bold font-heading">Air Peace</div>
        </div>
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
          <div className="text-xs text-muted-foreground mb-1">Total AI Savings</div>
          <div className="text-xl font-bold font-heading text-primary">₦{stats?.moneySavedNgn?.toLocaleString() || "142,500"}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-xs text-muted-foreground mb-1">Carbon Footprint</div>
          <div className="text-xl font-bold font-heading text-green-500">1.2t CO₂</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input placeholder="Search trips, cities, airlines..." className="pl-9 h-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] h-10">
            <Filter size={16} className="mr-2" />
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trips</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        <div className="absolute left-[27px] top-4 bottom-4 w-px bg-border hidden md:block"></div>
        
        <div className="space-y-6">
          {displayTrips.map((trip) => (
            <div key={trip.id} className="relative flex gap-6 md:gap-8 group">
              <div className="hidden md:flex flex-col items-center shrink-0 w-14">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-background z-10 ${trip.status === 'active' ? 'bg-primary text-primary-foreground agent-active-glow' : 'bg-secondary text-muted-foreground'}`}>
                  <Plane size={20} />
                </div>
                <div className="text-xs font-mono text-muted-foreground mt-2 rotate-180" style={{ writingMode: 'vertical-rl' }}>
                  {new Date(trip.departureTime).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                </div>
              </div>
              
              <Link href={`/trip/${trip.id}`} className="flex-1 min-w-0">
                <Card className="glass-card hover:bg-white/10 dark:hover:bg-white/5 transition-colors cursor-pointer border-transparent hover:border-border">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold font-heading">{trip.originCode}</div>
                          <div className="text-xs text-muted-foreground">{trip.origin}</div>
                        </div>
                        <div className="w-16 h-px bg-border relative">
                          <Plane size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold font-heading">{trip.destinationCode}</div>
                          <div className="text-xs text-muted-foreground">{trip.destination}</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:items-end gap-2">
                        <Badge variant="outline" className={`
                          ${trip.status === 'active' ? 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/30' : ''}
                          ${trip.status === 'upcoming' ? 'bg-primary/20 text-primary border-primary/30' : ''}
                        `}>
                          {trip.status.toUpperCase()}
                        </Badge>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(trip.departureTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50 text-sm">
                      <div className="font-medium">{trip.airline}</div>
                      <div className="text-muted-foreground">•</div>
                      <div>₦{trip.pricePaidNgn.toLocaleString()}</div>
                      {trip.savings > 0 && (
                        <>
                          <div className="text-muted-foreground">•</div>
                          <div className="text-primary font-medium flex items-center gap-1">
                            Saved ₦{trip.savings.toLocaleString()}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
