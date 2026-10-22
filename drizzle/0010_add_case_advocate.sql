-- Migration: Add advocate column to cases table
ALTER TABLE cases ADD COLUMN advocate TEXT DEFAULT 'Aditi Sharma';
