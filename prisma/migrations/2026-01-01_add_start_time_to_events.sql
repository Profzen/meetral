-- Add start_time column to events table if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS start_time TIME NOT NULL DEFAULT '18:00';

-- Create index on start_time for performance (optional, but good for sorting)
CREATE INDEX IF NOT EXISTS idx_events_date_start_time ON events(date, start_time);
