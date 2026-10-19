-- Migration: UTP Relief tracker + Cause List columns
-- Adds max_punishment_years to cases and adjournment_reason to hearings

ALTER TABLE cases ADD COLUMN max_punishment_years INTEGER;
ALTER TABLE hearings ADD COLUMN adjournment_reason TEXT;
