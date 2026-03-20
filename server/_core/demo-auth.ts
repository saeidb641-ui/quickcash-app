import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

export function registerDemoAuthRoutes(app: Express) {
  // Demo login endpoint - creates a test user and sets session cookie
  app.post("/api/demo-login", async (req: Request, res: Response) => {
    try {
      // Create or get a demo user
      const demoOpenId = "demo-user-" + Date.now();
      const demoUser = await db.upsertUser({
        openId: demoOpenId,
        name: "Demo User",
        email: "demo@quickcash.app",
        loginMethod: "demo",
        lastSignedIn: new Date(),
      });

      // Create a session token
      const sessionToken = await sdk.createSessionToken(demoOpenId, {
        name: "Demo User",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set the session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.json({ success: true, user: demoUser });
    } catch (error) {
      console.error("[Demo Auth] Login failed", error);
      res.status(500).json({ error: "Demo login failed" });
    }
  });

  // Demo logout endpoint
  app.post("/api/demo-logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
