import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (response) => {
        login(response.token, response.user);
        toast({ title: "Welcome back", description: "Successfully logged in." });
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.data?.error || "Invalid credentials",
        });
      }
    });
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data }, {
      onSuccess: (response) => {
        login(response.token, response.user);
        toast({ title: "Account created", description: "Welcome to TARA." });
        // Normally go to /onboarding for new users
        setLocation("/dashboard"); 
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.data?.error || "Could not create account",
        });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Left side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-card border-r border-border p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-heading text-xl">
            T
          </div>
          <span className="text-2xl font-bold font-heading tracking-tight">TARA</span>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl lg:text-5xl font-bold font-heading tracking-tight leading-tight mb-6">
            The travel OS for Nigerian professionals.
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Stop managing bookings. Let our autonomous AI handle your entire journey.
          </p>
        </div>

        <div className="relative z-10 glass-card p-6 rounded-xl max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary agent-active-glow animate-pulse"></div>
            <span className="text-sm font-medium">TARA Active</span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            &gt; Monitoring LOS-ABJ flight AP102<br/>
            &gt; No delays detected<br/>
            &gt; Hotel pre-arrival message sent
          </p>
        </div>
      </div>

      {/* Right side - Forms */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="md:hidden flex items-center justify-center gap-3 mb-8">
            <div className="h-10 w-10 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-heading text-xl">
              T
            </div>
            <span className="text-2xl font-bold font-heading tracking-tight">TARA</span>
          </div>

          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl font-bold font-heading tracking-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? "Enter your credentials to access your agents." : "Sign up to deploy your first travel agent."}
            </p>
          </div>

          <div className="bg-card p-1 rounded-lg flex mb-6">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isLogin ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setIsLogin(true)}
              data-testid="tab-login"
            >
              Log In
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isLogin ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setIsLogin(false)}
              data-testid="tab-register"
            >
              Sign Up
            </button>
          </div>

          <div className="relative">
            {isLogin ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} data-testid="input-login-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} data-testid="input-login-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-12 text-base font-medium mt-6" disabled={loginMutation.isPending} data-testid="button-login-submit">
                      {loginMutation.isPending ? "Logging in..." : "Log In"}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Chinedu Okeke" {...field} data-testid="input-register-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} data-testid="input-register-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} data-testid="input-register-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-12 text-base font-medium mt-6" disabled={registerMutation.isPending} data-testid="button-register-submit">
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
