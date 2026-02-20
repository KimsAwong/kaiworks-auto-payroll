import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import WorkersPage from "@/pages/WorkersPage";
import AttendancePage from "@/pages/AttendancePage";
import SupervisorAttendance from "@/pages/SupervisorAttendance";
import AttendanceOverview from "@/pages/AttendanceOverview";
import PayrollWizard from "@/pages/PayrollWizard";
import PayrollHistory from "@/pages/PayrollHistory";
import PayslipsPage from "@/pages/PayslipsPage";
import PaymentHistoryPage from "@/pages/PaymentHistoryPage";
import ProfilePage from "@/pages/ProfilePage";
import TimesheetPage from "@/pages/TimesheetPage";
import ChatPage from "@/pages/ChatPage";
import CEOAnalytics from "@/pages/CEOAnalytics";
import ContractsPage from "@/pages/ContractsPage";
import SiteTimesheetsPage from "@/pages/SiteTimesheetsPage";
import ClerkApprovalPage from "@/pages/ClerkApprovalPage";
import ProjectDashboardPage from "@/pages/ProjectDashboardPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const WithLayout = ({ children }: { children: React.ReactNode }) => <AppLayout>{children}</AppLayout>;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner richColors closeButton position="top-right" />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <WithLayout><Dashboard /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workers"
                element={
                  <ProtectedRoute allowedRoles={["ceo", "supervisor", "payroll_officer", "finance"]}>
                    <WithLayout><WorkersPage /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute>
                    <WithLayout><AttendancePage /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supervisor-attendance"
                element={
                  <ProtectedRoute allowedRoles={["supervisor"]}>
                    <WithLayout><SupervisorAttendance /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance-overview"
                element={
                  <ProtectedRoute allowedRoles={["ceo", "payroll_officer", "finance"]}>
                    <WithLayout><AttendanceOverview /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payroll-wizard"
                element={
                  <ProtectedRoute allowedRoles={["ceo", "payroll_officer", "finance"]}>
                    <WithLayout><PayrollWizard /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payroll-history"
                element={
                  <ProtectedRoute allowedRoles={["ceo", "payroll_officer", "finance"]}>
                    <WithLayout><PayrollHistory /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={["ceo"]}>
                    <WithLayout><CEOAnalytics /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contracts"
                element={
                  <ProtectedRoute allowedRoles={["ceo", "supervisor"]}>
                    <WithLayout><ContractsPage /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/site-timesheets"
                element={
              <ProtectedRoute allowedRoles={["supervisor", "ceo", "clerk"]}>
                    <WithLayout><SiteTimesheetsPage /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clerk-approvals"
                element={
                  <ProtectedRoute allowedRoles={["clerk", "ceo"]}>
                    <WithLayout><ClerkApprovalPage /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/project-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["ceo", "clerk"]}>
                    <WithLayout><ProjectDashboardPage /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-payslips"
                element={
                  <ProtectedRoute>
                    <WithLayout><PayslipsPage /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/timesheet"
                element={
                  <ProtectedRoute>
                    <WithLayout><TimesheetPage /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment-history"
                element={
                  <ProtectedRoute>
                    <WithLayout><PaymentHistoryPage /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-profile"
                element={
                  <ProtectedRoute>
                    <WithLayout><ProfilePage /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <WithLayout><ChatPage /></WithLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
