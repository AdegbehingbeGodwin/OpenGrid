import type { Context } from 'hono';
import type { Bindings } from '../../types';

export async function mapDataHandler(c: Context<{ Bindings: Bindings }>) {
  const assetRequest = new Request(new URL('/static/map-data.json', c.req.url).toString(), {
    headers: c.req.raw.headers,
  });

  const response = await c.env.STATIC_ASSETS.fetch(assetRequest);

  if (!response.ok) {
    return c.json(
      { success: false, error: { message: 'Map data not found', code: 'NOT_FOUND' } },
      404
    );
  }

  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json; charset=UTF-8');
  headers.set('cache-control', 'public, max-age=3600');

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
