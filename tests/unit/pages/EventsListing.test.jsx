import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import EventsListingPage from '@/app/events/listing/page';
import { vi } from 'vitest';

describe('EventsListingPage', () => {
  test('fetches and displays events', async () => {
    const sample = { events: [{ id: 'evx', title: 'Sample event', date: '2025-12-24', place: 'Test' }] };
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => sample });
    render(<EventsListingPage />);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/events'));
    expect(await screen.findByText('Sample event')).toBeInTheDocument();
    fetchSpy.mockRestore();
  });
});
