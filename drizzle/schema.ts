import {
  bigint,
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  referralCode: varchar("referralCode", { length: 32 }).unique(),
  referredBy: int("referredBy"),
  balance: decimal("balance", { precision: 12, scale: 4 }).default("0.0000").notNull(),
  totalEarned: decimal("totalEarned", { precision: 12, scale: 4 }).default("0.0000").notNull(),
  totalWithdrawn: decimal("totalWithdrawn", { precision: 12, scale: 4 }).default("0.0000").notNull(),
  isBanned: boolean("isBanned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Task Categories ──────────────────────────────────────────────────────────
export const taskCategories = mysqlTable("task_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  icon: varchar("icon", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  reward: decimal("reward", { precision: 10, scale: 4 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  taskUrl: text("taskUrl"),
  imageUrl: text("imageUrl"),
  estimatedMinutes: int("estimatedMinutes").default(5),
  maxCompletions: int("maxCompletions"),
  totalCompletions: int("totalCompletions").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("easy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─── Task Completions ─────────────────────────────────────────────────────────
export const taskCompletions = mysqlTable("task_completions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskId: int("taskId").notNull(),
  reward: decimal("reward", { precision: 10, scale: 4 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("approved").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type TaskCompletion = typeof taskCompletions.$inferSelect;

// ─── Earnings ─────────────────────────────────────────────────────────────────
export const earnings = mysqlTable("earnings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 4 }).notNull(),
  type: mysqlEnum("type", [
    "task",
    "referral",
    "contest",
    "bonus",
  ]).notNull(),
  description: text("description"),
  referenceId: int("referenceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Earning = typeof earnings.$inferSelect;

// ─── Referrals ────────────────────────────────────────────────────────────────
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredId: int("referredId").notNull().unique(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 4 }).default("0.1000").notNull(),
  totalCommissionEarned: decimal("totalCommissionEarned", { precision: 12, scale: 4 }).default("0.0000").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;

// ─── Withdrawals ──────────────────────────────────────────────────────────────
export const withdrawals = mysqlTable("withdrawals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 4 }).notNull(),
  method: mysqlEnum("method", ["paypal", "bitcoin", "skrill", "wise"]).notNull(),
  paymentAddress: varchar("paymentAddress", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "rejected"]).default("pending").notNull(),
  adminNote: text("adminNote"),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

export type Withdrawal = typeof withdrawals.$inferSelect;

// ─── Contests ─────────────────────────────────────────────────────────────────
export const contests = mysqlTable("contests", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["daily", "weekly"]).notNull(),
  prizePool: decimal("prizePool", { precision: 10, scale: 4 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["upcoming", "active", "completed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Contest = typeof contests.$inferSelect;

// ─── Contest Entries ──────────────────────────────────────────────────────────
export const contestEntries = mysqlTable("contest_entries", {
  id: int("id").autoincrement().primaryKey(),
  contestId: int("contestId").notNull(),
  userId: int("userId").notNull(),
  earningsInPeriod: decimal("earningsInPeriod", { precision: 10, scale: 4 }).default("0.0000").notNull(),
  rank: int("rank"),
  prizeWon: decimal("prizeWon", { precision: 10, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContestEntry = typeof contestEntries.$inferSelect;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["task", "referral", "withdrawal", "contest", "system"]).notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── Payment Methods ──────────────────────────────────────────────────────────
export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  method: mysqlEnum("method", ["paypal", "bitcoin", "skrill", "wise"]).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
