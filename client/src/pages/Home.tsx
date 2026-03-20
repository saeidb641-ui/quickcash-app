import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Award,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Gift,
  Globe,
  Play,
  Shield,
  Smartphone,
  Star,
  Trophy,
  Users,
  Zap,
  ClipboardList,
  MousePointer,
  PenTool,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useLayoutEffect } from "react";

const features = [
  {
    icon: ClipboardList,
    title: "Surveys",
    desc: "Share your opinions and earn up to $1.50 per survey",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Play,
    title: "Watch Videos",
    desc: "Watch short videos and ads to earn instant rewards",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    icon: Smartphone,
    title: "Install Apps",
    desc: "Try new apps and games for up to $2.00 per install",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    icon: Zap,
    title: "Micro Tasks",
    desc: "Complete quick tasks like follows, signups, and reviews",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    icon: MousePointer,
    title: "Ad Clicks",
    desc: "View sponsored websites and advertisements to earn",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    icon: PenTool,
    title: "Content Tasks",
    desc: "Post on social media and create content for brands",
    color: "text-pink-500",
    bg: "bg-pink-50",
  },
];

const paymentMethods = [
  { name: "PayPal", icon: "💳" },
  { name: "Bitcoin", icon: "₿" },
  { name: "Skrill", icon: "💰" },
  { name: "Wise", icon: "🌍" },
];

const reviews = [
  { name: "Sarah M.", rating: 5, text: "I've been using EarnBucks for 6 months and have withdrawn over $200. The tasks are easy and payouts are fast!", country: "🇺🇸 USA" },
  { name: "Ahmed K.", rating: 5, text: "Best GPT site I've used. The referral system is amazing — I earn passive income every day from my referrals.", country: "🇸🇦 Saudi Arabia" },
  { name: "Maria L.", rating: 5, text: "Withdrew $50 to PayPal in under 24 hours. Very reliable and trustworthy platform!", country: "🇧🇷 Brazil" },
  { name: "John D.", rating: 4, text: "Great variety of tasks. The weekly contest is exciting — I won $15 last week!", country: "🇬🇧 UK" },
];

const stats = [
  { value: "$2,000", label: "Weekly Prize Pool", icon: Trophy },
  { value: "10%", label: "Referral Commission", icon: Users },
  { value: "$3", label: "Minimum Payout", icon: DollarSign },
  { value: "Daily", label: "Payment Frequency", icon: Clock },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Check for referral code in URL
  const applyReferral = trpc.auth.applyReferral.useMutation();

  // Redirect to dashboard if authenticated (must be in useLayoutEffect to avoid render phase updates)
  useLayoutEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Apply referral code if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && isAuthenticated) {
      applyReferral.mutate({ referralCode: ref });
    }
  }, [isAuthenticated, applyReferral]);

  // Don't render landing page if authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">EarnBucks</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/demo-login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </Link>
            <a href={getLoginUrl()} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Login
            </a>
            <a href={getLoginUrl()}>
              <Button className="gradient-primary text-white border-0 shadow-glow hover:opacity-90">
                Sign Up Free
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="gradient-hero pt-32 pb-24 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 text-sm px-4 py-1.5">
              🎉 $2,000 Weekly Prize Pool — Join Now!
            </Badge>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Get Paid to Complete
              <span className="block" style={{ color: 'oklch(0.65 0.20 150)' }}>Simple Tasks Online</span>
            </h1>
            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join millions of users earning real cash by completing surveys, watching videos, installing apps, and more. Daily payouts, no experience required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/demo-login">
                <Button size="lg" className="gradient-primary text-white border-0 shadow-glow hover:opacity-90 text-lg px-8 py-6 h-auto">
                  Try Demo
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href={getLoginUrl()}>
                <Button size="lg" variant="outline" className="border-white/20 text-white bg-white/10 hover:bg-white/20 text-lg px-8 py-6 h-auto">
                  Sign Up Free
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-white/60 text-sm">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Free to join</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> No approval needed</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Earn in 5 minutes</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Daily payouts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-border py-8">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="font-display text-2xl font-bold text-foreground">{value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earning Methods */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Ways to Earn</Badge>
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Multiple Ways to Make Money
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose from dozens of task types and start earning right away. New tasks added daily.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <Card key={title} className="card-hover border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Simple Process</Badge>
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Start earning in just 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Sign Up Free", desc: "Create your free account in seconds. No credit card required.", icon: Users },
              { step: "2", title: "Complete Tasks", desc: "Browse available tasks and complete them to earn cash rewards.", icon: ClipboardList },
              { step: "3", title: "Get Paid Daily", desc: "Withdraw your earnings via PayPal, Bitcoin, Skrill, or Wise.", icon: DollarSign },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center relative">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-glow">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                  {step}
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Program */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl gradient-primary p-10 md:p-14 text-white relative overflow-hidden shadow-glow">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <Badge className="mb-4 bg-white/20 text-white border-white/30">Referral Program</Badge>
                  <h2 className="font-display text-4xl font-bold mb-4">Earn 10% From Every Referral</h2>
                  <p className="text-white/80 text-lg leading-relaxed mb-6">
                    Share your unique referral link and earn 10% commission on every dollar your referrals earn — forever. No limits!
                  </p>
                  <a href={getLoginUrl()}>
                    <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
                      Get Your Referral Link
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Commission Rate", value: "10%" },
                    { label: "Referral Limit", value: "Unlimited" },
                    { label: "Commission Type", value: "Lifetime" },
                    { label: "Payment", value: "Instant" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-display font-bold">{value}</p>
                      <p className="text-white/70 text-sm mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contests */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-yellow-100 text-yellow-700 border-yellow-200">Competitions</Badge>
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Win Big in Daily & Weekly Contests
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Compete with other earners for a share of the prize pool. Top 100 earners win cash bonuses every week.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <div className="h-2 gradient-primary" />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Daily Contest</h3>
                    <p className="text-xs text-muted-foreground">Resets every 24 hours</p>
                  </div>
                </div>
                <p className="text-3xl font-display font-bold text-foreground mb-1">$200</p>
                <p className="text-muted-foreground text-sm">Daily prize pool for top earners</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm overflow-hidden">
              <div className="h-2 gradient-gold" />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Weekly Contest</h3>
                    <p className="text-xs text-muted-foreground">Top 100 earners win prizes</p>
                  </div>
                </div>
                <p className="text-3xl font-display font-bold text-foreground mb-1">$2,000</p>
                <p className="text-muted-foreground text-sm">Weekly prize pool — compete now!</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              Get Paid Your Way
            </h2>
            <p className="text-muted-foreground text-lg">
              6 payment methods, daily payouts, minimum just $3
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {paymentMethods.map(({ name, icon }) => (
              <div key={name} className="flex items-center gap-3 bg-card border border-border rounded-xl px-6 py-4 shadow-sm card-hover">
                <span className="text-2xl">{icon}</span>
                <span className="font-semibold text-foreground">{name}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-muted-foreground mt-6 text-sm">
            Minimum withdrawal: <strong className="text-foreground">$3.00</strong> · Paid daily every Thursday
          </p>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Trusted Platform</Badge>
            <h2 className="font-display text-4xl font-bold text-foreground mb-4">
              What Our Members Say
            </h2>
            <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              <span className="text-foreground font-semibold ml-2">4.8/5</span>
              <span className="text-muted-foreground text-sm">from thousands of reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {reviews.map(({ name, rating, text, country }) => (
              <Card key={name} className="card-hover border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-foreground/80 leading-relaxed mb-4">"{text}"</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {name[0]}
                      </div>
                      <span className="font-semibold text-sm text-foreground">{name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{country}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container relative z-10 text-center">
          <Gift className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="font-display text-5xl font-bold text-white mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-white/70 text-xl mb-10 max-w-xl mx-auto">
            Join over 1 million members already earning real cash. Sign up takes less than 30 seconds.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="gradient-primary text-white border-0 shadow-glow hover:opacity-90 text-xl px-10 py-7 h-auto font-semibold">
              Create Free Account
              <ChevronRight className="ml-2 w-6 h-6" />
            </Button>
          </a>
          <p className="text-white/40 text-sm mt-6">No credit card required · Free forever</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-foreground">EarnBucks</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">FAQ</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 EarnBucks. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
