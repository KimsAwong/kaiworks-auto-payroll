import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Timesheet = Tables<"timesheets">;
type Payslip = Tables<"payslips">;
type UserProfile = Tables<"profiles">;

export interface PayrollResult {
  grossEarnings: number;
  fortnightlyPaye: number;
  employeeSuper: number;
  employerSuper: number;
  otherDeductions: number;
  netPay: number;
  approvedHours: number;
  overtimeHours: number;
  baseComponent: number;
  hourlyComponent: number;
}

type TaxBracket = {
  min: number;
  max: number | null;
  rate: number;
  base: number;
};

const RESIDENT_BRACKETS_2026: TaxBracket[] = [
  { min: 0, max: 20000, rate: 0, base: 0 },
  { min: 20001, max: 33000, rate: 0.3, base: 0 },
  { min: 33001, max: 70000, rate: 0.35, base: 3900 },
  { min: 70001, max: 250000, rate: 0.4, base: 16850 },
  { min: 250001, max: null, rate: 0.42, base: 88850 },
];

const NON_RESIDENT_BRACKETS_2026: TaxBracket[] = [
  { min: 0, max: 20000, rate: 0.22, base: 0 },
  { min: 20001, max: 33000, rate: 0.3, base: 4400 },
  { min: 33001, max: 70000, rate: 0.35, base: 8300 },
  { min: 70001, max: 250000, rate: 0.4, base: 21250 },
  { min: 250001, max: null, rate: 0.42, base: 93250 },
];

function calculateAnnualPaye(annualIncome: number, brackets: TaxBracket[]) {
  for (const bracket of brackets) {
    const max = bracket.max ?? Infinity;
    if (annualIncome <= max) {
      const taxableInBracket = Math.max(0, annualIncome - bracket.min + 1);
      return bracket.base + taxableInBracket * bracket.rate;
    }
  }
  return 0;
}

function getApprovedHours(timesheets: Timesheet[]) {
  return timesheets.reduce((sum, row) => {
    if (row.status !== "approved" || !row.total_hours) return sum;
    return sum + Number(row.total_hours);
  }, 0);
}

export function calculateWorkerPayroll({
  worker,
  timesheets,
  isResident,
  allowances = 0,
  otherDeductions = 0,
}: {
  worker: UserProfile;
  timesheets: Timesheet[];
  isResident: boolean;
  allowances?: number;
  otherDeductions?: number;
}): PayrollResult {
  const approvedHours = Number(getApprovedHours(timesheets).toFixed(2));
  const hourlyRate = Number(worker.hourly_rate ?? 0);

  let baseComponent = 0;
  let hourlyComponent = 0;
  let overtimeHours = 0;
  const employeeSuperRate = 0.06;
  const employerSuperRate = 0.084;

  if (worker.employment_type === "temporary") {
    hourlyComponent = Number((approvedHours * hourlyRate).toFixed(2));
  } else {
    // Permanent workers: no base_salary column, use hourly_rate * standard hours
    baseComponent = Number((approvedHours * hourlyRate).toFixed(2));
    overtimeHours = Math.max(0, approvedHours - 80);
    hourlyComponent = Number((overtimeHours * hourlyRate * 0.5).toFixed(2)); // overtime premium only
  }

  const grossEarnings = Number((baseComponent + hourlyComponent + allowances).toFixed(2));
  const annualizedGross = grossEarnings * 26;
  const taxBrackets = isResident ? RESIDENT_BRACKETS_2026 : NON_RESIDENT_BRACKETS_2026;
  const annualPaye = calculateAnnualPaye(annualizedGross, taxBrackets);
  const fortnightlyPaye = Number((annualPaye / 26).toFixed(2));
  const employeeSuper = Number((grossEarnings * employeeSuperRate).toFixed(2));
  const employerSuper = Number((grossEarnings * employerSuperRate).toFixed(2));
  const netPay = Number((grossEarnings - fortnightlyPaye - employeeSuper - otherDeductions).toFixed(2));

  return {
    grossEarnings,
    fortnightlyPaye,
    employeeSuper,
    employerSuper,
    otherDeductions,
    netPay,
    approvedHours,
    overtimeHours: Number(overtimeHours.toFixed(2)),
    baseComponent,
    hourlyComponent,
  };
}

export async function generateAndStorePayslipPdf({
  payslip,
  worker,
}: {
  payslip: Payslip;
  worker: UserProfile;
}) {
  const template = {
    basePdf: { width: 210, height: 297, padding: [10, 10, 10, 10] },
    schemas: [
      [
        { type: "text", position: { x: 12, y: 18 }, width: 180, height: 8, name: "title", fontSize: 18 },
        { type: "text", position: { x: 12, y: 32 }, width: 180, height: 6, name: "worker", fontSize: 12 },
        { type: "text", position: { x: 12, y: 42 }, width: 180, height: 6, name: "period", fontSize: 11 },
        { type: "text", position: { x: 12, y: 54 }, width: 180, height: 6, name: "gross", fontSize: 11 },
        { type: "text", position: { x: 12, y: 62 }, width: 180, height: 6, name: "deductions", fontSize: 11 },
        { type: "text", position: { x: 12, y: 74 }, width: 180, height: 7, name: "net", fontSize: 14 },
      ],
    ],
  } as any;

  const inputs = [
    {
      title: "KaiaWorks Payslip",
      worker: `Worker: ${worker.full_name ?? worker.id}`,
      period: `Period: ${payslip.period_start} to ${payslip.period_end}`,
      gross: `Gross: K ${Number(payslip.gross_pay ?? 0).toFixed(2)}`,
      deductions: `Deductions: K ${Number(payslip.deductions ?? 0).toFixed(2)}`,
      net: `Net Pay: K ${Number(payslip.net_pay ?? 0).toFixed(2)}`,
    },
  ];

  const generatorModule = await import(/* @vite-ignore */ "@pdfme/generator");
  const pdf = await generatorModule.generate({ template, inputs });
  const fileName = `payslip-${payslip.period_start}-${payslip.period_end}.pdf`;
  const path = `generated/${payslip.worker_id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("payslips")
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw uploadError;

  const { data, error: signedUrlError } = await supabase.storage
    .from("payslips")
    .createSignedUrl(path, 3600); // 1 hour expiry
  if (signedUrlError) throw signedUrlError;
  return data.signedUrl;
}

export function formatKina(amount: number) {
  return `K ${Number(amount ?? 0).toLocaleString("en-PG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
