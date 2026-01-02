-- Harmonisation du schéma sans casser l’existant
-- 1) Normaliser la date/heure : on conserve date (DATE) + start_time (TIME), on supprime start_at
-- 2) Aligner l’archive sur le même schéma
-- 3) Ajouter les index indispensables

BEGIN;

-- Normaliser la table events
ALTER TABLE events
  ALTER COLUMN start_time SET NOT NULL,
  ALTER COLUMN start_time SET DEFAULT '18:00'::time,
  ALTER COLUMN date TYPE date USING date::date;

ALTER TABLE events
  DROP COLUMN IF EXISTS start_at;

-- Aligner l’archive
ALTER TABLE events_archive
  ALTER COLUMN start_time SET NOT NULL,
  ALTER COLUMN start_time SET DEFAULT '18:00'::time,
  ALTER COLUMN date TYPE date USING date::date;

ALTER TABLE events_archive
  DROP COLUMN IF EXISTS start_at;

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS events_date_start_time_idx ON events(date, start_time);
CREATE INDEX IF NOT EXISTS events_date_idx ON events(date);
CREATE INDEX IF NOT EXISTS event_participants_event_idx ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS event_participants_user_idx ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS favorites_event_idx ON favorites(event_id);
CREATE INDEX IF NOT EXISTS favorites_user_idx ON favorites(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_user_idx ON activity_logs(user_id);

COMMIT;