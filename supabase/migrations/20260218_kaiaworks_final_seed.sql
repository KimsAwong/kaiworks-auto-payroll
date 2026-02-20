-- KaiaWorks Phase 1 seed
-- 1 CEO, 2 supervisors, 8 workers (4 permanent, 4 temporary)

DELETE FROM public.payroll_entries
WHERE worker_id IN (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000015',
  '00000000-0000-0000-0000-000000000016',
  '00000000-0000-0000-0000-000000000017'
);

DELETE FROM public.attendance
WHERE worker_id IN (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000015',
  '00000000-0000-0000-0000-000000000016',
  '00000000-0000-0000-0000-000000000017'
);

DELETE FROM public.user_roles
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000013',
  '00000000-0000-0000-0000-000000000014',
  '00000000-0000-0000-0000-000000000015',
  '00000000-0000-0000-0000-000000000016',
  '00000000-0000-0000-0000-000000000017'
);

INSERT INTO public.profiles (id, full_name, email, worker_type, base_salary, hourly_rate, supervisor_id, account_status, is_active, is_resident, super_enabled)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'KaiaWorks CEO', 'ceo@kaiapay.com', NULL, NULL, NULL, NULL, 'approved', TRUE, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Supervisor One', 'supervisor1@kaiapay.com', NULL, NULL, NULL, '00000000-0000-0000-0000-000000000001', 'approved', TRUE, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000003', 'Supervisor Two', 'supervisor2@kaiapay.com', NULL, NULL, NULL, '00000000-0000-0000-0000-000000000001', 'approved', TRUE, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000010', 'Permanent Worker 1', 'pw1@kaiapay.com', 'permanent', 2200, 27.5, '00000000-0000-0000-0000-000000000002', 'approved', TRUE, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000011', 'Permanent Worker 2', 'pw2@kaiapay.com', 'permanent', 2100, 26.25, '00000000-0000-0000-0000-000000000002', 'approved', TRUE, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000012', 'Permanent Worker 3', 'pw3@kaiapay.com', 'permanent', 2400, 30, '00000000-0000-0000-0000-000000000003', 'approved', TRUE, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000013', 'Permanent Worker 4', 'pw4@kaiapay.com', 'permanent', 2500, 31.25, '00000000-0000-0000-0000-000000000003', 'approved', TRUE, TRUE, TRUE),
  ('00000000-0000-0000-0000-000000000014', 'Temporary Worker 1', 'tw1@kaiapay.com', 'temporary', NULL, 18, '00000000-0000-0000-0000-000000000002', 'approved', TRUE, TRUE, FALSE),
  ('00000000-0000-0000-0000-000000000015', 'Temporary Worker 2', 'tw2@kaiapay.com', 'temporary', NULL, 20, '00000000-0000-0000-0000-000000000002', 'approved', TRUE, FALSE, FALSE),
  ('00000000-0000-0000-0000-000000000016', 'Temporary Worker 3', 'tw3@kaiapay.com', 'temporary', NULL, 19, '00000000-0000-0000-0000-000000000003', 'approved', TRUE, TRUE, FALSE),
  ('00000000-0000-0000-0000-000000000017', 'Temporary Worker 4', 'tw4@kaiapay.com', 'temporary', NULL, 21, '00000000-0000-0000-0000-000000000003', 'approved', TRUE, TRUE, FALSE)
ON CONFLICT (id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  worker_type = EXCLUDED.worker_type,
  base_salary = EXCLUDED.base_salary,
  hourly_rate = EXCLUDED.hourly_rate,
  supervisor_id = EXCLUDED.supervisor_id,
  account_status = EXCLUDED.account_status,
  is_active = EXCLUDED.is_active,
  is_resident = EXCLUDED.is_resident,
  super_enabled = EXCLUDED.super_enabled;

INSERT INTO public.user_roles (id, user_id, role)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'ceo'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'supervisor'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'supervisor'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000010', 'worker'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000011', 'worker'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000012', 'worker'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000013', 'worker'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000014', 'worker'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000015', 'worker'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000016', 'worker'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000017', 'worker');

INSERT INTO public.attendance (id, worker_id, clock_in, clock_out, status, approved_by, approved_at, notes)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000010', '2026-02-14T08:00:00+10', '2026-02-14T17:00:00+10', 'approved', '00000000-0000-0000-0000-000000000002', '2026-02-14T18:00:00+10', 'Verified'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000011', '2026-02-15T08:10:00+10', '2026-02-15T17:20:00+10', 'pending', NULL, NULL, NULL),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000012', '2026-02-15T08:02:00+10', '2026-02-15T17:05:00+10', 'approved', '00000000-0000-0000-0000-000000000003', '2026-02-15T17:40:00+10', NULL),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000013', '2026-02-15T08:30:00+10', '2026-02-15T16:15:00+10', 'rejected', '00000000-0000-0000-0000-000000000003', '2026-02-15T17:00:00+10', 'Missing task notes'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000014', '2026-02-16T09:00:00+10', '2026-02-16T16:30:00+10', 'approved', '00000000-0000-0000-0000-000000000002', '2026-02-16T17:00:00+10', NULL),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000015', '2026-02-16T09:00:00+10', NULL, 'pending', NULL, NULL, NULL),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000016', '2026-02-17T09:00:00+10', '2026-02-17T18:00:00+10', 'approved', '00000000-0000-0000-0000-000000000003', '2026-02-17T19:00:00+10', NULL),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000017', '2026-02-17T09:05:00+10', '2026-02-17T17:40:00+10', 'pending', NULL, NULL, NULL);

INSERT INTO public.payroll_entries (id, worker_id, period_start, period_end, gross_pay, net_pay, super, tax, deductions, status, paid_at, paid_by, payslip_url)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000010', '2026-02-01', '2026-02-15', 2515.00, 2083.85, 150.90, 280.25, 0, 'paid', '2026-02-16T10:00:00+10', '00000000-0000-0000-0000-000000000001', 'https://example.com/payslips/pw1-2026-02-15.pdf'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000014', '2026-02-01', '2026-02-15', 1140.00, 1008.60, 0.00, 131.40, 0, 'paid', '2026-02-16T10:00:00+10', '00000000-0000-0000-0000-000000000001', 'https://example.com/payslips/tw1-2026-02-15.pdf');

INSERT INTO public.audit_log (id, user_id, action, target_table, target_id, details)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'attendance_approved', 'attendance', NULL, '{"note":"seed approval sample"}'::jsonb),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'payroll_approved', 'payroll_entries', NULL, '{"period_start":"2026-02-01","period_end":"2026-02-15"}'::jsonb);
