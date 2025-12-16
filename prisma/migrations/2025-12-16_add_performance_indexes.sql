-- Migration: Add performance indexes for events and favorites
-- Created: 2025-12-16
-- Purpose: Optimize queries for smart ranking and filtering

-- Index on events.date (range queries for date filtering)
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date DESC);

-- Index on events.created_at (recency scoring)
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- Index on events.registered (popularity scoring)
CREATE INDEX IF NOT EXISTS idx_events_registered ON events(registered DESC);

-- Composite index for smart-ranked filtering (date + created_at)
CREATE INDEX IF NOT EXISTS idx_events_date_created ON events(date DESC, created_at DESC);

-- Indexes on favorites for fast lookups
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_event_id ON favorites(event_id);

-- Composite index for user's favorite lookup
CREATE INDEX IF NOT EXISTS idx_favorites_user_event ON favorites(user_id, event_id);

-- Index on events.category for category filtering
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- Index on events.place for location search
CREATE INDEX IF NOT EXISTS idx_events_place ON events(place);
