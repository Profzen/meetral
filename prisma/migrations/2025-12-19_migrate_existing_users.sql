-- =========================================
-- Migrer les users existants de auth.users → public.users
-- À exécuter UNE FOIS pour rattraper les users déjà créés
-- =========================================

INSERT INTO public.users (user_id, role, display_name, created_at)
SELECT 
  au.id as user_id,
  COALESCE(au.raw_user_meta_data->>'role_request', 'user') as role,
  au.raw_user_meta_data->>'display_name' as display_name,
  au.created_at
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM public.users)
ON CONFLICT (user_id) DO NOTHING;

-- Vérifier le résultat
SELECT 
  'auth.users' as table_name, 
  COUNT(*) as count 
FROM auth.users
UNION ALL
SELECT 
  'public.users' as table_name, 
  COUNT(*) as count 
FROM public.users;
