import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react"; // Will mock this since we shouldn't install it
import { Plane, AlertCircle, CloudSun, Send, MapPin, Share2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Mock Data
const MOCK_TRIP = {
  id: 1,
  status: "active",
  origin: "Lagos", originCode: "LOS",
  destination: "Abuja", destinationCode: "ABJ",
  airline: "Air Peace", flightNumber: "9J102",
  departureTime: "2024-05-15T08:00:00Z",
  gate: "D4", terminal: "MM2", seat: "12A",
  flightStatus: "On Time"
};

export default function TripDetail() {
  const params = useParams();
  const { toast } = useToast();
  const trip = MOCK_TRIP;

  const handleShare = () => {
    toast({ title: "Sent to WhatsApp", description: "Boarding pass sent to your registered number." });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/trips" className="hover:text-foreground transition-colors">Trips</Link>
        <span>/</span>
        <span className="text-foreground">LOS to ABJ</span>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column - Boarding Pass */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-bold font-heading">Digital Pass</h2>
          
          <div className="relative group perspective-1000">
            {/* Front of Pass */}
            <Card className="w-full bg-[#0A0F2C] border-none text-white overflow-hidden shadow-2xl relative z-10 transition-transform duration-500 transform-style-3d group-hover:rotate-y-180">
              {/* Airline Header */}
              <div className="bg-[#0047BB] p-4 flex justify-between items-center">
                <span className="font-bold tracking-widest text-lg">{trip.airline}</span>
                <Plane size={24} />
              </div>
              
              <CardContent className="p-0">
                <div className="p-6 border-b border-white/10">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="text-4xl font-bold font-heading">{trip.originCode}</div>
                      <div className="text-xs text-white/70 mt-1">{trip.origin}</div>
                    </div>
                    <Plane size={24} className="text-white/50" />
                    <div className="text-right">
                      <div className="text-4xl font-bold font-heading">{trip.destinationCode}</div>
                      <div className="text-xs text-white/70 mt-1">{trip.destination}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <div>
                      <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Flight</div>
                      <div className="font-mono text-sm">{trip.flightNumber}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Gate</div>
                      <div className="font-mono text-sm text-[#00FF88] font-bold">{trip.gate}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Seat</div>
                      <div className="font-mono text-sm">{trip.seat}</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-white/5 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Passenger</div>
                    <div className="font-bold">CHINEDU OKEKE</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Boarding</div>
                    <div className="font-bold text-lg">07:20 AM</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Back of Pass (Mock QR) */}
            <Card className="absolute inset-0 w-full bg-white text-black overflow-hidden shadow-2xl transition-transform duration-500 transform-style-3d rotate-y-180 backface-hidden flex flex-col items-center justify-center p-8">
              <div className="w-48 h-48 bg-black flex items-center justify-center p-2 mb-4">
                {/* Mock QR Code Pattern */}
                <div className="w-full h-full bg-white grid grid-cols-5 grid-rows-5 gap-1 p-2">
                  {[...Array(25)].map((_, i) => (
                    <div key={i} className={`${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}></div>
                  ))}
                </div>
              </div>
              <p className="font-mono text-xs text-center text-black/50">TARA-SEQ-9J102-LOS-ABJ</p>
            </Card>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleShare} className="flex-1 gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white">
              <Share2 size={16} /> WhatsApp
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <Wallet size={16} /> Add to Wallet
            </Button>
          </div>
        </div>

        {/* Right Column - Tracker & Alerts */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-xl font-bold font-heading">Live Status</h2>
          
          {/* Tracker Card */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-8">
                <Badge variant="outline" className="bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20 agent-active-glow">
                  Flight Monitor Active
                </Badge>
                <span className="text-sm font-medium">Updated 2m ago</span>
              </div>
              
              <div className="relative pt-4 pb-8">
                <div className="absolute left-0 top-[26px] w-full h-1 bg-secondary rounded-full"></div>
                <div className="absolute left-0 top-[26px] w-[25%] h-1 bg-primary rounded-full"></div>
                
                <div className="relative flex justify-between">
                  {/* Scheduled */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary relative z-10"></div>
                    <span className="text-xs font-medium">Scheduled</span>
                  </div>
                  {/* Boarding */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary relative z-10">
                      <Plane size={16} className="absolute -top-6 -left-1 text-primary animate-bounce" />
                    </div>
                    <span className="text-xs font-medium text-primary">Boarding</span>
                  </div>
                  {/* In Air */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-secondary relative z-10"></div>
                    <span className="text-xs text-muted-foreground">In Air</span>
                  </div>
                  {/* Landed */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-secondary relative z-10"></div>
                    <span className="text-xs text-muted-foreground">Landed</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Smart Alerts */}
          <h2 className="text-xl font-bold font-heading pt-4">Smart Alerts</h2>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-[hsl(43,100%,50%)]/10 border border-[hsl(43,100%,50%)]/20 flex gap-4 items-start">
              <AlertCircle className="text-[hsl(43,100%,50%)] shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-[hsl(43,100%,50%)] mb-1">Gate Change</h4>
                <p className="text-sm text-muted-foreground">Air Peace 9J102 has changed from Gate D2 to Gate D4. Distance: 3 min walk.</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex gap-4 items-start">
              <MapPin className="text-primary shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-primary mb-1">Traffic Alert</h4>
                <p className="text-sm text-muted-foreground">Heavy traffic on Airport Road. Leave by 5:30 AM to arrive 2 hours before departure.</p>
              </div>
            </div>
          </div>

          {/* Destination Weather */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <Card className="bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Abuja Weather</div>
                  <div className="text-2xl font-bold font-heading">28°C</div>
                  <div className="text-xs">Partly Cloudy</div>
                </div>
                <CloudSun size={32} className="text-muted-foreground" />
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Hotel Drop-off</div>
                <div className="font-semibold text-sm truncate">Transcorp Hilton</div>
                <Button variant="link" className="px-0 h-auto text-xs text-primary mt-2">View details</Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
