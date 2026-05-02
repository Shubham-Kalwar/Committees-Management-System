-- Onboarding Fields Migration
-- Adds onboarding-related columns to the users table

-- Add onboarding flag
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;

-- Add profile fields for onboarding
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS year VARCHAR(20);

-- Store interests as JSON text (e.g. '["Technology","Sports"]')
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT;

-- Mark all existing users as already onboarded
UPDATE users SET is_onboarded = TRUE WHERE is_onboarded IS NULL OR is_onboarded = FALSE;

SELECT 'Onboarding migration completed successfully!' AS status;
