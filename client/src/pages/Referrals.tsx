import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Users,
  Copy,
  Check,
  DollarSign,
  TrendingUp,
  Share2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Referrals() {
  const [copied, setCopied] = useState(false);
  const { data: codeData } = trpc.referrals.myCode.useQuery();
  const { data: referrals, isLoading } = trpc.referrals.list.useQuery();
  const { data: stats } = trpc.referrals.stats.useQuery();

  const referralLink = codeData?.code
    ? `${window.location.origin}/?ref=${codeData.code}`
    : "";

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share && referralLink) {
      navigator.share({
        title: "Join EarnBucks and earn real cash!",
        text: "I've been earning money on EarnBucks. Join using my referral link and we both earn more!",
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Referral Program</h1>
          <p className="text-muted-foreground mt-1">Earn 10% commission on every dollar your referrals earn — forever!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-1 gradient-primary" />
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{stats?.count ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-1 bg-green-500" />
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">
                    ${parseFloat(stats?.totalCommission ?? "0").toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Commission</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-1 bg-blue-500" />
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">10%</p>
                  <p className="text-xs text-muted-foreground">Commission Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm bg-secondary/50"
                placeholder="Loading your referral link..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyLink}
                className={copied ? "text-green-600 border-green-300" : ""}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                className="gradient-primary text-white border-0 hover:opacity-90"
                onClick={shareLink}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-sm font-medium text-foreground mb-2">How it works:</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full gradient-primary text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Share your unique referral link with friends and family</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full gradient-primary text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>They sign up and start completing tasks</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full gradient-primary text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>You earn <strong className="text-primary">10% commission</strong> on every dollar they earn — forever!</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Your Referrals ({referrals?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !referrals || referrals.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No referrals yet</p>
                <p className="text-sm text-muted-foreground mt-1">Share your link to start earning commissions!</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <span>User</span>
                  <span className="text-center">Total Earned</span>
                  <span className="text-center">Your Commission</span>
                  <span className="text-right">Joined</span>
                </div>
                {referrals.map(ref => (
                  <div key={ref.id} className="grid grid-cols-4 gap-4 items-center p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(ref.name ?? "U")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ref.name ?? "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground truncate">{ref.email ?? ""}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground text-center">
                      ${parseFloat(ref.totalEarned ?? "0").toFixed(2)}
                    </p>
                    <p className="text-sm font-bold text-green-600 text-center">
                      +${parseFloat(ref.totalCommissionEarned).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground text-right">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
