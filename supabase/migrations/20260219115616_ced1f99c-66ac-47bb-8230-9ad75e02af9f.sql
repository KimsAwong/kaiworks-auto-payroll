
-- Fix user_roles.role column: change from text to app_role enum
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role USING role::public.app_role,
  ALTER COLUMN role SET DEFAULT 'worker'::public.app_role;
