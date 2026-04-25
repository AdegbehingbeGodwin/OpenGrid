import { Hono } from 'hono';
import type { Bindings } from '../../types';
import { STATE_POPULATION } from '../data/state-population';

const app = new Hono<{ Bindings: Bindings }>();

type StateRow = {
  slug: string;
  name: string;
  facility_count: number;
};

type TypeRow = {
  state_slug: string;
  type: string;
  count: number;
};

app.get('/', async (c) => {
  const db = c.env.DB;

  const [statesRes, typesRes] = await Promise.all([
    db.prepare(`
      SELECT s.slug, s.name, COUNT(f.id) as facility_count
      FROM states s
      LEFT JOIN lgas l ON l.state_id = s.id
      LEFT JOIN facilities f ON f.lga_id = l.id
      GROUP BY s.id, s.slug, s.name
      ORDER BY s.name ASC
    `).all<StateRow>(),

    db.prepare(`
      SELECT s.slug as state_slug, f.type, COUNT(f.id) as count
      FROM facilities f
      JOIN lgas l ON f.lga_id = l.id
      JOIN states s ON l.state_id = s.id
      GROUP BY s.slug, f.type
    `).all<TypeRow>(),
  ]);

  /* Build type breakdown lookup: slug → { type: count } */
  const typesByState: Record<string, Record<string, number>> = {};
  for (const row of typesRes.results ?? []) {
    if (!typesByState[row.state_slug]) typesByState[row.state_slug] = {};
    typesByState[row.state_slug][row.type] = row.count;
  }

  const states = (statesRes.results ?? []).map((s) => {
    const population = STATE_POPULATION[s.slug] ?? 0;
    const facilityCount = s.facility_count ?? 0;
    const per10k = population > 0 ? Math.round((facilityCount / population) * 10000 * 10) / 10 : null;

    return {
      slug: s.slug,
      name: s.name,
      population,
      facility_count: facilityCount,
      facilities_per_10k: per10k,
      type_breakdown: typesByState[s.slug] ?? {},
    };
  });

  return c.json({ success: true, data: states });
});

export default app;
