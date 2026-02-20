import {
  LayoutDashboard, Users, Calculator, FileText, MessageSquare,
  LogOut, UserCircle, Receipt, History, BarChart3, Banknote, Clock, ClipboardCheck,
  FolderKanban, FileSignature
} from "lucide-react";
import companyLogo from "@/assets/company-logo.png";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader,
} from "@/components/ui/sidebar";

const ceoNav = [
  { title: "CEO Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Manage Staff", url: "/workers", icon: Users },
  { title: "Projects", url: "/project-dashboard", icon: FolderKanban },
  { title: "Payroll Approval", url: "/payroll-wizard", icon: ClipboardCheck },
  { title: "Payroll History", url: "/payroll-history", icon: History },
  { title: "Attendance Overview", url: "/attendance-overview", icon: FileText },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Chat", url: "/chat", icon: MessageSquare },
];

const payrollOfficerNav = [
  { title: "Payroll Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Process Payroll", url: "/payroll-wizard", icon: Calculator },
  { title: "All Timesheets", url: "/attendance-overview", icon: Clock },
  { title: "Payroll History", url: "/payroll-history", icon: History },
  { title: "All Workers", url: "/workers", icon: Users },
  { title: "Chat", url: "/chat", icon: MessageSquare },
];

const financeNav = [
  { title: "Finance Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Process Payments", url: "/payroll-wizard", icon: Banknote },
  { title: "Payroll History", url: "/payroll-history", icon: History },
  { title: "All Workers", url: "/workers", icon: Users },
  { title: "Chat", url: "/chat", icon: MessageSquare },
];

const supervisorNav = [
  { title: "My Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Enter Timesheets", url: "/timesheet", icon: Clock },
  { title: "Contracts", url: "/contracts", icon: FileText },
  { title: "Chat", url: "/chat", icon: MessageSquare },
];

const clerkNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Authorize Timesheets", url: "/clerk-approvals", icon: FileSignature },
  { title: "All Site Timesheets", url: "/site-timesheets", icon: ClipboardCheck },
  { title: "Projects", url: "/project-dashboard", icon: FolderKanban },
  { title: "Chat", url: "/chat", icon: MessageSquare },
];

const workerNav = [
  { title: "My Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Timesheets", url: "/timesheet", icon: Clock },
  { title: "My Payslips", url: "/my-payslips", icon: Receipt },
  { title: "Chat", url: "/chat", icon: MessageSquare },
];

const roleLabel: Record<string, string> = {
  ceo: 'CEO',
  payroll_officer: 'Payroll Officer',
  finance: 'Finance',
  clerk: 'Clerk',
  supervisor: 'Supervisor',
  worker: 'Worker',
};

export function AppSidebar() {
  const { user, primaryRole, signOut } = useAuth();
  
  let navItems;
  switch (primaryRole) {
    case 'ceo': navItems = ceoNav; break;
    case 'payroll_officer': navItems = payrollOfficerNav; break;
    case 'finance': navItems = financeNav; break;
    case 'clerk': navItems = clerkNav; break;
    case 'supervisor': navItems = supervisorNav; break;
    default: navItems = workerNav;
  }

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <img src={companyLogo} alt="KaiaWorks" className="h-8 w-auto object-contain rounded" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">KaiaWorks</span>
            <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Auto PayRoll</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest px-3 mb-1">
            {roleLabel[primaryRole] || 'Worker'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-accent-foreground">
            {user?.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-sidebar-foreground truncate">{user?.full_name ?? "User"}</span>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors w-full"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
