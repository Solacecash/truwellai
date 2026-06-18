-- RevenueCat-linked subscription cache on profiles (authoritative entitlement is RevenueCat SDK).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier     text NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free','pro','family')),
  ADD COLUMN IF NOT EXISTS subscription_expires  timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_updated  timestamptz,
  ADD COLUMN IF NOT EXISTS rc_customer_id        text;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
