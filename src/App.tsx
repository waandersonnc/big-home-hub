import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { OnboardingGuard } from "@/guards/OnboardingGuard";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { LeadInformativeBlocker } from "@/components/LeadInformativeBlocker";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Suspense, lazy } from "react";
import { PageLoader } from "@/components/PageLoader";

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Team = lazy(() => import("@/pages/Team/index"));
const Announcements = lazy(() => import("@/pages/Announcements"));
const Properties = lazy(() => import("@/pages/Properties"));
const Pipeline = lazy(() => import("@/pages/Pipeline"));
const Financial = lazy(() => import("@/pages/Financial"));
const Agents = lazy(() => import("@/pages/Agents"));
const PreSignup = lazy(() => import("@/pages/PreSignup"));
const SignupOwner = lazy(() => import("@/pages/SignupOwner"));
const EmailConfirmation = lazy(() => import("@/pages/EmailConfirmation"));
const OnboardingWizard = lazy(() => import("@/pages/Onboarding/OnboardingWizard"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const AllDash = lazy(() => import("@/pages/AllDash"));
const Leads = lazy(() => import("@/pages/Leads"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CompanyProvider>
            <LeadInformativeBlocker />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
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
                      <Route path="/disponiveis" element={<Leads />} />
                      <Route path="/equipe" element={<Team />} />
                      <Route path="/anuncios" element={<Announcements />} />
                      <Route path="/imoveis" element={<Properties />} />
                      <Route path="/movimentacao" element={<Pipeline />} />
                      <Route path="/financeiro" element={<Financial />} />
                      <Route path="/agentes" element={<Agents />} />
                      <Route path="/settings" element={<Settings />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CompanyProvider>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
