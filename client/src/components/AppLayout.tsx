import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Award,
  Bell,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Home,
  LogOut,
  Menu,
  Trophy,
  Users,
  Wallet,
  X,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/tasks", icon: ClipboardList, label: "Earn Tasks" },
  { href: "/earnings", icon: DollarSign, label: "Earnings" },
  { href: "/referrals", icon: Users, label: "Referrals" },
  { href: "/withdraw", icon: Wallet, label: "Withdraw" },
  { href: "/contests", icon: Trophy, label: "Contests" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: stats } = trpc.earnings.stats.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-sidebar-foreground">EarnBucks</span>
            <p className="text-xs text-sidebar-foreground/50 -mt-0.5">Earn Real Cash</p>
          </div>
        </Link>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <div className="rounded-xl p-4 gradient-primary shadow-glow">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Available Balance</p>
          <p className="text-white text-2xl font-display font-bold mt-1">
            ${parseFloat(stats?.balance ?? "0").toFixed(2)}
          </p>
          <Link href="/withdraw">
            <Button size="sm" variant="secondary" className="mt-3 w-full text-xs bg-white/20 text-white hover:bg-white/30 border-0">
              Withdraw Funds
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = location === href || (href !== "/dashboard" && location.startsWith(href));
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}>
                <Icon className={`w-4.5 h-4.5 ${active ? "text-primary" : "group-hover:text-primary/70"}`} style={{ width: '18px', height: '18px' }} />
                <span className="text-sm">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
              </div>
            </Link>
          );
        })}

        <Separator className="my-2 bg-sidebar-border" />

        {/* Notifications */}
        <Link href="/notifications" onClick={() => setMobileOpen(false)}>
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer ${
            location === "/notifications"
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          }`}>
            <Bell style={{ width: '18px', height: '18px' }} className={location === "/notifications" ? "text-primary" : "group-hover:text-primary/70"} />
            <span className="text-sm">Notifications</span>
            {(unreadCount ?? 0) > 0 && (
              <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0 h-5 min-w-5">
                {unreadCount}
              </Badge>
            )}
          </div>
        </Link>

        {/* Admin link */}
        {user?.role === "admin" && (
          <Link href="/admin" onClick={() => setMobileOpen(false)}>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer ${
              location.startsWith("/admin")
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}>
              <Shield style={{ width: '18px', height: '18px' }} className={location.startsWith("/admin") ? "text-primary" : "group-hover:text-primary/70"} />
              <span className="text-sm">Admin Panel</span>
            </div>
          </Link>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 border-2 border-primary/30">
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "User"}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email ?? ""}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-400/10"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar flex-shrink-0 overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar overflow-y-auto">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground mr-4">
              <span>Today: <strong className="text-foreground">${parseFloat(stats?.daily ?? "0").toFixed(2)}</strong></span>
              <span>This week: <strong className="text-foreground">${parseFloat(stats?.weekly ?? "0").toFixed(2)}</strong></span>
            </div>

            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
