-- =========================================
-- Trigger: Créer automatiquement un user dans public.users
-- quand un user s'inscrit via Supabase Auth
-- =========================================

-- Fonction trigger qui insère dans public.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Récupérer role_request et display_name depuis raw_user_meta_data
  INSERT INTO public.users (user_id, role, display_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role_request', 'user'),
    NEW.raw_user_meta_data->>'display_name',
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur auth.users (événement INSERT)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- Note: Si un user existe déjà dans public.users avec cet ID,
-- le trigger échouera (constraint violation). 
-- Pour corriger les users existants, exécute:
-- =========================================
-- INSERT INTO public.users (user_id, role, display_name, created_at)
-- SELECT 
--   id, 
--   COALESCE(raw_user_meta_data->>'role_request', 'user') as role,
--   raw_user_meta_data->>'display_name' as display_name,
--   created_at
-- FROM auth.users
-- WHERE id NOT IN (SELECT user_id FROM public.users)
-- ON CONFLICT (user_id) DO NOTHING;
