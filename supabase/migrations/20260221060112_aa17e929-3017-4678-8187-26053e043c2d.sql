
-- Storage policies already partially exist, add missing ones with IF NOT EXISTS approach
DO $$
BEGIN
  -- Try to create missing policies, skip if they exist
  BEGIN
    CREATE POLICY "Admins and payroll can read all payslips"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'payslips' AND
      (is_payroll_officer(auth.uid()) OR is_admin(auth.uid()) OR is_accountant(auth.uid()))
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "Payroll can upload payslips"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'payslips' AND
      (is_payroll_officer(auth.uid()) OR is_admin(auth.uid()))
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "Admins can delete payslips"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'payslips' AND
      is_admin(auth.uid())
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
