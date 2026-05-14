import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Plane, Hotel, Trash2, Calendar, DollarSign, Clock, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useCreateItinerary, useListItineraries, useDeleteItinerary } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListItinerariesQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const QUICK_PROMPTS = [
  "Weekend trip to Abuja under ₦150,000",
  "3-day business trip Lagos to Port Harcourt",
  "5-day Kano cultural trip under ₦250,000",
  "Short hop LOS to ENU, 2 nights",
];

export default function Plan() {
  const [prompt, setPrompt] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const createMutation = useCreateItinerary();
  const { data: itineraries = [], isLoading: listLoading } = useListItineraries();
  const deleteMutation = useDeleteItinerary();

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || createMutation.isPending) return;

    createMutation.mutate({ data: { prompt } }, {
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: getListItinerariesQueryKey() });
        setExpandedId((data as any).id);
        setPrompt("");
        toast({ title: "Itinerary generated", description: `"${(data as any).title}" is ready.` });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Generation failed", description: "Could not generate itinerary. Try again." });
      },
    });
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListItinerariesQueryKey() });
        if (expandedId === id) setExpandedId(null);
        toast({ title: "Deleted", description: "Itinerary removed." });
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-heading tracking-tight mb-2">Plan a Trip</h1>
        <p className="text-muted-foreground">
          Tell TARA where you want to go. Claude will build an AI-optimized itinerary with real Nigerian flights and hotels.
        </p>
      </div>

      {/* Input card */}
      <Card className="glass-card border-primary/20 shadow-lg">
        <CardContent className="p-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="relative">
              <textarea
                className="w-full min-h-[100px] bg-background border border-border rounded-xl p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50 pr-36"
                placeholder="e.g. Plan a 4-day trip to Abuja and Port Harcourt next month under ₦200,000..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                disabled={createMutation.isPending}
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleGenerate(e as any); }}
              />
              <div className="absolute bottom-3 right-3">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!prompt.trim() || createMutation.isPending}
                  className="gap-2 rounded-lg"
                >
                  {createMutation.isPending
                    ? <><Loader2 className="animate-spin" size={15} /> Generating...</>
                    : <><Send size={15} /> Generate</>
                  }
                </Button>
              </div>
            </div>

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setPrompt(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Generating spinner */}
      <AnimatePresence>
        {createMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="glass-card border-primary/20">
              <CardContent className="py-10 flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  <Plane className="absolute inset-0 m-auto text-primary" size={18} />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Claude is planning your trip...</p>
                  <p className="text-sm text-muted-foreground mt-1">Optimizing flights, hotels, and budget for Nigeria</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Itinerary list */}
      {listLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/40 animate-pulse rounded-xl border border-border" />
          ))}
        </div>
      ) : itineraries.length === 0 && !createMutation.isPending ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar size={32} className="mx-auto mb-3 opacity-20" />
          <p>No itineraries yet. Generate your first trip above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {itineraries.map((itin: any) => (
            <motion.div
              key={itin.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`glass-card overflow-hidden transition-all ${expandedId === itin.id ? "border-primary/30" : "border-border/60"}`}>
                {/* Header row */}
                <button
                  className="w-full text-left p-5 flex items-center justify-between hover:bg-white/3 transition-colors"
                  onClick={() => setExpandedId(expandedId === itin.id ? null : itin.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold font-heading text-lg">{itin.title}</span>
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${
                        itin.status === "approved" ? "bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30" : "bg-muted text-muted-foreground"
                      }`}>
                        {itin.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        ₦{(itin.totalCostNgn || 0).toLocaleString()} estimated
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {Array.isArray(itin.days) ? itin.days.length : 0} days
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(itin.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                      onClick={e => handleDelete(itin.id, e)}
                    >
                      <Trash2 size={15} />
                    </Button>
                    {expandedId === itin.id ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {expandedId === itin.id && Array.isArray(itin.days) && itin.days.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="border-t border-border/50 p-5 space-y-4">
                        {/* Budget bar */}
                        {itin.totalCostNgn > 0 && (
                          <Card className="bg-background/50 border-border/50">
                            <CardContent className="p-4">
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Total Estimated Cost</span>
                                <span className="font-bold">₦{(itin.totalCostNgn).toLocaleString()}</span>
                              </div>
                              <Progress value={70} className="h-1.5" />
                            </CardContent>
                          </Card>
                        )}

                        {/* Days */}
                        <div className="relative">
                          <div className="absolute left-5 top-0 bottom-0 w-px bg-border hidden sm:block" />
                          <div className="space-y-4">
                            {itin.days.map((day: any, i: number) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="flex gap-4 sm:gap-6"
                              >
                                <div className="hidden sm:flex flex-col items-center shrink-0">
                                  <div className="w-10 h-10 rounded-full bg-secondary border-4 border-background flex items-center justify-center text-sm font-bold z-10">
                                    {day.day}
                                  </div>
                                </div>
                                <Card className="flex-1 bg-card/60 border-border/50">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <span className="sm:hidden w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                          {day.day}
                                        </span>
                                        <span className="font-bold font-heading">{day.city}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px]">
                                          {new Date(day.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                                        </Badge>
                                        {day.estimatedCostNgn && (
                                          <span className="text-xs text-muted-foreground">
                                            ₦{day.estimatedCostNgn.toLocaleString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {day.flightSegment && (
                                      <div className="flex items-start gap-2 mb-2 text-sm">
                                        <Plane size={13} className="text-primary mt-0.5 shrink-0" />
                                        <span className="text-muted-foreground">{day.flightSegment}</span>
                                      </div>
                                    )}

                                    {day.hotelName && (
                                      <div className="flex items-start gap-2 mb-3 text-sm pb-3 border-b border-border/50">
                                        <Hotel size={13} className="text-yellow-400 mt-0.5 shrink-0" />
                                        <span className="text-muted-foreground">{day.hotelName}</span>
                                      </div>
                                    )}

                                    {Array.isArray(day.activities) && (
                                      <ul className="space-y-1 mt-2">
                                        {day.activities.map((act: string, j: number) => (
                                          <li key={j} className="text-sm flex items-start gap-2 text-muted-foreground">
                                            <span className="text-primary mt-1 shrink-0">•</span>
                                            {act}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button className="flex-1" size="sm">Approve &amp; Book All</Button>
                          <Button variant="outline" size="sm">Save for Later</Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
