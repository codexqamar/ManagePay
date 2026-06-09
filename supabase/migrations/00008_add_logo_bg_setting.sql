-- ============================================================
-- ADD LOGO BACKGROUND SETTING TO COMPANIES
-- ============================================================

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_has_dark_bg boolean DEFAULT false;

-- Reload schema
NOTIFY pgrst, 'reload schema';
