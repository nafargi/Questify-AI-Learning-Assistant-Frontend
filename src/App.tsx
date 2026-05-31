import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { WalkthroughProvider } from "@/components/walkthrough/WalkthroughContext";
import { MaterialProvider } from "@/contexts/MaterialContext";
import { WalkthroughManager } from "@/components/walkthrough/WalkthroughManager";
import { ThemeProvider } from "@/components/theme-provider";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import VerifyOTP from "./pages/VerifyOTP";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Upload from "./pages/Upload";
import Exam from "./pages/Exam";
import Notes from "./pages/Notes";
import StudyRoom from "./pages/StudyRoom";
import Planner from "./pages/Planner";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Billing from "./pages/Billing";
import ExamHistory from "./pages/ExamHistory";
import QuestyChat from "./pages/QuestyChat";
import Pricing from "./pages/Pricing";
import PaymentResult from "./pages/PaymentResult";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="questify-theme" attribute="class">
      <AuthProvider>
        <AppProvider>
          <MaterialProvider>
            <WalkthroughProvider>
            <WalkthroughManager />
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-otp" element={<VerifyOTP />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/exam" element={<Exam />} />
                  <Route path="/notes" element={<Notes />} />
                  <Route path="/study-room" element={<StudyRoom />} />
                  <Route path="/planner" element={<Planner />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/payment/result" element={<PaymentResult />} />
                  <Route path="/exam-history" element={<ExamHistory />} />
                  <Route path="/questy-chat" element={<QuestyChat />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </WalkthroughProvider>
        </MaterialProvider>
      </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
