import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { Context } from 'hono';
import type { StateData } from '../../types';

// Cache the geojson string so we only build it once per worker instantiation
let cachedGeoJson: string | null = null;

export async function mapDataHandler(c: Context) {
  if (cachedGeoJson) {
    return c.text(cachedGeoJson, 200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    });
  }

  // Define data directory explicitly relative to the CWD
  const dataDir = join(process.cwd(), 'data', 'states');
  
  try {
    const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));
    
    // We will build a raw JSON string to avoid heavy object memory allocation
    let geo = '{"type":"FeatureCollection","features":[';
    let first = true;

    for (const file of files) {
      const content = readFileSync(join(dataDir, file), 'utf-8');
      const stateData: StateData = JSON.parse(content);

      for (const lga of stateData.lgas) {
        for (const f of lga.facilities) {
          if (!f.coordinates) continue;
          
          if (!first) geo += ',';
          first = false;
          
          // Micro-optimized GeoJSON feature
          // t = type
          // n = name
          // s = source
          geo += `{"type":"Feature","geometry":{"type":"Point","coordinates":[${f.coordinates.lng},${f.coordinates.lat}]},"properties":{"t":"${f.type}","n":${JSON.stringify(f.name)},"s":"${f.source}"}}`;
        }
      }
    }
    
    geo += ']}';
    cachedGeoJson = geo;

    return c.text(cachedGeoJson, 200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    });

  } catch (err: any) {
    console.error('Map data generation failed:', err);
    return c.json({ success: false, error: 'Failed to generate map data' }, 500);
  }
}
