// src/app/layout.jsx
import '../styles/globals.css';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

export const metadata = {
  title: 'Meetral — Trouve et crée des événements',
  description: 'Meetral — découvrir et organiser des événements locaux',
};

export default function RootLayout({ children }) {
  return ( 
    <html lang="fr">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

