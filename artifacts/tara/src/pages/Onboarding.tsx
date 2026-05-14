import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCompleteOnboarding } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ChevronRight, User, Plane, Bell, Shield, CreditCard } from "lucide-react";

const STEPS = [
  { id: 1, title: "Profile", icon: User },
  { id: 2, title: "Preferences", icon: Plane },
  { id: 3, title: "Alerts", icon: Bell },
  { id: 4, title: "Agents", icon: Shield },
  { id: 5, title: "Wallet", icon: CreditCard },
];

const formSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  seatPreference: z.string(),
  mealPreference: z.string(),
  airlinePreference: z.string(),
  whatsappNumber: z.string().min(10),
});

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const completeMutation = useCompleteOnboarding();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      seatPreference: "window",
      mealPreference: "standard",
      airlinePreference: "air-peace",
      whatsappNumber: user?.phone || "",
    },
  });

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    completeMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Setup Complete", description: "Your TARA agents are now active." });
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.data?.error || "Failed to complete onboarding.",
        });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background p-4 md:p-8">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-heading">
              T
            </div>
            <span className="text-xl font-bold font-heading tracking-tight">TARA Setup</span>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Step {step} of 5
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative flex items-center justify-between mb-12">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary rounded-full -z-10"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full -z-10 transition-all duration-500"
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          ></div>
          
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isPast = step > s.id;
            
            return (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? "bg-primary text-primary-foreground agent-active-glow" : 
                  isPast ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {isPast ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                </div>
                <span className={`text-xs font-medium hidden md:block ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
              <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold font-heading mb-2">Let's get to know you</h2>
                        <p className="text-muted-foreground">Basic information for your travel profile.</p>
                      </div>
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Full Name (as on ID)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+234..." {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold font-heading mb-2">Travel Preferences</h2>
                        <p className="text-muted-foreground">TARA will prioritize these when booking.</p>
                      </div>
                      <FormField control={form.control} name="seatPreference" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seat Preference</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select seat" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="window">Window</SelectItem>
                              <SelectItem value="aisle">Aisle</SelectItem>
                              <SelectItem value="middle">Middle</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="airlinePreference" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Airline</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select airline" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="air-peace">Air Peace</SelectItem>
                              <SelectItem value="ibom-air">Ibom Air</SelectItem>
                              <SelectItem value="united-nigeria">United Nigeria</SelectItem>
                              <SelectItem value="no-preference">No Preference (Best Price)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold font-heading mb-2">Notification Setup</h2>
                        <p className="text-muted-foreground">How should TARA reach you?</p>
                      </div>
                      <FormField control={form.control} name="whatsappNumber" render={({ field }) => (
                        <FormItem><FormLabel>WhatsApp Number for Boarding Passes & Alerts</FormLabel><FormControl><Input placeholder="+234..." {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                        <div>
                          <div className="font-medium">Email Summaries</div>
                          <div className="text-sm text-muted-foreground">Weekly agent activity reports</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold font-heading mb-2">Activate Autonomous Agents</h2>
                        <p className="text-muted-foreground">Give TARA permission to handle these tasks automatically.</p>
                      </div>
                      <div className="space-y-4">
                        {[
                          { title: "Flight Monitor", desc: "Checks delays every 5 mins" },
                          { title: "Refund Manager", desc: "Auto-claims for cancellations" },
                          { title: "Boarding Pass Delivery", desc: "Auto-sends to WhatsApp" }
                        ].map((agent, i) => (
                          <div key={i} className="flex items-center justify-between p-4 border border-primary/20 rounded-lg bg-primary/5">
                            <div>
                              <div className="font-medium text-primary">{agent.title}</div>
                              <div className="text-sm text-muted-foreground">{agent.desc}</div>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 5 && (
                    <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold font-heading mb-2">Fund Wallet</h2>
                        <p className="text-muted-foreground">Add initial funds for autonomous bookings.</p>
                      </div>
                      <div className="p-6 border border-border rounded-xl bg-card space-y-4">
                        <div className="text-center mb-6">
                          <div className="text-sm text-muted-foreground mb-1">Recommended Initial Balance</div>
                          <div className="text-4xl font-bold font-heading tracking-tight">₦100,000</div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Card Number</label>
                            <Input placeholder="0000 0000 0000 0000" disabled />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Expiry</label>
                              <Input placeholder="MM/YY" disabled />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">CVV</label>
                              <Input type="password" placeholder="123" disabled />
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 text-center">
                          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">Simulated for Demo</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-8 mt-8 border-t border-border">
                <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1} className="w-24">
                  Back
                </Button>
                
                {step < 5 ? (
                  <Button type="button" onClick={nextStep} className="w-32 gap-2">
                    Next <ChevronRight size={16} />
                  </Button>
                ) : (
                  <Button type="submit" className="w-40 gap-2" disabled={completeMutation.isPending}>
                    {completeMutation.isPending ? "Setting up..." : "Finish Setup"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>

      </div>
    </div>
  );
}
