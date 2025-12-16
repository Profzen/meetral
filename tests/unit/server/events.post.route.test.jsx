import { describe, it, expect, vi } from 'vitest';

// Mock supabaseAdmin to simulate auth.getUser and insert behavior
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'organisateur', user_id: 'u1' } }),
      insert: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      // return the inserted event
      select: vi.fn().mockResolvedValue({ data: [{ id: 'ev1', title: 'Created' }] }),
      single: vi.fn().mockResolvedValue({ data: { id: 'ev1', title: 'Created' } }),
    }),
  },
}));

import * as eventsRoute from '@/server/api/events/route';

describe('POST /api/events route', () => {
  it('creates an event for an organizer', async () => {
    const payload = { title: 'T', date: '2025-12-12', place: 'X', price: 0, capacity: 10 };
    const req = new Request('http://localhost/api/events', { method: 'POST', headers: { Authorization: 'Bearer token' }, body: JSON.stringify(payload) });
    const res = await eventsRoute.POST(req);
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.event).toBeDefined();
  });
});
