import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Trophy,
  Medal,
  Crown,
  Clock,
  Users,
  Loader2,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const prizeDistribution = [
  { rank: 1, prize: "$500", color: "text-yellow-500" },
  { rank: 2, prize: "$200", color: "text-gray-400" },
  { rank: 3, prize: "$100", color: "text-orange-500" },
  { rank: "4-10", prize: "$50 each", color: "text-foreground" },
  { rank: "11-25", prize: "$20 each", color: "text-foreground" },
  { rank: "26-50", prize: "$10 each", color: "text-foreground" },
  { rank: "51-100", prize: "$5 each", color: "text-foreground" },
];

export default function Contests() {
  const [selectedContest, setSelectedContest] = useState<number | null>(null);
  const { data: activeContests } = trpc.contests.active.useQuery();

  const { data: leaderboard, isLoading: leaderboardLoading } = trpc.contests.leaderboard.useQuery(
    { contestId: selectedContest! },
    { enabled: !!selectedContest }
  );

  const { data: myRank } = trpc.contests.myRank.useQuery(
    { contestId: selectedContest! },
    { enabled: !!selectedContest }
  );

  const currentContest = activeContests?.find(c => c.id === selectedContest);

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Contests & Competitions</h1>
          <p className="text-muted-foreground mt-1">Compete with other earners for a share of the prize pool. Top 100 earners win!</p>
        </div>

        {/* Active Contests */}
        <div className="grid md:grid-cols-2 gap-4">
          {!activeContests ? (
            <div className="col-span-2 flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : activeContests.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No active contests right now. Check back soon!</p>
            </div>
          ) : (
            activeContests.map(contest => (
              <Card
                key={contest.id}
                className={`border-border/50 shadow-sm card-hover cursor-pointer transition-all ${
                  selectedContest === contest.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedContest(contest.id)}
              >
                <div className={`h-1.5 ${contest.type === "weekly" ? "gradient-gold" : "gradient-primary"}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        contest.type === "weekly" ? "bg-yellow-50" : "bg-primary/10"
                      }`}>
                        {contest.type === "weekly"
                          ? <Trophy className="w-6 h-6 text-yellow-600" />
                          : <Medal className="w-6 h-6 text-primary" />
                        }
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground">{contest.title}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{contest.type} contest</p>
                      </div>
                    </div>
                    <Badge className={contest.type === "weekly"
                      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                      : "bg-primary/10 text-primary border-primary/20"
                    }>
                      Active
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Prize Pool</p>
                      <p className="text-xl font-display font-bold text-foreground">
                        ${parseFloat(contest.prizePool).toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Ends</p>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(contest.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    className={`w-full mt-4 ${contest.type === "weekly"
                      ? "gradient-gold text-white border-0"
                      : "gradient-primary text-white border-0"
                    } hover:opacity-90`}
                    onClick={(e) => { e.stopPropagation(); setSelectedContest(contest.id); }}
                  >
                    View Leaderboard
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Prize Distribution */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              Weekly Prize Distribution ($2,000 Pool)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prizeDistribution.map(({ rank, prize, color }) => (
                <div key={String(rank)} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {rank === 1 && <Crown className="w-5 h-5 text-yellow-500" />}
                    {rank === 2 && <Medal className="w-5 h-5 text-gray-400" />}
                    {rank === 3 && <Medal className="w-5 h-5 text-orange-500" />}
                    {typeof rank === "string" && <Trophy className="w-5 h-5 text-muted-foreground" />}
                    <span className={`font-medium text-sm ${color}`}>
                      {typeof rank === "number" ? `Rank #${rank}` : `Rank #${rank}`}
                    </span>
                  </div>
                  <span className="font-display font-bold text-foreground">{prize}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        {selectedContest && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                {currentContest?.title} — Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myRank && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                  <p className="text-sm font-medium text-foreground">Your Position</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Rank</p>
                      <p className="text-2xl font-display font-bold text-primary">#{myRank.rank ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Points Earned</p>
                        <p className="text-2xl font-display font-bold text-foreground">
                        ${parseFloat(myRank.earningsInPeriod).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {leaderboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !leaderboard || leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No entries yet. Be the first!</p>
                  <Link href="/tasks">
                    <Button size="sm" className="mt-3 gradient-primary text-white border-0">
                      <Zap className="w-4 h-4 mr-1" /> Start Earning
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.slice(0, 20).map((entry, idx) => (
                    <div key={entry.id} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                      idx < 3 ? "bg-secondary/70" : "hover:bg-secondary/50"
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        idx === 0 ? "bg-yellow-100 text-yellow-700" :
                        idx === 1 ? "bg-gray-100 text-gray-600" :
                        idx === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(entry.name ?? "U")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{entry.name ?? "Anonymous"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">${parseFloat(entry.earningsInPeriod).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">earned</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
