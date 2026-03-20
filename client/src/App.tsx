import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Earnings from "./pages/Earnings";
import Referrals from "./pages/Referrals";
import Withdrawals from "./pages/Withdrawals";
import Contests from "./pages/Contests";
import Notifications from "./pages/Notifications";
import AdminPanel from "./pages/AdminPanel";
import DemoLogin from "./pages/DemoLogin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/earnings" component={Earnings} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/withdraw" component={Withdrawals} />
      <Route path="/contests" component={Contests} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/demo-login" component={DemoLogin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
