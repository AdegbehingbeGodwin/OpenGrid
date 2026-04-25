import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';
import type { Bindings } from '../types';
import { renderer } from './renderer';
import statesApi from './api/states';
import lgasApi from './api/lgas';
import facilitiesApi from './api/facilities';
import facilityTypesApi from './api/facility-types';
import contributeApi from './api/contribute';
import coverageApi from './api/coverage';
import stateStatsApi from './api/state-stats';
import { HomePage } from './pages/home';
import { DocsPage } from './pages/docs';
import { ContributePage } from './pages/contribute';
import { MapPage } from './pages/map';
import { NotFoundPage } from './pages/not-found';
import { mapDataHandler } from './api/map-data';

const app = new Hono<{ Bindings: Bindings }>();

// API middleware
app.use('/api/*', cors());
app.use('/api/states/*', cache({ cacheName: 'opengrid', cacheControl: 'public, max-age=3600' }));
app.use('/api/lgas/*', cache({ cacheName: 'opengrid', cacheControl: 'public, max-age=3600' }));
app.use('/api/facilities', cache({ cacheName: 'opengrid', cacheControl: 'public, max-age=300' }));
app.use('/api/types', cache({ cacheName: 'opengrid', cacheControl: 'public, max-age=3600' }));
app.use('/api/coverage', cache({ cacheName: 'opengrid', cacheControl: 'public, max-age=300' }));
app.use('/api/state-stats', cache({ cacheName: 'opengrid', cacheControl: 'public, max-age=3600' }));

// API index
app.get('/api', (c) => {
  return c.json({
    name: 'OpenGrid',
    description: 'An open directory and API for public facilities across Nigeria',
    version: '1.0.0',
    endpoints: {
      states: '/api/states',
      state: '/api/states/:slug',
      lgas: '/api/lgas?state=:slug',
      lga: '/api/lgas/:slug',
      facilities: '/api/facilities?type=school&state=lagos&limit=20&offset=0',
      facility: '/api/facilities/:slug',
      types: '/api/types',
      coverage: '/api/coverage',
      state_stats: '/api/state-stats',
      contribute: 'POST /api/contribute',
    },
    docs: '/docs',
    github: 'https://github.com/AdegbehingbeGodwin/OpenGrid',
  });
});

// API routes
app.route('/api/states', statesApi);
app.route('/api/lgas', lgasApi);
app.route('/api/facilities', facilitiesApi);
app.route('/api/types', facilityTypesApi);
app.route('/api/coverage', coverageApi);
app.route('/api/state-stats', stateStatsApi);
app.route('/api/contribute', contributeApi);
app.get('/api/map-data', mapDataHandler);

// Pages
app.use('*', renderer);

app.get('/', async (c) => {
  const db = c.env.DB;

  const stateStats = await db
    .prepare(`
      SELECT s.slug, s.name, COUNT(f.id) as facility_count,
             COUNT(DISTINCT l.id) as lgas_with_data
      FROM states s
      LEFT JOIN lgas l ON l.state_id = s.id
      LEFT JOIN facilities f ON f.lga_id = l.id
      GROUP BY s.id
      ORDER BY facility_count DESC
    `)
    .all<{ slug: string; name: string; facility_count: number; lgas_with_data: number }>();

  const totalFacilities = await db.prepare('SELECT COUNT(*) as c FROM facilities').first<{ c: number }>();
  const totalStates = stateStats.results?.length ?? 37;
  const statesWithData = stateStats.results?.filter((s) => s.facility_count > 0).length ?? 0;
  const totalLgasWithData = await db
    .prepare('SELECT COUNT(DISTINCT lga_id) as c FROM facilities')
    .first<{ c: number }>();

  const typeBreakdown = await db
    .prepare('SELECT type, COUNT(*) as count FROM facilities GROUP BY type ORDER BY count DESC')
    .all<{ type: string; count: number }>();

  return c.render(
    <HomePage
      stateStats={stateStats.results ?? []}
      totalFacilities={totalFacilities?.c ?? 0}
      totalStates={totalStates}
      statesWithData={statesWithData}
      lgasWithData={totalLgasWithData?.c ?? 0}
      typeBreakdown={typeBreakdown.results ?? []}
    />,
    { title: 'OpenGrid — Nigeria Facilities API' }
  );
});

app.get('/docs', (c) => {
  if (c.env.DOCS_URL) {
    return c.redirect(c.env.DOCS_URL, 302);
  }
  return c.render(<DocsPage />, { title: 'Docs — OpenGrid' });
});

app.get('/contribute', (c) => {
  return c.render(<ContributePage />, { title: 'Contribute — OpenGrid' });
});

app.get('/map', (c) => {
  return c.render(<MapPage />, { title: 'Map Dashboard — OpenGrid' });
});

app.notFound((c) => {
  return c.render(<NotFoundPage />, { title: '404 — OpenGrid' });
});

export default app;
