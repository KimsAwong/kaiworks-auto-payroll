
-- Create private payslips storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payslips', 'payslips', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Allow admins to upload payslips
CREATE POLICY "Admins can upload payslips"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payslips' AND
  public.is_admin(auth.uid())
);

-- Allow admins to read all payslips
CREATE POLICY "Admins can read all payslips"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payslips' AND
  public.is_admin(auth.uid())
);

-- Allow accountants to read all payslips
CREATE POLICY "Accountants can read payslips"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payslips' AND
  public.is_accountant(auth.uid())
);

-- Allow workers to read their own payslips (path: generated/{worker_id}/...)
CREATE POLICY "Workers can read own payslips"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payslips' AND
  (storage.foldername(name))[1] = 'generated' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow supervisors to read their assigned workers payslips
CREATE POLICY "Supervisors can read assigned worker payslips"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payslips' AND
  public.has_role(auth.uid(), 'supervisor') AND
  (storage.foldername(name))[1] = 'generated' AND
  public.is_supervisor_of(auth.uid(), (storage.foldername(name))[2]::uuid)
);

-- Allow admins to update/overwrite payslips
CREATE POLICY "Admins can update payslips"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'payslips' AND
  public.is_admin(auth.uid())
);
