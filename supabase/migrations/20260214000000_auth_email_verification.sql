-- Enable email verification requirement
-- This migration ensures that email verification is properly handled

-- Add email_verified column to profiles if it doesn't exist (for tracking)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Create a function to sync email verification status from auth.users
CREATE OR REPLACE FUNCTION sync_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile email_verified status based on auth.users
  UPDATE profiles
  SET email_verified = (NEW.email_confirmed_at IS NOT NULL)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email verification on auth.users changes
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_verification();

-- Update existing profiles to sync current verification status
UPDATE profiles p
SET email_verified = (u.email_confirmed_at IS NOT NULL)
FROM auth.users u
WHERE p.id = u.id;

-- Add comment for documentation
COMMENT ON COLUMN profiles.email_verified IS 'Synced from auth.users.email_confirmed_at - indicates if user has verified their email';
COMMENT ON FUNCTION sync_email_verification() IS 'Automatically syncs email verification status from auth.users to profiles table';
