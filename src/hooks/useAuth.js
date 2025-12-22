import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    async function fetchUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
          
          // Récupérer le profil depuis public.users
          const { data: profileData, error } = await supabase
            .from('users')
            .select('display_name, phone, role')
            .eq('user_id', session.user.id)
            .single();
          
          if (!error && profileData) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    fetchUser();
    
    return () => {
      mounted = false;
    };
  }, []);

  return { user, profile, loading };
}
