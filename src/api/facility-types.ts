import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { FACILITY_TYPES, FACILITY_TYPE_LABELS } from '../../types';
import { getFacilityTypeCounts } from '../../lib/db';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const counts = await getFacilityTypeCounts(c.env.DB);
  const countMap = Object.fromEntries(counts.map((r) => [r.type, r.count]));

  const types = FACILITY_TYPES.map((type) => ({
    type,
    label: FACILITY_TYPE_LABELS[type],
    count: countMap[type] ?? 0,
  }));

  return c.json({ success: true, data: types });
});

export default app;
