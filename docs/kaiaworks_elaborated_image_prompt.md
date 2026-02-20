KaiaWorks Digital Payroll Management System - Elaborated Image Prompt

Create an ultra-detailed enterprise architecture infographic for "KaiaWorks Digital Payroll Management System (Phase 1)".

Style and composition:
- 16:9 landscape, high-resolution, boardroom-quality, clean modern enterprise design.
- Corporate PNG business context, professional blue/teal palette with orange highlights.
- Clear layered sections with arrows showing data flow from left to right.
- Include icons for CEO, supervisors, workers, attendance, payroll, PDF payslips, audit logs, tax, superannuation, analytics, security, cloud database, realtime notifications.
- Include subtle background elements: network nodes, cloud and dashboard screens.
- Typography should be clear and readable; no clutter.

Must include these exact business goals:
- Eliminate manual payroll processing
- Reduce employee complaints
- Increase payroll accuracy
- Improve trust and transparency
- Ensure compliance with PNG employment and tax laws
- Create structured searchable payroll records
- Prepare company for digital scalability

Must include core modules block:
1. Employee Management Module
2. Attendance Module (Clock In/Out)
3. Supervisor Approval Module
4. Payroll Engine
5. Payslip Generation (PDF)
6. Reporting and Compliance
7. Admin and CEO Dashboard
8. Worker Self-Service Portal
9. Security and RLS Access Control
10. Audit Logging and Realtime Notifications

Must show organizational hierarchy exactly:
CEO / General Manager
-> Supervisor 1
-> Supervisor 2
-> Workers under each supervisor
Workers split into:
- Permanent Workers
- Temporary Workers

Must visually explain role-based access:
- CEO: full visibility, manage supervisors, manage all employees, run payroll, approve payroll cycle, reports, attendance overview, chat.
- Supervisor: view/manage only assigned workers, review pending attendance, approve/reject/edit attendance, view team records, chat.
- Worker: profile, clock in/out, attendance history, payslip download, payment history, chat with supervisor.

Must show attendance workflow:
1. Worker taps big mobile clock in/out button.
2. Attendance record stored with status "pending".
3. Supervisor reviews team pending records.
4. Supervisor can approve/reject/edit time.
5. Approved attendance feeds payroll calculations.
6. Worker receives realtime status update notification.

Must show payroll workflow:
1. Payroll period selected.
2. System pulls only approved attendance hours.
3. Logic branches by worker type:
   - Permanent: fixed base salary + overtime + full super.
   - Temporary: hourly rate x approved hours, no auto super unless configured.
4. Apply PNG 2026 tax brackets (resident and non-resident).
5. Apply deductions and super.
6. CEO approves payroll cycle.
7. PDF payslips generated via @pdfme/generator.
8. payslip_url stored in payroll entries.
9. Worker receives realtime payslip-ready toast notification.

Must include compliance and reporting outputs:
- Monthly payroll summary
- Tax deduction report
- Superannuation report
- Annual income summary
- Payroll cost analytics
- Overtime trend analytics

Must include security and governance:
- Supabase cloud database
- Row Level Security (RLS):
  - Workers see only own data
  - Supervisors see only assigned team via supervisor_id
  - CEO sees all
- Realtime enabled on attendance, payroll entries, and messages
- Audit log on attendance status changes and payroll approvals
- Encrypted authentication and role-based login

Must include seed-data simulation panel:
- 1 CEO
- 2 Supervisors
- 8 Workers (4 permanent, 4 temporary balanced under supervisors)
- Sample pending and approved attendance
- At least 1 completed payroll cycle with generated payslips

Must include impact panel:
- 70-80 percent HR workload reduction
- Reduced payroll disputes
- Faster payroll cycle
- Higher trust and transparency
- Better compliance readiness
- Foundation for future expansion (biometric attendance, leave, SMS payslips, mobile app, bank file export, multi-company SaaS)

End with title banner:
"KaiaWorks Digital Financial Operations Backbone - Attendance + Payroll Integrated Architecture"
