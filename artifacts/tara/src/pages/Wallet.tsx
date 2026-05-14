import { useState } from "react";
import { useGetWallet, useListTransactions, useFundWallet } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ArrowUpRight, ArrowDownRight, Gift, History, Wallet as WalletIcon, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Wallet() {
  const [fundAmount, setFundAmount] = useState("");
  const [isFunding, setIsFunding] = useState(false);
  const { data: wallet, isLoading: walletLoading } = useGetWallet();
  const { data: transactions = [], isLoading: txLoading } = useListTransactions();
  const fundMutation = useFundWallet();
  const { toast } = useToast();

  const handleFund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundAmount || isNaN(Number(fundAmount))) return;
    
    setIsFunding(true);
    // Simulate Paystack UI delay
    setTimeout(() => {
      fundMutation.mutate({ data: { amountNgn: Number(fundAmount) } }, {
        onSuccess: () => {
          toast({ title: "Wallet Funded", description: `Successfully added ₦${Number(fundAmount).toLocaleString()} to your wallet.` });
          setIsFunding(false);
          setFundAmount("");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Funding Failed", description: "Could not add funds at this time." });
          setIsFunding(false);
        }
      });
    }, 1500);
  };

  const displayTx = transactions.length > 0 ? transactions : [
    { id: 1, type: "deposit", description: "Wallet Funding via Paystack", amountNgn: 150000, createdAt: "2024-05-10T10:00:00Z" },
    { id: 2, type: "booking", description: "Air Peace Flight LOS-ABJ", amountNgn: 45000, tripId: 1, createdAt: "2024-05-12T14:30:00Z" },
    { id: 3, type: "refund", description: "Cancelled Hotel Booking Refund", amountNgn: 25000, createdAt: "2024-05-14T09:15:00Z" },
    { id: 4, type: "booking", description: "Transcorp Hilton (1 Night)", amountNgn: 80000, tripId: 1, createdAt: "2024-05-15T18:00:00Z" },
  ];

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownRight className="text-[hsl(150,100%,40%)]" size={20} />;
      case 'refund': return <ArrowDownRight className="text-primary" size={20} />;
      case 'booking': return <ArrowUpRight className="text-destructive" size={20} />;
      case 'reward': return <Gift className="text-[hsl(43,100%,50%)]" size={20} />;
      default: return <History className="text-muted-foreground" size={20} />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight mb-2">Wallet & Payments</h1>
          <p className="text-muted-foreground">
            Manage your funds for autonomous bookings and track agent spending.
          </p>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 glass-card border-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <WalletIcon size={120} />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              Available Balance
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Active for Auto-booking</Badge>
            </div>
            <div className="text-5xl md:text-6xl font-bold font-heading tracking-tight mb-8">
              ₦{wallet?.balance?.toLocaleString() || "125,000"}
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <CreditCard size={18} /> Add Funds
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="font-heading">Fund Wallet</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFund} className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount (₦)</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 50000" 
                        value={fundAmount}
                        onChange={e => setFundAmount(e.target.value)}
                        className="text-lg bg-background"
                      />
                    </div>
                    <div className="p-4 border border-border rounded-lg bg-secondary/50 flex gap-3">
                      <ShieldAlert className="text-muted-foreground shrink-0" size={20} />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Funds are held securely and only used when your authorized agents make bookings on your behalf.
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={!fundAmount || isFunding}>
                      {isFunding ? "Processing via Paystack..." : "Proceed to Pay"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Button size="lg" variant="outline" className="glass-card">Withdraw</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift size={18} className="text-[hsl(43,100%,50%)]" /> TARA Rewards
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-3xl font-bold font-heading mb-1">{wallet?.taraPoints?.toLocaleString() || "2,450"} pts</div>
            <div className="text-sm text-muted-foreground mb-6">≈ ₦24,500 value</div>
            <Button variant="secondary" className="w-full text-xs" size="sm">Redeem for Discounts</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold font-heading">Recent Transactions</h2>
          <Card className="glass-card">
            <div className="divide-y divide-border">
              {displayTx.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      {getTxIcon(tx.type)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{tx.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold font-heading ${tx.type === 'booking' ? 'text-foreground' : 'text-[hsl(150,100%,40%)]'}`}>
                    {tx.type === 'booking' ? '-' : '+'}₦{tx.amountNgn.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border text-center">
              <Button variant="link" className="text-primary text-sm">View All History</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold font-heading">Active Refunds</h2>
          <Card className="glass-card">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border hover:bg-white/5 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-sm">Air Peace Flight LOS-KAN</div>
                  <Badge variant="outline" className="bg-[hsl(43,100%,50%)]/10 text-[hsl(43,100%,50%)] border-[hsl(43,100%,50%)]/20 text-[10px]">Processing</Badge>
                </div>
                <div className="text-xl font-bold font-heading mb-3">₦85,000</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Initiated: May 12</span>
                    <span>Expected: May 19</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-[hsl(43,100%,50%)] w-[60%]"></div>
                  </div>
                </div>
              </div>
              <div className="p-4 text-center text-sm text-muted-foreground">
                TARA Refund Manager is tracking this automatically.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
