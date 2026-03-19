import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowRight,
  Award,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Trophy,
  Users,
  Zap,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = trpc.earnings.stats.useQuery();
  const { data: featuredTasks } = trpc.tasks.list.useQuery({ featuredOnly: true });
  const { data: completedIds } = trpc.tasks.completedIds.useQuery();
  const { data: referralStats } = trpc.referrals.stats.useQuery();
  const { data: activeContests } = trpc.contests.active.useQuery();
  const { data: notifications } = trpc.notifications.list.useQuery();

  const balance = parseFloat(stats?.balance ?? "0");
  const daily = parseFloat(stats?.daily ?? "0");
  const weekly = parseFloat(stats?.weekly ?? "0");
  const total = parseFloat(stats?.total ?? "0");

  const withdrawalProgress = Math.min((balance / 3) * 100, 100);

  const recentNotifications = notifications?.slice(0, 3) ?? [];

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Welcome back, {user?.name?.split(" ")[0] ?? "User"}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">Here's your earning overview for today.</p>
          </div>
          <Link href="/tasks">
            <Button className="gradient-primary text-white border-0 shadow-glow hover:opacity-90">
              <Zap className="w-4 h-4 mr-2" />
              Earn Now
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-1 gradient-primary" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs">Balance</Badge>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">${balance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Available to withdraw</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-1 bg-blue-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <Badge variant="secondary" className="text-xs">Today</Badge>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">${daily.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Earned today</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-1 bg-purple-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-500" />
                </div>
                <Badge variant="secondary" className="text-xs">This Week</Badge>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">${weekly.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Weekly earnings</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-1 bg-orange-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                <Badge variant="secondary" className="text-xs">Referrals</Badge>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{referralStats?.count ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">People referred</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Withdrawal Progress */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Withdrawal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Balance</span>
                  <span className="font-semibold text-foreground">${balance.toFixed(2)}</span>
                </div>
                <Progress value={withdrawalProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$0.00</span>
                  <span className="text-primary font-medium">Min: $3.00</span>
                </div>
                {balance >= 3 ? (
                  <Link href="/withdraw">
                    <Button className="w-full gradient-primary text-white border-0 mt-2">
                      Withdraw Now
                    </Button>
                  </Link>
                ) : (
                  <p className="text-xs text-center text-muted-foreground">
                    Earn ${(3 - balance).toFixed(2)} more to unlock withdrawal
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Contests */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Active Contests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeContests?.map(contest => (
                <div key={contest.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">{contest.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{contest.type} contest</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">${parseFloat(contest.prizePool).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">prize pool</p>
                  </div>
                </div>
              ))}
              <Link href="/contests">
                <Button variant="outline" size="sm" className="w-full mt-1">
                  View Leaderboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity yet. Complete your first task!</p>
              ) : (
                recentNotifications.map(n => (
                  <div key={n.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      n.type === "task" ? "bg-green-50" :
                      n.type === "referral" ? "bg-blue-50" :
                      n.type === "withdrawal" ? "bg-orange-50" : "bg-purple-50"
                    }`}>
                      {n.type === "task" && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {n.type === "referral" && <Users className="w-4 h-4 text-blue-500" />}
                      {n.type === "withdrawal" && <DollarSign className="w-4 h-4 text-orange-500" />}
                      {n.type === "contest" && <Trophy className="w-4 h-4 text-purple-500" />}
                      {n.type === "system" && <Zap className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
              <Link href="/notifications">
                <Button variant="outline" size="sm" className="w-full mt-1">
                  View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Featured Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Featured Tasks
            </h2>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {featuredTasks?.slice(0, 6).map(task => {
              const done = completedIds?.includes(task.id);
              return (
                <Card key={task.id} className={`border-border/50 shadow-sm card-hover ${done ? "opacity-60" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs capitalize">{task.difficulty}</Badge>
                          {done && <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Completed</Badge>}
                        </div>
                        <h3 className="text-sm font-medium text-foreground line-clamp-2">{task.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ~{task.estimatedMinutes} min
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-display font-bold text-primary">${parseFloat(task.reward).toFixed(2)}</p>
                      </div>
                    </div>
                    {!done && (
                      <Link href="/tasks">
                        <Button size="sm" className="w-full mt-3 gradient-primary text-white border-0 hover:opacity-90">
                          Start Task
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
