import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  CheckCircle,
  DollarSign,
  Trophy,
  Users,
  Zap,
  Loader2,
  CheckCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  task: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  referral: { icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  withdrawal: { icon: DollarSign, color: "text-orange-600", bg: "bg-orange-50" },
  contest: { icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50" },
  system: { icon: Zap, color: "text-purple-600", bg: "bg-purple-50" },
};

export default function Notifications() {
  const utils = trpc.useUtils();
  const { data: notifications, isLoading, refetch } = trpc.notifications.list.useQuery();

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      refetch();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      refetch();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-1.5" />
              Mark All Read
            </Button>
          )}
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-1">Complete tasks to receive notifications!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map(n => {
                  const config = typeConfig[n.type] ?? typeConfig.system;
                  const Icon = config.icon;
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-4 p-4 transition-colors cursor-pointer hover:bg-secondary/30 ${
                        !n.isRead ? "bg-primary/3" : ""
                      }`}
                      onClick={() => !n.isRead && markRead.mutate({ id: n.id })}
                    >
                      <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!n.isRead ? "text-foreground" : "text-foreground/80"}`}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!n.isRead && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className={`text-xs capitalize ${config.color} border-current/20`}>
                            {n.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
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
