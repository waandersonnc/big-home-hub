import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Team from "@/pages/Team/index";
import Announcements from "@/pages/Announcements";
import Properties from "@/pages/Properties";
import Pipeline from "@/pages/Pipeline";
import Financial from "@/pages/Financial";
import Agents from "@/pages/Agents";
import PreSignup from "@/pages/PreSignup";
import SignupOwner from "@/pages/SignupOwner";
import EmailConfirmation from "@/pages/EmailConfirmation";
import OnboardingWizard from "@/pages/Onboarding/OnboardingWizard";
import ResetPassword from "@/pages/ResetPassword";
import AllDash from "@/pages/AllDash";
import Leads from "@/pages/Leads";
import { OnboardingGuard } from "@/guards/OnboardingGuard";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CompanyProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<PreSignup />} />
              <Route path="/cadastro/dono" element={<SignupOwner />} />
              <Route path="/confirmar-email" element={<EmailConfirmation />} />
              <Route path="/onboarding" element={<OnboardingWizard />} />
              <Route path="/recuperar-senha" element={<ResetPassword />} />

              <Route element={<OnboardingGuard />}>
                <Route element={<AppShell />}>
                  <Route path="/visao-geral" element={<AllDash />} />
                  <Route path="/painel" element={<Dashboard />} />
                  <Route path="/oportunidades" element={<Leads />} />
                  <Route path="/equipe" element={<Team />} />
                  <Route path="/anuncios" element={<Announcements />} />
                  <Route path="/imoveis" element={<Properties />} />
                  <Route path="/movimentacao" element={<Pipeline />} />
                  <Route path="/financeiro" element={<Financial />} />
                  <Route path="/agentes" element={<Agents />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CompanyProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
