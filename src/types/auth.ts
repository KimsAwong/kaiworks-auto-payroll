export type UserRole = 'ceo' | 'supervisor' | 'worker' | 'payroll_officer' | 'finance' | 'clerk';
export type EmploymentType = 'permanent' | 'temporary';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  employment_type: EmploymentType | null;
  supervisor_id: string | null;
  avatar_url: string | null;
  location: string | null;
  hourly_rate: number | null;
  base_salary: number | null;
  worker_type: 'permanent' | 'temporary' | null;
  is_resident: boolean | null;
  super_enabled: boolean | null;
  account_status: ApprovalStatus | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  employee_id: string | null;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  roles: UserRole[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isApproved: boolean;
  isEmailVerified: boolean;
}
