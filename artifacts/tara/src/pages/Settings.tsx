import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useGetMe, useUpdateProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, ShieldAlert, LogOut, Settings as SettingsIcon } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  seatPreference: z.string().optional(),
  mealPreference: z.string().optional(),
  airlinePreference: z.string().optional(),
});

export default function Settings() {
  const { user, logout } = useAuth();
  const { data: me } = useGetMe();
  const updateMutation = useUpdateProfile();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      seatPreference: "",
      mealPreference: "",
      airlinePreference: "",
    },
  });

  useEffect(() => {
    if (me || user) {
      const data = me || user;
      form.reset({
        name: data?.name || "",
        phone: data?.phone || "",
        seatPreference: data?.seatPreference || "window",
        mealPreference: data?.mealPreference || "standard",
        airlinePreference: data?.airlinePreference || "air-peace",
      });
    }
  }, [me, user, form]);

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    updateMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Profile Updated", description: "Your preferences have been saved." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Update Failed", description: "Could not save your preferences." });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-heading tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, travel preferences, and privacy.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-2">
          <nav className="flex flex-col space-y-1">
            <button className="text-left px-3 py-2 rounded-md bg-primary/10 text-primary font-medium text-sm">Profile & Preferences</button>
            <button className="text-left px-3 py-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground font-medium text-sm transition-colors">Notification Channels</button>
            <button className="text-left px-3 py-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground font-medium text-sm transition-colors">Payment Methods</button>
            <button className="text-left px-3 py-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground font-medium text-sm transition-colors">Privacy & Security</button>
          </nav>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>This information is used for booking flights and hotels.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name (as on ID)</FormLabel>
                        <FormControl><Input {...field} className="bg-background" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input {...field} className="bg-background" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="pt-6 border-t border-border">
                    <h3 className="text-lg font-medium font-heading mb-4">Travel Preferences</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="seatPreference" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seat</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger></FormControl>
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="air-peace">Air Peace</SelectItem>
                              <SelectItem value="ibom-air">Ibom Air</SelectItem>
                              <SelectItem value="united-nigeria">United Nigeria</SelectItem>
                              <SelectItem value="no-preference">No Preference</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <ShieldAlert size={20} /> Danger Zone
              </CardTitle>
              <CardDescription>Permanent actions regarding your account data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border border-destructive/20 rounded-lg bg-background">
                <div>
                  <div className="font-medium">Export Data</div>
                  <div className="text-sm text-muted-foreground">Download a copy of all your trips and agent logs.</div>
                </div>
                <Button variant="outline" className="w-full sm:w-auto shrink-0">Export JSON</Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border border-destructive/20 rounded-lg bg-background">
                <div>
                  <div className="font-medium text-destructive">Delete Account</div>
                  <div className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</div>
                </div>
                <Button variant="destructive" className="w-full sm:w-auto shrink-0">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
