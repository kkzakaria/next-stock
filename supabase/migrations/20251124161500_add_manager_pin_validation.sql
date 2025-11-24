-- ============================================================================
-- MANAGER PIN VALIDATION FOR CASH SESSION CLOSING
-- ============================================================================
-- Adds PIN code for managers/admins and approval tracking for cash sessions

-- Add PIN code to profiles for managers/admins
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pin_code TEXT;

-- Add comment explaining the field
COMMENT ON COLUMN public.profiles.pin_code IS 'Hashed PIN code for manager validation (bcrypt)';

-- Add approval tracking to cash_sessions
ALTER TABLE public.cash_sessions
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Add comments
COMMENT ON COLUMN public.cash_sessions.requires_approval IS 'Whether this session closure required manager approval (discrepancy detected)';
COMMENT ON COLUMN public.cash_sessions.approved_by IS 'Manager/admin who approved the closure (if required)';
COMMENT ON COLUMN public.cash_sessions.approval_notes IS 'Notes from the approving manager';

-- Create index for looking up sessions that required approval
CREATE INDEX IF NOT EXISTS idx_cash_sessions_requires_approval
ON public.cash_sessions(requires_approval)
WHERE requires_approval = true;

-- ============================================================================
-- RLS POLICIES FOR PIN CODE
-- ============================================================================

-- Users can only see their own PIN (and it's hashed anyway)
-- Managers/admins can validate PINs via the API (which checks role)

-- Policy: Users can update their own PIN
CREATE POLICY "Users can update their own PIN"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
