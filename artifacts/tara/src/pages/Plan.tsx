import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Send, Map, Calendar, DollarSign, Loader2, Plane, Hotel } from "lucide-react";
import { useCreateItinerary, useListItineraries } from "@workspace/api-client-react";

export default function Plan() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  
  const createMutation = useCreateItinerary();

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedPlan({
        title: "Abuja & PH Business Trip",
        totalCost: 185000,
        budget: 200000,
        days: [
          { day: 1, date: "Oct 12", city: "Abuja", flight: "LOS → ABJ (Air Peace - ₦45,000)", hotel: "Transcorp Hilton (₦80,000/night)", activities: ["Arrival & Check-in", "Afternoon client meetings"] },
          { day: 2, date: "Oct 13", city: "Abuja", activities: ["Full day conference", "Dinner at Wuse II"] },
          { day: 3, date: "Oct 14", city: "Port Harcourt", flight: "ABJ → PHC (Ibom Air - ₦60,000)", hotel: "Presidential Hotel (₦55,000/night)", activities: ["Morning flight", "Site inspection"] },
        ]
      });
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-heading tracking-tight mb-2">Plan a Trip</h1>
        <p className="text-muted-foreground">
          Tell TARA where you want to go, and it will build an optimized itinerary and budget.
        </p>
      </header>

      <Card className="glass-card border-primary/20 shadow-lg">
        <CardContent className="p-6">
          <form onSubmit={handleGenerate} className="relative">
            <textarea
              className="w-full min-h-[120px] bg-background border border-border rounded-xl p-4 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
              placeholder="e.g. Plan a 5-day trip to Abuja and Port Harcourt next month under ₦200,000..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <Button type="submit" size="lg" disabled={!prompt.trim() || isGenerating} className="rounded-full shadow-md">
                {isGenerating ? <Loader2 className="animate-spin mr-2" size={18} /> : <Send size={18} className="mr-2" />}
                {isGenerating ? "Optimizing..." : "Generate Itinerary"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {generatedPlan && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-heading">{generatedPlan.title}</h2>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">₦{generatedPlan.totalCost.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Estimated Total</div>
            </div>
          </div>

          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Budget Utilization</span>
                <span className="font-bold">{Math.round((generatedPlan.totalCost / generatedPlan.budget) * 100)}%</span>
              </div>
              <Progress value={(generatedPlan.totalCost / generatedPlan.budget) * 100} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">₦{(generatedPlan.budget - generatedPlan.totalCost).toLocaleString()} under budget</p>
            </CardContent>
          </Card>

          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {generatedPlan.days.map((day: any, i: number) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Timeline dot */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-secondary text-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  {day.day}
                </div>
                
                {/* Card */}
                <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] glass-card">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">{day.date}</Badge>
                      <span className="font-bold font-heading">{day.city}</span>
                    </div>
                    
                    {day.flight && (
                      <div className="flex items-start gap-2 mb-2 text-sm">
                        <Plane size={14} className="text-primary mt-1 shrink-0" />
                        <span className="text-muted-foreground">{day.flight}</span>
                      </div>
                    )}
                    
                    {day.hotel && (
                      <div className="flex items-start gap-2 mb-3 text-sm border-b border-border/50 pb-3">
                        <Hotel size={14} className="text-[hsl(43,100%,50%)] mt-1 shrink-0" />
                        <span className="text-muted-foreground">{day.hotel}</span>
                      </div>
                    )}
                    
                    <ul className="space-y-1 mt-2">
                      {day.activities.map((act: string, j: number) => (
                        <li key={j} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span> {act}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button size="lg" className="w-full sm:w-auto">Approve & Book All</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
