interface PayslipData {
  workerName: string;
  workerPosition: string;
  workerEmail?: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: string;
  paidAt?: string;
  notes?: string;
}

export async function generatePayslipPdf(payslip: PayslipData) {
  const generatorModule = await import(/* @vite-ignore */ "@pdfme/generator");

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
        { type: "text", position: { x: 12, y: 86 }, width: 180, height: 6, name: "status", fontSize: 10 },
      ],
    ],
  } as any;

  const inputs = [
    {
      title: "KaiaWorks Payslip",
      worker: `${payslip.workerName} — ${payslip.workerPosition || 'Employee'}`,
      period: `Period: ${formatDate(payslip.periodStart)} – ${formatDate(payslip.periodEnd)}`,
      gross: `Gross Pay: K ${payslip.grossPay.toLocaleString('en', { minimumFractionDigits: 2 })}`,
      deductions: `Deductions: K ${payslip.deductions.toFixed(2)}`,
      net: `Net Pay: K ${payslip.netPay.toLocaleString('en', { minimumFractionDigits: 2 })}`,
      status: `Status: ${payslip.status.toUpperCase()} | Generated: ${new Date().toLocaleDateString()}`,
    },
  ];

  const pdf = await generatorModule.generate({ template, inputs });
  const blob = new Blob([new Uint8Array(pdf as any)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payslip_${payslip.workerName.replace(/\s+/g, '_')}_${payslip.periodStart}_${payslip.periodEnd}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
