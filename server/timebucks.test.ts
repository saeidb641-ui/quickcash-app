import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getUserByOpenId: vi.fn(),
  getUserByReferralCode: vi.fn(),
  getTaskCategories: vi.fn().mockResolvedValue([]),
  getTasks: vi.fn().mockResolvedValue([]),
  getTaskById: vi.fn(),
  hasUserCompletedTask: vi.fn().mockResolvedValue(false),
  completeTask: vi.fn(),
  addEarning: vi.fn(),
  addReferralCommission: vi.fn(),
  createReferral: vi.fn(),
  createNotification: vi.fn(),
  getActiveContests: vi.fn().mockResolvedValue([]),
  upsertContestEntry: vi.fn(),
  getUserEarnings: vi.fn().mockResolvedValue([]),
  getUserDailyEarnings: vi.fn().mockResolvedValue("0"),
  getUserWeeklyEarnings: vi.fn().mockResolvedValue("0"),
  getUserReferrals: vi.fn().mockResolvedValue([]),
  getReferralStats: vi.fn().mockResolvedValue({ count: 0, totalCommission: "0" }),
  createWithdrawal: vi.fn(),
  getUserWithdrawals: vi.fn().mockResolvedValue([]),
  getAllWithdrawals: vi.fn().mockResolvedValue([]),
  updateWithdrawalStatus: vi.fn(),
  getUserPaymentMethods: vi.fn().mockResolvedValue([]),
  upsertPaymentMethod: vi.fn(),
  getContestLeaderboard: vi.fn().mockResolvedValue([]),
  getAllContests: vi.fn().mockResolvedValue([]),
  createContest: vi.fn(),
  updateContestStatus: vi.fn(),
  getUserNotifications: vi.fn().mockResolvedValue([]),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  getAdminStats: vi.fn().mockResolvedValue({ userCount: 10, taskCount: 5, pendingWithdrawalsCount: 2, pendingWithdrawalsTotal: "15.00", totalPaid: "100.00" }),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getAllTasksAdmin: vi.fn().mockResolvedValue([]),
  banUser: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn(),
  getUserById: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(role: "user" | "admin" = "user"): TrpcContext {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
}

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("auth router", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("logout clears session cookie", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      user: { id: 1, openId: "x", email: null, name: null, loginMethod: null, role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: (name: string, options: Record<string, unknown>) => clearedCookies.push({ name, options }) } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("tasks router", () => {
  it("categories returns empty array when no categories", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.tasks.categories();
    expect(Array.isArray(result)).toBe(true);
  });

  it("list returns empty array when no tasks", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.tasks.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("complete throws NOT_FOUND when user not in db", async () => {
    const { getUserByOpenId } = await import("./db");
    vi.mocked(getUserByOpenId).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.tasks.complete({ taskId: 1 })).rejects.toThrow();
  });
});

describe("earnings router", () => {
  it("stats returns zeroes when user not found", async () => {
    const { getUserByOpenId } = await import("./db");
    vi.mocked(getUserByOpenId).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.earnings.stats();
    expect(result.balance).toBe("0");
    expect(result.daily).toBe("0");
  });
});

describe("referrals router", () => {
  it("myCode returns null when user not found", async () => {
    const { getUserByOpenId } = await import("./db");
    vi.mocked(getUserByOpenId).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.referrals.myCode();
    expect(result.code).toBeNull();
  });

  it("list returns empty array when user not found", async () => {
    const { getUserByOpenId } = await import("./db");
    vi.mocked(getUserByOpenId).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.referrals.list();
    expect(result).toEqual([]);
  });
});

describe("withdrawals router", () => {
  it("request throws when amount below minimum", async () => {
    const { getUserByOpenId } = await import("./db");
    vi.mocked(getUserByOpenId).mockResolvedValueOnce({
      id: 1, openId: "x", name: "Test", email: "t@t.com", loginMethod: "manus",
      role: "user", isBanned: false, balance: "10.00", totalEarned: "10.00",
      totalWithdrawn: "0", referralCode: "ABC123", referredBy: null,
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    });
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.withdrawals.request({
      amount: 1,
      method: "paypal",
      paymentAddress: "test@test.com",
    })).rejects.toThrow();
  });

  it("history returns empty array when user not found", async () => {
    const { getUserByOpenId } = await import("./db");
    vi.mocked(getUserByOpenId).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.withdrawals.history();
    expect(result).toEqual([]);
  });
});

describe("contests router", () => {
  it("active returns empty array when no contests", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.contests.active();
    expect(Array.isArray(result)).toBe(true);
  });

  it("leaderboard returns empty array", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.contests.leaderboard({ contestId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("notifications router", () => {
  it("list returns empty array when user not found", async () => {
    const { getUserByOpenId } = await import("./db");
    vi.mocked(getUserByOpenId).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.notifications.list();
    expect(result).toEqual([]);
  });

  it("unreadCount returns 0 when user not found", async () => {
    const { getUserByOpenId } = await import("./db");
    vi.mocked(getUserByOpenId).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.notifications.unreadCount();
    expect(result).toBe(0);
  });
});

describe("admin router", () => {
  it("stats returns data for admin", async () => {
    const caller = appRouter.createCaller(createCtx("admin"));
    const result = await caller.admin.stats();
    expect(result?.userCount).toBe(10);
    expect(result?.taskCount).toBe(5);
  });

  it("stats throws FORBIDDEN for non-admin", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.admin.stats()).rejects.toThrow("Admin access required");
  });

  it("users returns empty array for admin", async () => {
    const caller = appRouter.createCaller(createCtx("admin"));
    const result = await caller.admin.users({ limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("withdrawals returns empty array for admin", async () => {
    const caller = appRouter.createCaller(createCtx("admin"));
    const result = await caller.admin.withdrawals({});
    expect(Array.isArray(result)).toBe(true);
  });
});
