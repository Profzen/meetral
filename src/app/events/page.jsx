// src/app/events/page.jsx
import { redirect } from 'next/navigation';

export default function EventsPage() {
  // Redirection vers la page de listing
  redirect('/events/listing');
}
