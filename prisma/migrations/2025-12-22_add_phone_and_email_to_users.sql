-- =========================================
-- Ajouter phone et email aux users
-- Améliorer le trigger pour capturer email
-- =========================================

-- Ajouter la colonne phone si elle n'existe pas
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Ajouter la colonne email si elle n'existe pas
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email TEXT;

-- Créer un index sur phone pour les recherches
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- Mettre à jour le trigger pour capturer email et phone
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (user_id, email, role, display_name, phone, created_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role_request', 'user'),
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      NEW.phone,
      NEW.created_at
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas le signup
    RAISE WARNING 'Error inserting user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifier les users
SELECT user_id, email, display_name, phone, role, created_at FROM public.users LIMIT 5;
