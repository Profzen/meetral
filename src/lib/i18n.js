// Minimal i18n helper for Meetral
import { useContext } from 'react';
import { useUser } from '@/context/UserContext';

const translations = {
  fr: {
    events: 'Événements',
    dashboard: 'Mon dashboard',
    login: 'Connexion',
    profile: 'Mon profil',
    see_more: 'Voir plus',
    back_to_events: '← Retour aux événements',
    register: "S'inscrire",
    you_are_registered: '✓ Vous êtes inscrit!',
    event_full: 'Événement complet',
    edit_profile: "Modifier mon profil",
    my_tickets: 'Mes billets',
    my_participations: 'Mes participations',
    manage_my_events: 'Gérer mes événements',
    request_organizer: "Demander rôle organisateur",
    logout: "Se déconnecter",
    site_lang: 'Langue du site',
    reset_password: "Réinitialiser le mot de passe",
  },
  en: {
    events: 'Events',
    dashboard: 'My dashboard',
    login: 'Sign in',
    profile: 'My profile',
    see_more: 'See more',
    back_to_events: '← Back to events',
    register: 'Register',
    you_are_registered: '✓ You are registered!',
    event_full: 'Event full',
    edit_profile: 'Edit my profile',
    my_tickets: 'My tickets',
    my_participations: 'My participations',
    manage_my_events: 'Manage my events',
    request_organizer: 'Request organizer role',
    logout: 'Log out',
    site_lang: 'Site language',
    reset_password: 'Reset password',
  }
};

export function useTranslation() {
  const { language } = useUser() ?? { language: 'fr' };
  const lang = language || 'fr';
  function t(key) {
    return translations[lang]?.[key] ?? translations['fr'][key] ?? key;
  }
  return { t, lang };
}

export default translations;
