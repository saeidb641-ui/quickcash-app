import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Award,
  Users,
  Trophy,
  Gift,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  task: { icon: DollarSign, color: "text-green-600", bg: "bg-green-50", label: "Task" },
  referral: { icon: Users, color: "text-blue-600", bg: "bg-blue-50", label: "Referral" },
  contest: { icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50", label: "Contest" },
  bonus: { icon: Gift, color: "text-purple-600", bg: "bg-purple-50", label: "Bonus" },
};

export default function Earnings() {
  const [limit, setLimit] = useState(20);
  const { data: earnings, isLoading } = trpc.earnings.history.useQuery({ limit, offset: 0 });
  const { data: stats } = trpc.earnings.stats.useQuery();

  const balance = parseFloat(stats?.balance ?? "0");
  const daily = parseFloat(stats?.daily ?? "0");
  const weekly = parseFloat(stats?.weekly ?? "0");
  const total = parseFloat(stats?.total ?? "0");

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Earnings History</h1>
          <p className="text-muted-foreground mt-1">Track all your earnings from tasks, referrals, and contests.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Available Balance", value: `$${balance.toFixed(2)}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
            { label: "Earned Today", value: `$${daily.toFixed(2)}`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "This Week", value: `$${weekly.toFixed(2)}`, icon: Award, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "Total Earned", value: `$${total.toFixed(2)}`, icon: Trophy, color: "text-orange-500", bg: "bg-orange-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-4.5 h-4.5 ${color}`} style={{ width: '18px', height: '18px' }} />
                </div>
                <p className="text-xl font-display font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Earnings List */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !earnings || earnings.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No earnings yet</p>
                <p className="text-sm text-muted-foreground mt-1">Complete your first task to start earning!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {earnings.map(earning => {
                  const config = typeConfig[earning.type] ?? typeConfig.task;
                  const Icon = config.icon;
                  return (
                    <div key={earning.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{earning.description ?? "Earning"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(earning.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-green-600">+${parseFloat(earning.amount).toFixed(4)}</p>
                        <Badge variant="outline" className={`text-xs mt-0.5 ${config.color} border-current/20`}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}

                {earnings.length >= limit && (
                  <div className="pt-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLimit(l => l + 20)}
                    >
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
