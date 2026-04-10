import type { Context } from 'hono';
import type { Bindings } from '../../types';

type MapFacilityRow = {
  lng: number;
  lat: number;
  type: string;
  name: string;
  source: 'grid3' | 'community';
  lga_slug: string;
  lga_name: string;
  lga_population: number | null;
  state_slug: string;
  state_name: string;
};

export async function mapDataHandler(c: Context<{ Bindings: Bindings }>) {
  let results: MapFacilityRow[] = [];

  try {
    const response = await c.env.DB
      .prepare(
        `SELECT f.lng, f.lat, f.type, f.name, f.source,
                l.slug as lga_slug, l.name as lga_name, l.population as lga_population,
                s.slug as state_slug, s.name as state_name
         FROM facilities f
         JOIN lgas l ON f.lga_id = l.id
         JOIN states s ON l.state_id = s.id
         WHERE f.lat IS NOT NULL AND f.lng IS NOT NULL`
      )
      .all<MapFacilityRow>();

    results = response.results ?? [];
  } catch (error) {
    console.error('Primary map-data query failed, falling back to population-free query.', error);

    const fallback = await c.env.DB
      .prepare(
        `SELECT f.lng, f.lat, f.type, f.name, f.source,
                l.slug as lga_slug, l.name as lga_name,
                NULL as lga_population,
                s.slug as state_slug, s.name as state_name
         FROM facilities f
         JOIN lgas l ON f.lga_id = l.id
         JOIN states s ON l.state_id = s.id
         WHERE f.lat IS NOT NULL AND f.lng IS NOT NULL`
      )
      .all<MapFacilityRow>();

    results = fallback.results ?? [];
  }

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
        ls: facility.lga_slug,
        ln: facility.lga_name,
        lp: facility.lga_population,
        ss: facility.state_slug,
        sn: facility.state_name,
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
