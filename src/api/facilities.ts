import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { getFacilities } from '../../lib/db';
import { FACILITY_TYPES } from '../../types';
import type { FacilityType } from '../../types';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '20'), 1), 100);
  const offset = Math.max(parseInt(c.req.query('offset') || '0'), 0);
  const order = c.req.query('order') === 'desc' ? 'desc' as const : 'asc' as const;
  const q = c.req.query('q')?.trim();
  const stateSlug = c.req.query('state')?.trim();
  const lgaSlug = c.req.query('lga')?.trim();
  const typeParam = c.req.query('type')?.trim();
  const sourceParam = c.req.query('source')?.trim();

  if (q && q.length > 100) {
    return c.json({ success: false, error: { message: 'Query too long', code: 'BAD_REQUEST' } }, 400);
  }

  if (typeParam && !(FACILITY_TYPES as readonly string[]).includes(typeParam)) {
    return c.json({
      success: false,
      error: {
        message: `Invalid type "${typeParam}". Valid types: ${FACILITY_TYPES.join(', ')}`,
        code: 'INVALID_TYPE',
      },
    }, 400);
  }

  if (sourceParam && sourceParam !== 'grid3' && sourceParam !== 'community') {
    return c.json({
      success: false,
      error: { message: 'source must be "grid3" or "community"', code: 'INVALID_SOURCE' },
    }, 400);
  }

  const { facilities, total } = await getFacilities(c.env.DB, {
    limit,
    offset,
    order,
    q: q || undefined,
    stateSlug: stateSlug || undefined,
    lgaSlug: lgaSlug || undefined,
    type: (typeParam as FacilityType) || undefined,
    source: (sourceParam as 'grid3' | 'community') || undefined,
  });

  return c.json({
    success: true,
    data: facilities,
    meta: { total, limit, offset },
  });
});

app.get('/:slug', async (c) => {
  const { getFacilityBySlug } = await import('../../lib/db');
  const facility = await getFacilityBySlug(c.env.DB, c.req.param('slug'));
  if (!facility) {
    return c.json({ success: false, error: { message: 'Facility not found', code: 'NOT_FOUND' } }, 404);
  }
  return c.json({ success: true, data: facility });
});

export default app;
