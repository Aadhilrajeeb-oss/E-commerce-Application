-- Add 'customer' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';

-- Add customer_id to users to link auth to profile
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
