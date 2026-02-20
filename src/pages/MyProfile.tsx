import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKina } from "@/lib/payroll-engine";
import { UserCircle, Building, DollarSign, MapPin } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function MyProfile() {
  const { user } = useAuth();
  const [info, setInfo] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => { if (data) setInfo(data); });
  }, [user]);

  if (!info) return (
    <div className="space-y-6">
      <h1 className="page-header">My Profile</h1>
      <Card><CardContent className="py-12 text-center text-muted-foreground">Loading profile...</CardContent></Card>
    </div>
  );

  const details = [
    { icon: Building, label: "Department", value: info.department ?? "—" },
    { icon: Building, label: "Position", value: info.position ?? "—" },
    { icon: DollarSign, label: "Hourly Rate", value: formatKina(Number(info.hourly_rate ?? 0)) },
    { icon: MapPin, label: "Location", value: info.location ?? "—" },
    { icon: UserCircle, label: "Employment Type", value: info.employment_type },
  ];

  return (
    <div className="space-y-6">
      <h1 className="page-header">My Profile</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-xl">{info.full_name[0]}</span>
            </div>
            <div>
              <CardTitle>{info.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{info.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {details.map((d) => (
              <div key={d.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <d.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                  <p className="text-sm font-medium">{d.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
