-- Migration: Fix malformed image URLs in events table
-- Created: 2025-12-16
-- Purpose: Replace malformed placeholder URLs with proper ones

-- Update events with malformed cover_url URLs
UPDATE events 
SET cover_url = 'https://via.placeholder.com/600x400?text=Event'
WHERE cover_url IS NOT NULL 
  AND cover_url NOT LIKE 'http://%' 
  AND cover_url NOT LIKE 'https://%'
  AND cover_url NOT LIKE '/%';

-- Set NULL for empty strings
UPDATE events 
SET cover_url = NULL
WHERE cover_url = '';
