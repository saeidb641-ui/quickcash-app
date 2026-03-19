import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users,
  ClipboardList,
  Wallet,
  Trophy,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Link } from "wouter";

const taskSchema = z.object({
  categoryId: z.number(),
  title: z.string().min(3),
  description: z.string().optional(),
  reward: z.string().min(1),
  estimatedMinutes: z.number().optional(),
  maxCompletions: z.number().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  taskUrl: z.string().optional(),
  isFeatured: z.boolean().optional().default(false),
});

type TaskForm = z.infer<typeof taskSchema>;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminPanel() {
  const { user } = useAuth();
  const [taskDialog, setTaskDialog] = useState(false);
  const [editTask, setEditTask] = useState<number | null>(null);
  const [withdrawalNote, setWithdrawalNote] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<number | null>(null);

  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: users, refetch: refetchUsers } = trpc.admin.users.useQuery({ limit: 50, offset: 0 });
  const { data: tasks, refetch: refetchTasks } = trpc.admin.tasks.useQuery();
  const { data: withdrawals, refetch: refetchWithdrawals } = trpc.admin.withdrawals.useQuery({});
  const { data: contests, refetch: refetchContests } = trpc.admin.contests.useQuery();
  const { data: categories } = trpc.tasks.categories.useQuery();

  const banUser = trpc.admin.banUser.useMutation({
    onSuccess: () => { toast.success("User status updated"); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });

  const createTask = trpc.admin.createTask.useMutation({
    onSuccess: () => { toast.success("Task created!"); refetchTasks(); setTaskDialog(false); reset(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteTask = trpc.admin.deleteTask.useMutation({
    onSuccess: () => { toast.success("Task deleted"); refetchTasks(); },
    onError: (e) => toast.error(e.message),
  });

  const updateWithdrawal = trpc.admin.updateWithdrawal.useMutation({
    onSuccess: () => { toast.success("Withdrawal updated"); refetchWithdrawals(); setSelectedWithdrawal(null); },
    onError: (e) => toast.error(e.message),
  });

  const updateContestStatus = trpc.admin.updateContestStatus.useMutation({
    onSuccess: () => { toast.success("Contest updated"); refetchContests(); },
    onError: (e) => toast.error(e.message),
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      categoryId: 0,
      title: "",
      description: "",
      reward: "",
      estimatedMinutes: 5,
      maxCompletions: undefined as number | undefined,
      difficulty: "easy" as "easy" | "medium" | "hard",
      taskUrl: "",
      isFeatured: false,
    },
  });

  if (user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Shield className="w-16 h-16 text-muted-foreground" />
          <h2 className="font-display text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
          <Link href="/dashboard">
            <Button className="gradient-primary text-white border-0">Go to Dashboard</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Manage users, tasks, withdrawals, and contests</p>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: stats.userCount, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Total Tasks", value: stats.taskCount, icon: ClipboardList, color: "text-green-500", bg: "bg-green-50" },
              { label: "Pending Withdrawals", value: stats.pendingWithdrawalsCount, icon: Wallet, color: "text-orange-500", bg: "bg-orange-50" },
              { label: "Total Paid Out", value: `$${parseFloat(stats.totalPaid ?? "0").toFixed(2)}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
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
        )}

        <Tabs defaultValue="users">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="contests">Contests</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  All Users ({users?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users?.map(u => (
                    <div key={u.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className="w-9 h-9 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {(u.name ?? "U")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{u.name ?? "Anonymous"}</p>
                          {u.role === "admin" && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Admin</Badge>}
                          {u.isBanned && <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Banned</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.email ?? ""}</p>
                      </div>
                      <div className="text-right flex-shrink-0 hidden md:block">
                        <p className="text-sm font-medium text-foreground">${parseFloat(u.balance ?? "0").toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">balance</p>
                      </div>
                      <div className="text-right flex-shrink-0 hidden lg:block">
                        <p className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className={u.isBanned ? "text-green-600 border-green-200 hover:bg-green-50" : "text-red-600 border-red-200 hover:bg-red-50"}
                        onClick={() => banUser.mutate({ userId: u.id, banned: !u.isBanned })}
                        disabled={banUser.isPending}
                      >
                        {u.isBanned ? <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Unban</> : <><Ban className="w-3.5 h-3.5 mr-1" /> Ban</>}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    All Tasks ({tasks?.length ?? 0})
                  </CardTitle>
                  <Button
                    size="sm"
                    className="gradient-primary text-white border-0"
                    onClick={() => { reset(); setEditTask(null); setTaskDialog(true); }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks?.map(task => (
                    <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                          {!task.isActive && <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs">Inactive</Badge>}
                          {task.isFeatured && <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Featured</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-medium text-primary">${parseFloat(task.reward).toFixed(2)}</span>
                          <span className="capitalize">{task.difficulty}</span>
                          <span>{task.totalCompletions} completions</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/20 hover:bg-destructive/5"
                          onClick={() => {
                            if (confirm("Delete this task?")) deleteTask.mutate({ id: task.id });
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="mt-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  Withdrawal Requests ({withdrawals?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {withdrawals?.map(w => (
                    <div key={w.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-foreground">{w.userName ?? "User"}</p>
                          <Badge className={`text-xs ${statusColors[w.status]}`}>{w.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {w.method.toUpperCase()} · {w.paymentAddress}
                        </p>
                        {w.adminNote && <p className="text-xs text-orange-600 mt-0.5">{w.adminNote}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-foreground">${parseFloat(w.amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(w.requestedAt).toLocaleDateString()}</p>
                      </div>
                      {w.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white border-0"
                            onClick={() => updateWithdrawal.mutate({ id: w.id, status: "completed" })}
                            disabled={updateWithdrawal.isPending}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              setSelectedWithdrawal(w.id);
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contests Tab */}
          <TabsContent value="contests" className="mt-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  Contests ({contests?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contests?.map(c => (
                    <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-secondary/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">{c.title}</p>
                          <Badge className={`text-xs capitalize ${
                            c.status === "active" ? "bg-green-100 text-green-700 border-green-200" :
                            c.status === "upcoming" ? "bg-blue-100 text-blue-700 border-blue-200" :
                            "bg-gray-100 text-gray-600 border-gray-200"
                          }`}>{c.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="capitalize">{c.type}</span>
                          <span className="font-medium text-primary">${parseFloat(c.prizePool).toFixed(0)} prize pool</span>
                          <span>{new Date(c.startDate).toLocaleDateString()} — {new Date(c.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {c.status === "upcoming" && (
                          <Button
                            size="sm"
                            className="gradient-primary text-white border-0"
                            onClick={() => updateContestStatus.mutate({ id: c.id, status: "active" })}
                          >
                            Activate
                          </Button>
                        )}
                        {c.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateContestStatus.mutate({ id: c.id, status: "completed" })}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={taskDialog} onOpenChange={setTaskDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createTask.mutate(d as unknown as TaskForm))} className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select onValueChange={(v) => setValue("categoryId", parseInt(v))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input className="mt-1.5" placeholder="Task title" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <Label>Description</Label>
              <Textarea className="mt-1.5" placeholder="Task description (optional)" {...register("description")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Reward ($)</Label>
                <Input className="mt-1.5" placeholder="0.50" {...register("reward")} />
              </div>
              <div>
                <Label>Est. Minutes</Label>
                <Input className="mt-1.5" type="number" placeholder="5" {...register("estimatedMinutes", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Difficulty</Label>
                <Select defaultValue="easy" onValueChange={(v) => setValue("difficulty", v as "easy" | "medium" | "hard")}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Max Completions</Label>
                <Input className="mt-1.5" type="number" placeholder="Unlimited" {...register("maxCompletions", { valueAsNumber: true })} />
              </div>
            </div>
            <div>
              <Label>Task URL (optional)</Label>
              <Input className="mt-1.5" placeholder="https://..." {...register("taskUrl")} />
            </div>
            <div className="flex items-center gap-3">
              <Switch
              checked={!!watch("isFeatured")}
              onCheckedChange={(v) => setValue("isFeatured", v)}
              />
              <Label>Featured task (shown on dashboard)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTaskDialog(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary text-white border-0" disabled={createTask.isPending}>
                {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Withdrawal Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Rejection Note (optional)</Label>
            <Textarea
              className="mt-1.5"
              placeholder="Reason for rejection..."
              value={withdrawalNote}
              onChange={e => setWithdrawalNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedWithdrawal(null)}>Cancel</Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white border-0"
              onClick={() => {
                if (selectedWithdrawal) {
                  updateWithdrawal.mutate({ id: selectedWithdrawal, status: "rejected", adminNote: withdrawalNote || undefined });
                  setWithdrawalNote("");
                }
              }}
              disabled={updateWithdrawal.isPending}
            >
              Reject & Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
