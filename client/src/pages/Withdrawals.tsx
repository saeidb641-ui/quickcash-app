import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Wallet,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const withdrawSchema = z.object({
  amount: z.number().min(3, "Minimum withdrawal is $3"),
  method: z.enum(["paypal", "bitcoin", "skrill", "wise"]),
  paymentAddress: z.string().min(3, "Enter your payment address"),
});

type WithdrawForm = z.infer<typeof withdrawSchema>;

const methodConfig = {
  paypal: { label: "PayPal", icon: "💳", placeholder: "your@email.com" },
  bitcoin: { label: "Bitcoin", icon: "₿", placeholder: "Bitcoin wallet address" },
  skrill: { label: "Skrill", icon: "💰", placeholder: "your@email.com" },
  wise: { label: "Wise", icon: "🌍", placeholder: "your@email.com or account number" },
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2 },
  completed: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

export default function Withdrawals() {
  const [selectedMethod, setSelectedMethod] = useState<"paypal" | "bitcoin" | "skrill" | "wise">("paypal");
  const { data: stats } = trpc.earnings.stats.useQuery();
  const { data: history, refetch } = trpc.withdrawals.history.useQuery();
  const utils = trpc.useUtils();

  const balance = parseFloat(stats?.balance ?? "0");

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { method: "paypal" },
  });

  const requestWithdrawal = trpc.withdrawals.request.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal request submitted successfully!");
      reset();
      refetch();
      utils.earnings.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (data: WithdrawForm) => {
    requestWithdrawal.mutate(data);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Withdraw Earnings</h1>
          <p className="text-muted-foreground mt-1">Request a payout to your preferred payment method. Minimum $3.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Withdrawal Form */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Request Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Balance Display */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
                <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
                <p className="text-3xl font-display font-bold text-primary">${balance.toFixed(2)}</p>
                {balance < 3 && (
                  <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Need ${(3 - balance).toFixed(2)} more to withdraw
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Amount */}
                <div>
                  <Label htmlFor="amount" className="text-sm font-medium">Amount (USD)</Label>
                  <div className="relative mt-1.5">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="3"
                      max={balance}
                      placeholder="3.00"
                      className="pl-9"
                      {...register("amount", { valueAsNumber: true })}
                    />
                  </div>
                  {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
                  <div className="flex gap-2 mt-2">
                    {[5, 10, 25, 50].map(amt => (
                      <Button
                        key={amt}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        disabled={balance < amt}
                        onClick={() => setValue("amount", amt)}
                      >
                        ${amt}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={balance < 3}
                      onClick={() => setValue("amount", Math.floor(balance * 100) / 100)}
                    >
                      Max
                    </Button>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <Select
                    value={selectedMethod}
                    onValueChange={(v) => {
                      const m = v as "paypal" | "bitcoin" | "skrill" | "wise";
                      setSelectedMethod(m);
                      setValue("method", m);
                    }}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(methodConfig).map(([key, { label, icon }]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <span>{icon}</span>
                            <span>{label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Address */}
                <div>
                  <Label htmlFor="address" className="text-sm font-medium">
                    {methodConfig[selectedMethod].label} Address
                  </Label>
                  <Input
                    id="address"
                    placeholder={methodConfig[selectedMethod].placeholder}
                    className="mt-1.5"
                    {...register("paymentAddress")}
                  />
                  {errors.paymentAddress && <p className="text-xs text-destructive mt-1">{errors.paymentAddress.message}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary text-white border-0 hover:opacity-90"
                  disabled={requestWithdrawal.isPending || balance < 3}
                >
                  {requestWithdrawal.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    "Request Withdrawal"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <div className="space-y-4">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-4">Payment Methods</h3>
                <div className="space-y-3">
                  {Object.entries(methodConfig).map(([key, { label, icon }]) => (
                    <div key={key} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                      <span className="text-xl">{icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">Min. $3.00 · Processed daily</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-primary/5 border-primary/20">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-3">Payout Schedule</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Payments processed every Thursday</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Minimum withdrawal: $3.00</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> No maximum withdrawal limit</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Instant notification on completion</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Withdrawal History */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {!history || history.length === 0 ? (
              <div className="text-center py-10">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map(w => {
                  const config = statusConfig[w.status];
                  const StatusIcon = config.icon;
                  return (
                    <div key={w.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                        {methodConfig[w.method]?.icon ?? "💰"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{methodConfig[w.method]?.label ?? w.method}</p>
                        <p className="text-xs text-muted-foreground truncate">{w.paymentAddress}</p>
                        {w.adminNote && (
                          <p className="text-xs text-orange-600 mt-0.5">{w.adminNote}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-foreground">${parseFloat(w.amount).toFixed(2)}</p>
                        <Badge className={`text-xs mt-0.5 ${config.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="text-right flex-shrink-0 hidden md:block">
                        <p className="text-xs text-muted-foreground">{new Date(w.requestedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
