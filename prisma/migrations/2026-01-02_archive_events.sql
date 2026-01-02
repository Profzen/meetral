-- Archive des événements passés sans casser le schéma existant
-- 1) Crée une table d'archive identique à events
-- 2) Ajoute un index sur la date pour les stats
-- 3) Ajoute une fonction d'archivage tolérante aux contraintes FK (ne casse rien en cas d'échec)

-- Table d'archive (copie le schéma complet de events)
CREATE TABLE IF NOT EXISTS events_archive (LIKE events INCLUDING ALL);

-- Index pour les requêtes temporelles
CREATE INDEX IF NOT EXISTS events_archive_date_idx ON events_archive(date);

-- Fonction d'archivage : copie puis tente de supprimer les événements passés
CREATE OR REPLACE FUNCTION archive_past_events()
RETURNS void AS $$
BEGIN
  -- Copier les événements déjà passés absents de l'archive
  INSERT INTO events_archive
  SELECT *
  FROM events e
  WHERE e.date < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM events_archive a WHERE a.id = e.id
    );

  -- Tenter de supprimer les événements archivés
  BEGIN
    DELETE FROM events e
    WHERE e.date < CURRENT_DATE
      AND EXISTS (
        SELECT 1 FROM events_archive a WHERE a.id = e.id
      );
  EXCEPTION WHEN foreign_key_violation THEN
    -- Si une contrainte FK empêche la suppression, on n'échoue pas :
    -- l'événement reste en base, mais il est déjà copié dans l'archive.
    RAISE NOTICE 'Suppression évènement bloquée par une contrainte FK, évènement conservé dans events.';
  END;
END;
$$ LANGUAGE plpgsql;

-- Note : planifier l'appel de archive_past_events() via pg_cron / Supabase scheduler (quotidien)