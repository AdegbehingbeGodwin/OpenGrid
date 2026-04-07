import type { Context } from 'hono';
import type { Bindings } from '../../types';

export async function mapDataHandler(c: Context<{ Bindings: Bindings }>) {
  const { results } = await c.env.DB
    .prepare(
      `SELECT lng, lat, type, name, source
       FROM facilities
       WHERE lat IS NOT NULL AND lng IS NOT NULL`
    )
    .all<{ lng: number; lat: number; type: string; name: string; source: 'grid3' | 'community' }>();

  const body = JSON.stringify({
    type: 'FeatureCollection',
    features: (results ?? []).map((facility) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [facility.lng, facility.lat],
      },
      properties: {
        t: facility.type,
        n: facility.name,
        s: facility.source,
      },
    })),
  });

  const headers = new Headers();
  headers.set('content-type', 'application/json; charset=UTF-8');
  headers.set('cache-control', 'public, max-age=3600');

  return new Response(body, {
    status: 200,
    headers,
  });
}
