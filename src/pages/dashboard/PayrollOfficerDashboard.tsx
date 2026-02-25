import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";
import PayrollOverviewTab from "./payroll/PayrollOverviewTab";
import PayrollReadyTab from "./payroll/PayrollReadyTab";
import PayrollRunsTab from "./payroll/PayrollRunsTab";
import PayrollEmployeesTab from "./payroll/PayrollEmployeesTab";

export default function PayrollOfficerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-sidebar p-6 text-sidebar-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              {greeting()}, {user?.full_name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-sidebar-foreground/80 mt-1">
              Payroll Officer Dashboard — Collect, verify &amp; calculate wages
            </p>
          </div>
          <Badge className="bg-sidebar-accent text-sidebar-accent-foreground border-0 gap-1 self-start">
            <Calculator size={14} /> Payroll Officer
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ready">Ready for Payroll</TabsTrigger>
          <TabsTrigger value="runs">Payroll Runs</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PayrollOverviewTab />
        </TabsContent>
        <TabsContent value="ready">
          <PayrollReadyTab />
        </TabsContent>
        <TabsContent value="runs">
          <PayrollRunsTab />
        </TabsContent>
        <TabsContent value="employees">
          <PayrollEmployeesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
