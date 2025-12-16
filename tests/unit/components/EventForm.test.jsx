import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventForm from '@/components/events/EventForm';

// Mock the supabase client module used in EventForm
vi.mock('@/lib/supabaseClient', async () => {
  const actual = await vi.importActual('@/lib/supabaseClient');
  return {
    ...actual,
    supabase: {
      ...actual.supabase,
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } } }),
      },
      storage: {
        from: () => ({
          upload: vi.fn().mockResolvedValue({ data: { path: 'events/event.png' } }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/events/event.png' } }),
        }),
      },
    },
  };
});

describe('EventForm', () => {
  test('renders fields and toggles price visibility with is_free', async () => {
    render(<EventForm />);
    const title = screen.getByLabelText(/Titre/i);
    expect(title).toBeInTheDocument();

    const freeCheckbox = screen.getByLabelText(/Gratuit/i);
    expect(freeCheckbox).toBeInTheDocument();

    // Price should not be in DOM initially (default is_free false? In component it's false by default)
    expect(screen.queryByLabelText(/Prix/i)).not.toBeInTheDocument();

    // Toggle free -> price hidden
    await userEvent.click(freeCheckbox);
    expect(screen.queryByLabelText(/Prix/i)).not.toBeInTheDocument();

    // Toggle free off -> price visible
    await userEvent.click(freeCheckbox);
    expect(screen.getByLabelText(/Prix/i)).toBeInTheDocument();
  });

  test('submits create event with valid data (calls fetch)', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ event: { id: 'e1', title: 'Test event' } }),
    });

    render(<EventForm />);
    await userEvent.type(screen.getByLabelText(/Titre/i), 'Test event');
    await userEvent.type(screen.getByLabelText(/Date/i), '2025-12-31');
    await userEvent.type(screen.getByLabelText(/Nombre de places/i), '10');
    // price is visible by default
    await userEvent.type(screen.getByLabelText(/Prix/i), '10');

    const submit = screen.getByRole('button', { name: /Publier/i });
    await userEvent.click(submit);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe('/api/events');
    fetchMock.mockRestore();
  });
});
