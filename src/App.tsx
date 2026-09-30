import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Index, { Dashboard, Login, MicroGoals, Onboarding, Premium, Projection, Rewards, Settings } from "./pages/Index";
import { InvestmentPlans } from "./pages/InvestmentPlans";
import { AdminPayments } from "./pages/AdminPayments";
import { AuthCallback, EmailVerification, PasswordReset } from "./components/SupabaseAuthFlow";
import NotFound from "./pages/NotFound";
import { SupabaseSavetripProvider } from "./lib/supabaseSavetrip";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SupabaseSavetripProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<EmailVerification />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset-password" element={<PasswordReset />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projection" element={<Projection />} />
            <Route path="/plans" element={<InvestmentPlans />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/micro-goals" element={<MicroGoals />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SupabaseSavetripProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
