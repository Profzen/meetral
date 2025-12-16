"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('meetral_lang') || 'fr') : 'fr');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data?.session?.user || null);
      // If we have a user, try to fetch language from users table
      if (data?.session?.user?.id) {
        try {
          const { data: u } = await supabase.from('users').select('lang').eq('user_id', data.session.user.id).single();
          if (u?.lang) {
            setLanguage(u.lang);
            try { localStorage.setItem('meetral_lang', u.lang); } catch (e) { }
          }
        } catch (e) {
          // no lang present - keep local storage fallback
        }
      }
    })();
    const { subscription } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!sess) setUser(null);
      else setUser(sess.user);
    });
    return () => { mounted = false; subscription?.unsubscribe(); };
  }, []);

  return <UserContext.Provider value={{ user, language, setLanguage }}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
