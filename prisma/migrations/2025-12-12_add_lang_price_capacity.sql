-- Migration: add lang to users and price/capacity to events

BEGIN;

-- Add lang to users (default 'fr')
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS lang varchar(10) DEFAULT 'fr';

-- Add price to events (decimal) and capacity as integer
ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS capacity integer DEFAULT 0;

COMMIT;
