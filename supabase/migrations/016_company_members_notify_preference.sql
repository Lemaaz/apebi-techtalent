-- Migration 016: Add notification preference to company_members
-- Allows recruiters to opt out of "new application" email alerts.
-- In-app notifications (NOT-04) are always sent regardless of this preference.

ALTER TABLE company_members
ADD COLUMN IF NOT EXISTS notify_on_application BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN company_members.notify_on_application
  IS 'When true, recruiter receives an email on each new application (default). In-app notifications are always sent.';
