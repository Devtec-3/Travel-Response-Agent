import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useGetWallet, useListTransactions, useFundWallet } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { CreditCard, ArrowUpRight, ArrowDownLeft, Gift, History, Wallet as WalletIcon, ShieldAlert, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetWalletQueryKey, getListTransactionsQueryKey } from "@workspace/api-client-react";

const TX_ICONS: Record<string, { icon: typeof ArrowDownLeft; color: string }> = {
  deposit: { icon: ArrowDownLeft, color: "text-[#00FF88]" },
  refund: { icon: ArrowDownLeft, color: "text-primary" },
  booking: { icon: ArrowUpRight, color: "text-red-400" },
  reward: { icon: Gift, color: "text-yellow-400" },
};

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000];

function buildSpendingChart(transactions: any[]) {
  if (!transactions.length) return [];
  const sorted = [...transactions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const byDay: Record<string, { income: number; expense: number }> = {};
  sorted.forEach(tx => {
    const day = new Date(tx.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
    if (!byDay[day]) byDay[day] = { income: 0, expense: 0 };
    if (tx.type === "deposit" || tx.type === "refund" || tx.type === "reward") {
      byDay[day].income += tx.amountNgn;
    } else {
      byDay[day].expense += tx.amountNgn;
    }
  });
  return Object.entries(byDay).slice(-14).map(([date, vals]) => ({ date, ...vals }));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "income" ? "In" : "Out"}: ₦{p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function Wallet() {
  const [fundAmount, setFundAmount] = useState("");
  const [fundOpen, setFundOpen] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: wallet, isLoading: walletLoading } = useGetWallet();
  const { data: transactions = [], isLoading: txLoading } = useListTransactions();
  const fundMutation = useFundWallet();

  const chartData = useMemo(() => buildSpendingChart(transactions), [transactions]);

  const totalIn = useMemo(() =>
    transactions.filter((t: any) => t.type === "deposit" || t.type === "refund").reduce((s: number, t: any) => s + t.amountNgn, 0),
    [transactions]
  );
  const totalOut = useMemo(() =>
    transactions.filter((t: any) => t.type === "booking").reduce((s: number, t: any) => s + t.amountNgn, 0),
    [transactions]
  );

  const handleFund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) return;
    setIsFunding(true);
    setTimeout(() => {
      fundMutation.mutate({ data: { amountNgn: Number(fundAmount) } }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetWalletQueryKey() });
          qc.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          toast({ title: "Wallet Funded", description: `₦${Number(fundAmount).toLocaleString()} added successfully.` });
          setFundAmount("");
          setFundOpen(false);
          setIsFunding(false);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Funding Failed", description: "Could not add funds. Try again." });
          setIsFunding(false);
        },
      });
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold font-heading tracking-tight mb-2">Wallet & Payments</h1>
        <p className="text-muted-foreground">Manage your funds for autonomous agent bookings.</p>
      </div>

      {/* Balance + Rewards */}
      <div className="grid md:grid-cols-3 gap-5">
        <Card className="md:col-span-2 glass-card border-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <WalletIcon size={140} />
          </div>
          <CardContent className="p-7 relative z-10">
            <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
              Available Balance
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                Auto-booking enabled
              </Badge>
            </div>
            {walletLoading ? (
              <div className="h-14 w-48 bg-muted animate-pulse rounded mb-8" />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-5xl md:text-6xl font-bold font-heading tracking-tight mb-7"
              >
                ₦{(wallet?.balance || 0).toLocaleString()}
              </motion.div>
            )}
            <div className="flex flex-wrap gap-3">
              <Dialog open={fundOpen} onOpenChange={setFundOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <CreditCard size={17} /> Add Funds
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px] bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="font-heading">Fund Wallet via Paystack</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFund} className="space-y-5 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_AMOUNTS.map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setFundAmount(String(amt))}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                            fundAmount === String(amt) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                          }`}
                        >
                          ₦{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Custom Amount (₦)</label>
                      <Input
                        type="number"
                        placeholder="Enter amount..."
                        value={fundAmount}
                        onChange={e => setFundAmount(e.target.value)}
                        className="bg-background text-base"
                      />
                    </div>
                    <div className="p-3 border border-border rounded-lg bg-secondary/50 flex gap-3">
                      <ShieldAlert className="text-muted-foreground shrink-0 mt-0.5" size={16} />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Funds are only used when your authorized agents make bookings on your behalf.
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={!fundAmount || isFunding}>
                      {isFunding ? "Processing via Paystack..." : `Pay ₦${Number(fundAmount || 0).toLocaleString()}`}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Button size="lg" variant="outline">Withdraw</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift size={16} className="text-yellow-400" /> TARA Rewards
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6 space-y-4">
            {walletLoading ? (
              <div className="h-8 w-28 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div>
                  <div className="text-3xl font-bold font-heading">{(wallet?.taraPoints || 0).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">points ≈ ₦{((wallet?.taraPoints || 0) * 10).toLocaleString()}</div>
                </div>
                <Button variant="secondary" className="w-full text-xs" size="sm">Redeem for Discounts</Button>
              </>
            )}
          </CardContent>

          <div className="border-t border-border px-5 pb-5 pt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Total In</div>
              <div className="font-bold text-[#00FF88] text-sm">+₦{totalIn.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Total Out</div>
              <div className="font-bold text-red-400 text-sm">-₦{totalOut.toLocaleString()}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Spending chart */}
      {chartData.length > 1 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown size={16} className="text-muted-foreground" /> Spending Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF88" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#00FF88" strokeWidth={1.5} fill="url(#incomeGrad)" name="income" />
                <Area type="monotone" dataKey="expense" stroke="#3B82F6" strokeWidth={1.5} fill="url(#expenseGrad)" name="expense" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-0.5 bg-[#00FF88]" /> Money in
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-0.5 bg-primary" /> Money out
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <div>
        <h2 className="text-xl font-bold font-heading mb-4">Recent Transactions</h2>
        <Card className="glass-card">
          {txLoading ? (
            <div className="divide-y divide-border">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                  </div>
                  <div className="w-16 h-5 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <CardContent className="py-12 text-center text-muted-foreground">
              <History size={28} className="mx-auto mb-3 opacity-20" />
              <p>No transactions yet.</p>
            </CardContent>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx: any) => {
                const meta = TX_ICONS[tx.type] ?? { icon: History, color: "text-muted-foreground" };
                const Icon = meta.icon;
                const isCredit = tx.type === "deposit" || tx.type === "refund" || tx.type === "reward";
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 flex items-center justify-between hover:bg-white/3 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <Icon className={meta.color} size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{tx.description}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {new Date(tx.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                    <div className={`font-bold text-sm tabular-nums ${isCredit ? "text-[#00FF88]" : "text-foreground"}`}>
                      {isCredit ? "+" : "-"}₦{tx.amountNgn.toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
