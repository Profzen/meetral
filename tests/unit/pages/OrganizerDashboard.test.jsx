import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrganizerDashboard from '@/app/dashboard/organizer/page';
import { vi } from 'vitest';

vi.mock('@/lib/supabaseClient', async () => {
  const actual = await vi.importActual('@/lib/supabaseClient');
  // mock minimal supabase client shape used in OrganizerDashboard
  return {
    ...actual,
    supabase: {
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) },
      from: () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [
          { id: 'ev1', title: 'E1', date: '2025-12-20', place: 'Paris', capacity: 20 },
        ] }),
      }),
    },
  };
});

describe('OrganizerDashboard', () => {
  test('renders events list for organizer', async () => {
    render(<OrganizerDashboard />);
    // Wait for screen to show the event title (after loading false)
    await waitFor(() => expect(screen.getByText('Vos événements')).toBeInTheDocument());
    expect(screen.getByText('E1')).toBeInTheDocument();
  });
});
