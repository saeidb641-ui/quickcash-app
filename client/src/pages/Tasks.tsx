import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  CheckCircle,
  Clock,
  ClipboardList,
  MousePointer,
  PenTool,
  Play,
  Smartphone,
  Zap,
  ExternalLink,
  Loader2,
  Filter,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categoryIcons: Record<string, React.ElementType> = {
  surveys: ClipboardList,
  videos: Play,
  apps: Smartphone,
  "micro-tasks": Zap,
  "ad-clicks": MousePointer,
  "content-tasks": PenTool,
};

const categoryColors: Record<string, string> = {
  surveys: "text-blue-500 bg-blue-50",
  videos: "text-purple-500 bg-purple-50",
  apps: "text-orange-500 bg-orange-50",
  "micro-tasks": "text-yellow-600 bg-yellow-50",
  "ad-clicks": "text-green-500 bg-green-50",
  "content-tasks": "text-pink-500 bg-pink-50",
};

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  hard: "bg-red-100 text-red-700 border-red-200",
};

export default function Tasks() {
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [confirmTask, setConfirmTask] = useState<{ id: number; title: string; reward: string } | null>(null);

  const { data: categories } = trpc.tasks.categories.useQuery();
  const { data: tasks, refetch: refetchTasks } = trpc.tasks.list.useQuery({ categoryId: selectedCategory });
  const { data: completedIds, refetch: refetchCompleted } = trpc.tasks.completedIds.useQuery();
  const utils = trpc.useUtils();

  const completeTask = trpc.tasks.complete.useMutation({
    onSuccess: (data) => {
      toast.success(`🎉 Task completed! You earned $${parseFloat(data.reward).toFixed(2)}`);
      refetchTasks();
      refetchCompleted();
      utils.earnings.stats.invalidate();
      utils.notifications.unreadCount.invalidate();
      setConfirmTask(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setConfirmTask(null);
    },
  });

  const handleCompleteTask = (task: { id: number; title: string; reward: string }) => {
    setConfirmTask(task);
  };

  const confirmComplete = () => {
    if (confirmTask) {
      completeTask.mutate({ taskId: confirmTask.id });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Earn Tasks</h1>
          <p className="text-muted-foreground mt-1">Complete tasks to earn real cash rewards. New tasks added daily!</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(undefined)}
            className={selectedCategory === undefined ? "gradient-primary text-white border-0" : ""}
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            All Tasks
          </Button>
          {categories?.map(cat => {
            const Icon = categoryIcons[cat.slug] ?? ClipboardList;
            const colorClass = categoryColors[cat.slug] ?? "text-gray-500 bg-gray-50";
            const isSelected = selectedCategory === cat.id;
            return (
              <Button
                key={cat.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(isSelected ? undefined : cat.id)}
                className={isSelected ? "gradient-primary text-white border-0" : ""}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {cat.name}
              </Button>
            );
          })}
        </div>

        {/* Tasks Grid */}
        {!tasks ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tasks available in this category right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map(task => {
              const done = completedIds?.includes(task.id);
              const catSlug = categories?.find(c => c.id === task.categoryId)?.slug ?? "";
              const Icon = categoryIcons[catSlug] ?? ClipboardList;
              const iconColor = categoryColors[catSlug] ?? "text-gray-500 bg-gray-50";

              return (
                <Card key={task.id} className={`border-border/50 shadow-sm card-hover relative overflow-hidden ${done ? "opacity-70" : ""}`}>
                  {task.isFeatured && !done && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
                        <Star className="w-3 h-3 mr-1 fill-current" /> Featured
                      </Badge>
                    </div>
                  )}
                  {done && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" /> Done
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2 pr-16">{task.title}</h3>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className={`text-xs capitalize ${difficultyColors[task.difficulty]}`}>
                        {task.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ~{task.estimatedMinutes} min
                      </span>
                      {task.totalCompletions > 0 && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {task.totalCompletions.toLocaleString()} completed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-display font-bold text-primary">
                          ${parseFloat(task.reward).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">reward</p>
                      </div>
                      {done ? (
                        <Button size="sm" variant="outline" disabled className="text-green-600 border-green-200">
                          <CheckCircle className="w-4 h-4 mr-1" /> Completed
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="gradient-primary text-white border-0 hover:opacity-90"
                          onClick={() => handleCompleteTask({ id: task.id, title: task.title, reward: task.reward })}
                          disabled={completeTask.isPending}
                        >
                          {task.taskUrl && <ExternalLink className="w-3.5 h-3.5 mr-1.5" />}
                          Start Task
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmTask} onOpenChange={() => setConfirmTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Are you ready to complete this task and earn your reward?
            </DialogDescription>
          </DialogHeader>
          {confirmTask && (
            <div className="bg-secondary/50 rounded-xl p-4 my-2">
              <p className="font-medium text-foreground text-sm">{confirmTask.title}</p>
              <p className="text-primary font-display font-bold text-xl mt-2">
                +${parseFloat(confirmTask.reward).toFixed(2)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTask(null)}>Cancel</Button>
            <Button
              className="gradient-primary text-white border-0"
              onClick={confirmComplete}
              disabled={completeTask.isPending}
            >
              {completeTask.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                "Complete & Earn"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
