export interface TimesheetEntry {
  id: string;
  workerId: string;
  date: Date;
  clockIn: string;
  clockOut: string;
  totalHours: number;
  taskDescription: string;
  supervisorId: string;
  status: 'pending' | 'approved' | 'flagged';
  createdAt: Date;
}

export interface Payslip {
  id: string;
  worker_id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  hourly_rate: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  status: 'draft' | 'generated' | 'paid';
  generated_by?: string | null;
  paid_by?: string | null;
  paid_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}
