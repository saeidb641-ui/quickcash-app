import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  contestEntries,
  contests,
  earnings,
  InsertUser,
  notifications,
  paymentMethods,
  referrals,
  taskCategories,
  taskCompletions,
  tasks,
  users,
  withdrawals,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Helpers ─────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value !== undefined) {
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });

  // Ensure referral code exists
  const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
  if (existing[0] && !existing[0].referralCode) {
    const code = nanoid(10).toUpperCase();
    await db.update(users).set({ referralCode: code }).where(eq(users.id, existing[0].id));
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByReferralCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.referralCode, code)).limit(1);
  return result[0];
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

export async function updateUserBalance(userId: number, amount: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    balance: sql`balance + ${amount}`,
    totalEarned: amount > 0 ? sql`totalEarned + ${amount}` : undefined,
  }).where(eq(users.id, userId));
}

export async function banUser(userId: number, banned: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isBanned: banned }).where(eq(users.id, userId));
}

// ─── Task Helpers ─────────────────────────────────────────────────────────────

export async function getTaskCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taskCategories).orderBy(taskCategories.name);
}

export async function getTasks(categoryId?: number, featuredOnly?: boolean) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(tasks.isActive, true)];
  if (categoryId) conditions.push(eq(tasks.categoryId, categoryId));
  if (featuredOnly) conditions.push(eq(tasks.isFeatured, true));
  return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.isFeatured), desc(tasks.reward));
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

export async function getAllTasksAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function createTask(data: typeof tasks.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(tasks).values(data);
}

export async function updateTask(id: number, data: Partial<typeof tasks.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set({ isActive: false }).where(eq(tasks.id, id));
}

export async function hasUserCompletedTask(userId: number, taskId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(taskCompletions)
    .where(and(eq(taskCompletions.userId, userId), eq(taskCompletions.taskId, taskId)))
    .limit(1);
  return result.length > 0;
}

export async function completeTask(userId: number, taskId: number, reward: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(taskCompletions).values({ userId, taskId, reward, status: "approved" });
  await db.update(tasks).set({ totalCompletions: sql`totalCompletions + 1` }).where(eq(tasks.id, taskId));
}

// ─── Earnings Helpers ─────────────────────────────────────────────────────────

export async function addEarning(userId: number, amount: string, type: "task" | "referral" | "contest" | "bonus", description: string, referenceId?: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(earnings).values({ userId, amount, type, description, referenceId });
  await db.update(users).set({
    balance: sql`balance + ${amount}`,
    totalEarned: sql`totalEarned + ${amount}`,
  }).where(eq(users.id, userId));
}

export async function getUserEarnings(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(earnings).where(eq(earnings.userId, userId)).orderBy(desc(earnings.createdAt)).limit(limit).offset(offset);
}

export async function getUserDailyEarnings(userId: number) {
  const db = await getDb();
  if (!db) return "0";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(earnings).where(and(eq(earnings.userId, userId), gte(earnings.createdAt, today)));
  return result[0]?.total ?? "0";
}

export async function getUserWeeklyEarnings(userId: number) {
  const db = await getDb();
  if (!db) return "0";
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const result = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(earnings).where(and(eq(earnings.userId, userId), gte(earnings.createdAt, weekAgo)));
  return result[0]?.total ?? "0";
}

// ─── Referral Helpers ─────────────────────────────────────────────────────────

export async function createReferral(referrerId: number, referredId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(referrals).values({ referrerId, referredId }).onDuplicateKeyUpdate({ set: { referrerId } });
  await db.update(users).set({ referredBy: referrerId }).where(eq(users.id, referredId));
}

export async function getUserReferrals(referrerId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: referrals.id,
    referredId: referrals.referredId,
    totalCommissionEarned: referrals.totalCommissionEarned,
    createdAt: referrals.createdAt,
    name: users.name,
    email: users.email,
    totalEarned: users.totalEarned,
  }).from(referrals)
    .leftJoin(users, eq(referrals.referredId, users.id))
    .where(eq(referrals.referrerId, referrerId))
    .orderBy(desc(referrals.createdAt));
  return rows;
}

export async function getReferralStats(referrerId: number) {
  const db = await getDb();
  if (!db) return { count: 0, totalCommission: "0" };
  const result = await db.select({
    count: sql<number>`COUNT(*)`,
    totalCommission: sql<string>`COALESCE(SUM(totalCommissionEarned), 0)`,
  }).from(referrals).where(eq(referrals.referrerId, referrerId));
  return result[0] ?? { count: 0, totalCommission: "0" };
}

export async function addReferralCommission(referrerId: number, referredId: number, commission: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(referrals).set({
    totalCommissionEarned: sql`totalCommissionEarned + ${commission}`,
  }).where(and(eq(referrals.referrerId, referrerId), eq(referrals.referredId, referredId)));
}

// ─── Withdrawal Helpers ───────────────────────────────────────────────────────

export async function createWithdrawal(userId: number, amount: string, method: "paypal" | "bitcoin" | "skrill" | "wise", paymentAddress: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(withdrawals).values({ userId, amount, method, paymentAddress, status: "pending" });
  await db.update(users).set({
    balance: sql`balance - ${amount}`,
    totalWithdrawn: sql`totalWithdrawn + ${amount}`,
  }).where(eq(users.id, userId));
}

export async function getUserWithdrawals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.requestedAt));
}

export async function getAllWithdrawals(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = status ? [eq(withdrawals.status, status as "pending" | "processing" | "completed" | "rejected")] : [];
  const rows = await db.select({
    id: withdrawals.id,
    userId: withdrawals.userId,
    amount: withdrawals.amount,
    method: withdrawals.method,
    paymentAddress: withdrawals.paymentAddress,
    status: withdrawals.status,
    adminNote: withdrawals.adminNote,
    requestedAt: withdrawals.requestedAt,
    processedAt: withdrawals.processedAt,
    userName: users.name,
    userEmail: users.email,
  }).from(withdrawals)
    .leftJoin(users, eq(withdrawals.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(withdrawals.requestedAt));
  return rows;
}

export async function updateWithdrawalStatus(id: number, status: "pending" | "processing" | "completed" | "rejected", adminNote?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(withdrawals).set({
    status,
    adminNote: adminNote ?? null,
    processedAt: status === "completed" || status === "rejected" ? new Date() : null,
  }).where(eq(withdrawals.id, id));
}

// ─── Payment Methods Helpers ──────────────────────────────────────────────────

export async function getUserPaymentMethods(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId));
}

export async function upsertPaymentMethod(userId: number, method: "paypal" | "bitcoin" | "skrill" | "wise", address: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(paymentMethods)
    .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.method, method))).limit(1);
  if (existing[0]) {
    await db.update(paymentMethods).set({ address }).where(eq(paymentMethods.id, existing[0].id));
  } else {
    await db.insert(paymentMethods).values({ userId, method, address, isDefault: false });
  }
}

// ─── Contest Helpers ──────────────────────────────────────────────────────────

export async function getActiveContests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contests).where(eq(contests.status, "active")).orderBy(contests.type);
}

export async function getAllContests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contests).orderBy(desc(contests.createdAt));
}

export async function getContestLeaderboard(contestId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: contestEntries.id,
    userId: contestEntries.userId,
    earningsInPeriod: contestEntries.earningsInPeriod,
    rank: contestEntries.rank,
    prizeWon: contestEntries.prizeWon,
    name: users.name,
    email: users.email,
  }).from(contestEntries)
    .leftJoin(users, eq(contestEntries.userId, users.id))
    .where(eq(contestEntries.contestId, contestId))
    .orderBy(desc(contestEntries.earningsInPeriod))
    .limit(limit);
}

export async function upsertContestEntry(contestId: number, userId: number, amount: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(contestEntries)
    .where(and(eq(contestEntries.contestId, contestId), eq(contestEntries.userId, userId))).limit(1);
  if (existing[0]) {
    await db.update(contestEntries).set({
      earningsInPeriod: sql`earningsInPeriod + ${amount}`,
    }).where(eq(contestEntries.id, existing[0].id));
  } else {
    await db.insert(contestEntries).values({ contestId, userId, earningsInPeriod: amount });
  }
}

export async function createContest(data: typeof contests.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(contests).values(data);
}

export async function updateContestStatus(id: number, status: "upcoming" | "active" | "completed") {
  const db = await getDb();
  if (!db) return;
  await db.update(contests).set({ status }).where(eq(contests.id, id));
}

// ─── Notification Helpers ─────────────────────────────────────────────────────

export async function createNotification(userId: number, title: string, message: string, type: "task" | "referral" | "withdrawal" | "contest" | "system") {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ userId, title, message, type, isRead: false });
}

export async function getUserNotifications(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;
  const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  const [taskCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(tasks).where(eq(tasks.isActive, true));
  const [pendingWithdrawals] = await db.select({ count: sql<number>`COUNT(*)`, total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(withdrawals).where(eq(withdrawals.status, "pending"));
  const [totalPaid] = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(withdrawals).where(eq(withdrawals.status, "completed"));
  return {
    userCount: userCount?.count ?? 0,
    taskCount: taskCount?.count ?? 0,
    pendingWithdrawalsCount: pendingWithdrawals?.count ?? 0,
    pendingWithdrawalsTotal: pendingWithdrawals?.total ?? "0",
    totalPaid: totalPaid?.total ?? "0",
  };
}
