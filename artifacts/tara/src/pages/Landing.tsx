import { motion } from "framer-motion";
import { Link } from "wouter";
import { Plane, Shield, MessageSquare, Zap, Map, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col overflow-hidden">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 glass-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-heading">
              T
            </div>
            <span className="text-xl font-bold font-heading tracking-tight">TARA</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Log In</Link>
            <Link href="/login">
              <Button data-testid="button-get-started">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 md:pt-36 md:pb-48 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10"></div>
          <div className="container mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                3,847 flights monitored right now
              </div>
              <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight mb-6 leading-tight">
                Your AI travel agent <br className="hidden md:block" />
                <span className="text-primary">that never sleeps.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                TARA is a premium autonomous agent for Nigerian professionals. We handle the bookings, the delays, the refunds, and the hotel calls—so you can just travel.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8" data-testid="button-hero-cta">
                    Meet TARA
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 glass-card">
                    See how it works
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-card/50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Not a booking site. An Agent.</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">TARA uses 8 specialized autonomous agents to manage every aspect of your journey.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard 
                icon={<MessageSquare className="text-primary" />}
                title="Conversational Booking"
                description="Just tell TARA what you need. 'I need to be in Abuja by 9am tomorrow.' TARA finds the flights and books them."
              />
              <FeatureCard 
                icon={<Zap className="text-[hsl(151,100%,50%)]" />}
                title="Real-time Monitoring"
                description="TARA checks your flight status every 5 minutes and alerts you to delays before the airline even announces them at the gate."
              />
              <FeatureCard 
                icon={<Shield className="text-[hsl(43,100%,50%)]" />}
                title="Refund Management"
                description="Flight cancelled? TARA automatically initiates the refund process and follows up until the money is back in your wallet."
              />
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-heading text-xs">
              T
            </div>
            <span className="font-bold font-heading">TARA</span>
          </div>
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} TARA Travel. Agentic AI for Nigeria.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-6 rounded-2xl glass-card relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-2 h-2 rounded-full bg-primary agent-active-glow"></div>
      </div>
      <div className="h-12 w-12 rounded-lg bg-background flex items-center justify-center mb-6 border border-border">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-heading mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
