import { useAuth } from "@/contexts/AuthContext";
import CEODashboard from "./CEODashboard";
import SupervisorDashboard from "./SupervisorDashboard";
import WorkerDashboard from "./WorkerDashboard";
import PayrollOfficerDashboard from "./PayrollOfficerDashboard";
import FinanceDashboard from "./FinanceDashboard";
import ClerkDashboard from "./ClerkDashboard";

export default function DashboardRouter() {
  const { primaryRole } = useAuth();

  switch (primaryRole) {
    case 'ceo':
      return <CEODashboard />;
    case 'payroll_officer':
      return <PayrollOfficerDashboard />;
    case 'finance':
      return <FinanceDashboard />;
    case 'clerk':
      return <ClerkDashboard />;
    case 'supervisor':
      return <SupervisorDashboard />;
    default:
      return <WorkerDashboard />;
  }
}
