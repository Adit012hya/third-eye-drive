import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClipsProvider } from "@/context/ClipsContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/layouts/AppShell";
import RequireAuth from "@/components/RequireAuth";
import LoginPage from "@/pages/LoginPage";
import IntroPage from "@/pages/IntroPage";
import HomePage from "@/pages/HomePage";
import RecordPage from "@/pages/RecordPage";
import ArchivePage from "@/pages/ArchivePage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SettingsPage from "@/pages/SettingsPage";
import BatterySaverPage from "@/pages/BatterySaverPage";
import PlaybackPage from "@/pages/PlaybackPage";
import IncidentReportPage from "@/pages/IncidentReportPage";
import AiAlertsPage from "@/pages/AiAlertsPage";
import TripHistoryPage from "@/pages/TripHistoryPage";
import SOSContactsPage from "@/pages/SOSContactsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SettingsProvider>
          <ClipsProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<RequireAuth />}>
                  <Route path="/intro" element={<IntroPage />} />
                  <Route element={<AppShell />}>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/record" element={<RecordPage />} />
                    <Route path="/archive" element={<ArchivePage />} />
                    <Route path="/archive/:clipId" element={<PlaybackPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/settings/sos" element={<SOSContactsPage />} />
                    <Route path="/battery-saver" element={<BatterySaverPage />} />
                    <Route path="/incident/:clipId" element={<IncidentReportPage />} />
                    <Route path="/ai-alerts" element={<AiAlertsPage />} />
                    <Route path="/trips" element={<TripHistoryPage />} />
                  </Route>
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ClipsProvider>
        </SettingsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
