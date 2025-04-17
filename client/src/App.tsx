import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Services from "@/pages/services";
import Projects from "@/pages/projects";
import Contacts from "@/pages/contacts";
import FollowUps from "@/pages/followups";
import Employees from "@/pages/employees";
import Reports from "@/pages/reports";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/clients" component={Clients} />
      <ProtectedRoute path="/clients/:id" component={Clients} />
      <ProtectedRoute path="/services" component={Services} />
      <ProtectedRoute path="/projects" component={Projects} />
      <ProtectedRoute path="/contacts" component={Contacts} />
      <ProtectedRoute path="/followups" component={FollowUps} />
      <ProtectedRoute path="/employees" component={Employees} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/settings" component={Dashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
