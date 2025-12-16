import { describe, it, expect, vi } from 'vitest';

// We'll import the GET function from the events route and mock supabaseAdmin
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: () => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
    }),
  },
}));

import * as eventsRoute from '@/server/api/events/route';

describe('GET /api/events route', () => {
  it('returns sample events if the DB returns empty', async () => {
    const res = await eventsRoute.GET(new Request('http://localhost/api/events'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.events.length).toBeGreaterThan(0);
  });
});
