import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addEarning,
  addReferralCommission,
  banUser,
  completeTask,
  createContest,
  createNotification,
  createReferral,
  createWithdrawal,
  deleteTask,
  getActiveContests,
  getAdminStats,
  getAllContests,
  getAllTasksAdmin,
  getAllUsers,
  getAllWithdrawals,
  getContestLeaderboard,
  getTaskById,
  getTaskCategories,
  getTasks,
  getUnreadNotificationCount,
  getUserById,
  getUserByOpenId,
  getUserByReferralCode,
  getUserDailyEarnings,
  getUserEarnings,
  getUserNotifications,
  getUserPaymentMethods,
  getUserReferrals,
  getUserWeeklyEarnings,
  getUserWithdrawals,
  hasUserCompletedTask,
  markAllNotificationsRead,
  markNotificationRead,
  getReferralStats,
  updateContestStatus,
  updateTask,
  updateWithdrawalStatus,
  upsertContestEntry,
  upsertPaymentMethod,
  createTask,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(async (opts) => {
      if (!opts.ctx.user) return null;
      const user = await getUserByOpenId(opts.ctx.user.openId);
      return user ?? null;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    applyReferral: protectedProcedure
      .input(z.object({ referralCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const currentUser = await getUserByOpenId(ctx.user.openId);
        if (!currentUser) throw new TRPCError({ code: "NOT_FOUND" });
        if (currentUser.referredBy) throw new TRPCError({ code: "BAD_REQUEST", message: "Already referred" });
        const referrer = await getUserByReferralCode(input.referralCode);
        if (!referrer) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid referral code" });
        if (referrer.id === currentUser.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot refer yourself" });
        await createReferral(referrer.id, currentUser.id);
        await createNotification(referrer.id, "New Referral!", `${currentUser.name ?? "Someone"} joined using your referral link!`, "referral");
        return { success: true };
      }),
  }),

  // ─── Tasks ─────────────────────────────────────────────────────────────────
  tasks: router({
    categories: publicProcedure.query(() => getTaskCategories()),
    list: publicProcedure
      .input(z.object({ categoryId: z.number().optional(), featuredOnly: z.boolean().optional() }))
      .query(({ input }) => getTasks(input.categoryId, input.featuredOnly)),
    complete: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByOpenId(ctx.user.openId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        if (user.isBanned) throw new TRPCError({ code: "FORBIDDEN", message: "Account is banned" });

        const task = await getTaskById(input.taskId);
        if (!task || !task.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });

        const alreadyDone = await hasUserCompletedTask(user.id, input.taskId);
        if (alreadyDone) throw new TRPCError({ code: "BAD_REQUEST", message: "Task already completed" });

        if (task.maxCompletions && task.totalCompletions >= task.maxCompletions) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Task has reached maximum completions" });
        }

        await completeTask(user.id, input.taskId, task.reward);
        await addEarning(user.id, task.reward, "task", `Completed: ${task.title}`, task.id);

        // Referral commission
        if (user.referredBy) {
          const commissionAmount = (parseFloat(task.reward) * 0.1).toFixed(4);
          await addEarning(user.referredBy, commissionAmount, "referral", `Referral commission from ${user.name ?? "user"}`, user.id);
          await addReferralCommission(user.referredBy, user.id, commissionAmount);
          await createNotification(user.referredBy, "Referral Commission!", `You earned $${commissionAmount} commission from your referral.`, "referral");
        }

        // Update contest entries
        const activeContests = await getActiveContests();
        for (const contest of activeContests) {
          await upsertContestEntry(contest.id, user.id, task.reward);
        }

        await createNotification(user.id, "Task Completed!", `You earned $${task.reward} for completing "${task.title}"`, "task");

        return { success: true, reward: task.reward };
      }),
    completedIds: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) return [];
      const { getDb } = await import("./db");
      const { taskCompletions: tc } = await import("../drizzle/schema");
      const { eq: eqOp } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select({ taskId: tc.taskId }).from(tc).where(eqOp(tc.userId, user.id));
      return rows.map(r => r.taskId);
    }),
  }),

  // ─── Earnings ──────────────────────────────────────────────────────────────
  earnings: router({
    history: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const user = await getUserByOpenId(ctx.user.openId);
        if (!user) return [];
        return getUserEarnings(user.id, input.limit, input.offset);
      }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) return { daily: "0", weekly: "0", total: "0", balance: "0" };
      const [daily, weekly] = await Promise.all([
        getUserDailyEarnings(user.id),
        getUserWeeklyEarnings(user.id),
      ]);
      return {
        daily,
        weekly,
        total: user.totalEarned,
        balance: user.balance,
      };
    }),
  }),

  // ─── Referrals ─────────────────────────────────────────────────────────────
  referrals: router({
    myCode: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      return { code: user?.referralCode ?? null };
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) return [];
      return getUserReferrals(user.id);
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) return { count: 0, totalCommission: "0" };
      return getReferralStats(user.id);
    }),
  }),

  // ─── Withdrawals ───────────────────────────────────────────────────────────
  withdrawals: router({
    request: protectedProcedure
      .input(z.object({
        amount: z.number().min(3, "Minimum withdrawal is $3"),
        method: z.enum(["paypal", "bitcoin", "skrill", "wise"]),
        paymentAddress: z.string().min(3),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByOpenId(ctx.user.openId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        if (user.isBanned) throw new TRPCError({ code: "FORBIDDEN", message: "Account is banned" });
        const balance = parseFloat(user.balance ?? "0");
        if (balance < input.amount) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
        if (input.amount < 3) throw new TRPCError({ code: "BAD_REQUEST", message: "Minimum withdrawal is $3" });

        await createWithdrawal(user.id, input.amount.toFixed(4), input.method, input.paymentAddress);
        await createNotification(user.id, "Withdrawal Requested", `Your withdrawal of $${input.amount.toFixed(2)} via ${input.method} is being processed.`, "withdrawal");
        return { success: true };
      }),
    history: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) return [];
      return getUserWithdrawals(user.id);
    }),
    paymentMethods: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) return [];
      return getUserPaymentMethods(user.id);
    }),
    savePaymentMethod: protectedProcedure
      .input(z.object({
        method: z.enum(["paypal", "bitcoin", "skrill", "wise"]),
        address: z.string().min(3),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByOpenId(ctx.user.openId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        await upsertPaymentMethod(user.id, input.method, input.address);
        return { success: true };
      }),
  }),

  // ─── Contests ──────────────────────────────────────────────────────────────
  contests: router({
    active: publicProcedure.query(() => getActiveContests()),
    leaderboard: publicProcedure
      .input(z.object({ contestId: z.number() }))
      .query(({ input }) => getContestLeaderboard(input.contestId)),
    myRank: protectedProcedure
      .input(z.object({ contestId: z.number() }))
      .query(async ({ ctx, input }) => {
        const user = await getUserByOpenId(ctx.user.openId);
        if (!user) return null;
        const { getDb } = await import("./db");
        const { contestEntries: ce } = await import("../drizzle/schema");
        const { and: andOp, eq: eqOp } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return null;
        const result = await db.select().from(ce)
          .where(andOp(eqOp(ce.contestId, input.contestId), eqOp(ce.userId, user.id))).limit(1);
        return result[0] ?? null;
      }),
  }),

  // ─── Notifications ─────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) return [];
      return getUserNotifications(user.id);
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) return 0;
      return getUnreadNotificationCount(user.id);
    }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByOpenId(ctx.user.openId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        await markNotificationRead(input.id, user.id);
        return { success: true };
      }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      await markAllNotificationsRead(user.id);
      return { success: true };
    }),
  }),

  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(() => getAdminStats()),
    users: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(({ input }) => getAllUsers(input.limit, input.offset)),
    banUser: adminProcedure
      .input(z.object({ userId: z.number(), banned: z.boolean() }))
      .mutation(async ({ input }) => {
        await banUser(input.userId, input.banned);
        return { success: true };
      }),
    tasks: adminProcedure.query(() => getAllTasksAdmin()),
    createTask: adminProcedure
      .input(z.object({
        categoryId: z.number(),
        title: z.string().min(3),
        description: z.string().optional(),
        reward: z.string(),
        estimatedMinutes: z.number().optional(),
        maxCompletions: z.number().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
        taskUrl: z.string().optional(),
        isFeatured: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        await createTask({ ...input, isActive: true, totalCompletions: 0 });
        return { success: true };
      }),
    updateTask: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        reward: z.string().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        estimatedMinutes: z.number().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateTask(id, data);
        return { success: true };
      }),
    deleteTask: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTask(input.id);
        return { success: true };
      }),
    withdrawals: adminProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(({ input }) => getAllWithdrawals(input.status)),
    updateWithdrawal: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "processing", "completed", "rejected"]),
        adminNote: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const withdrawal = await (async () => {
          const { getDb } = await import("./db");
          const { withdrawals: wd } = await import("../drizzle/schema");
          const { eq: eqOp } = await import("drizzle-orm");
          const db = await getDb();
          if (!db) return null;
          const r = await db.select().from(wd).where(eqOp(wd.id, input.id)).limit(1);
          return r[0] ?? null;
        })();

        await updateWithdrawalStatus(input.id, input.status, input.adminNote);

        if (withdrawal) {
          const msg = input.status === "completed"
            ? `Your withdrawal of $${withdrawal.amount} via ${withdrawal.method} has been completed!`
            : input.status === "rejected"
            ? `Your withdrawal of $${withdrawal.amount} was rejected. ${input.adminNote ?? ""}`
            : `Your withdrawal status updated to: ${input.status}`;

          await createNotification(withdrawal.userId, "Withdrawal Update", msg, "withdrawal");

          // Refund if rejected
          if (input.status === "rejected") {
            await addEarning(withdrawal.userId, withdrawal.amount, "bonus", "Withdrawal refunded", withdrawal.id);
          }
        }
        return { success: true };
      }),
    contests: adminProcedure.query(() => getAllContests()),
    createContest: adminProcedure
      .input(z.object({
        title: z.string(),
        type: z.enum(["daily", "weekly"]),
        prizePool: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .mutation(async ({ input }) => {
        await createContest({
          title: input.title,
          type: input.type,
          prizePool: input.prizePool,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          status: "upcoming",
        });
        return { success: true };
      }),
    updateContestStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["upcoming", "active", "completed"]) }))
      .mutation(async ({ input }) => {
        await updateContestStatus(input.id, input.status);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
