/**
 * Syncs JSON data files to Cloudflare D1 (OpenGrid version).
 *
 * Uses upserts so only changed rows are written. Stale rows whose slugs no
 * longer appear in the JSON source are deleted at the end, child-first.
 *
 * Required env vars:
 *   CLOUDFLARE_API_TOKEN
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_DATABASE_ID
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { StateData } from '../types';

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID;

if (!API_TOKEN || !ACCOUNT_ID || !DATABASE_ID) {
  console.error('Missing required env vars: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID');
  process.exit(1);
}

const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}`;

async function execSQL(sql: string, params: unknown[] = []) {
  const res = await fetch(`${BASE_URL}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<{
    result?: Array<{ results?: Array<Record<string, unknown>> }>;
  }>;
}

async function execBatch(statements: { sql: string; params?: unknown[] }[]) {
  const res = await fetch(`${BASE_URL}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ batch: statements }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 API error (${res.status}): ${text}`);
  }

  return res.json();
}

async function execBatchWithRetry(statements: { sql: string; params?: unknown[] }[], retries = 3): Promise<unknown> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await execBatch(statements);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

async function runBatched(statements: { sql: string; params?: unknown[] }[], batchSize: number) {
  for (let i = 0; i < statements.length; i += batchSize) {
    const chunk = statements.slice(i, i + batchSize);
    await execBatchWithRetry(chunk);
    if (i % 500 === 0 && i > 0) {
      process.stdout.write(` [${i.toLocaleString()} done]`);
    }
  }
}

async function deleteStale(table: string, validSlugs: string[]) {
  const current = await execSQL(`SELECT slug FROM ${table}`);
  const rows = current.result?.[0]?.results ?? [];
  const currentSlugs = rows
    .map((row) => row.slug)
    .filter((slug): slug is string => typeof slug === 'string');

  const validSet = new Set(validSlugs);
  const staleSlugs = currentSlugs.filter((slug) => !validSet.has(slug));

  if (staleSlugs.length === 0) return;

  const deleteStmts: { sql: string; params?: unknown[] }[] = [];
  for (let i = 0; i < staleSlugs.length; i += 50) {
    const chunk = staleSlugs.slice(i, i + 50);
    deleteStmts.push({
      sql: `DELETE FROM ${table} WHERE slug IN (${chunk.map(() => '?').join(', ')})`,
      params: chunk,
    });
  }

  await runBatched(deleteStmts, 25);
}

async function main() {
  const dataDir = join(process.cwd(), 'data', 'states');
  const files = readdirSync(dataDir).filter((f) => f.endsWith('.json'));

  const allStates: StateData[] = files.map((f) =>
    JSON.parse(readFileSync(join(dataDir, f), 'utf-8'))
  );

  const stateSlugs: string[] = [];
  const lgaSlugs: string[] = [];
  const facilitySlugs: string[] = [];

  for (const state of allStates) {
    stateSlugs.push(state.slug);
    for (const lga of state.lgas) {
      lgaSlugs.push(lga.slug);
      for (const facility of lga.facilities) {
        facilitySlugs.push(facility.slug);
      }
    }
  }

  console.log(`Syncing ${allStates.length} states to D1...`);
  console.log(`  States: ${stateSlugs.length}, LGAs: ${lgaSlugs.length}, Facilities: ${facilitySlugs.length.toLocaleString()}`);

  // Upsert states
  console.log('\nUpserting states...');
  const stateStmts = allStates.map((s) => ({
    sql: `INSERT INTO states (name, slug) VALUES (?, ?)
          ON CONFLICT(slug) DO UPDATE SET name = excluded.name`,
    params: [s.name, s.slug],
  }));
  await runBatched(stateStmts, 50);
  console.log(`  ✓ ${stateStmts.length} states`);

  // Upsert LGAs
  console.log('Upserting LGAs...');
  const lgaStmts: { sql: string; params: unknown[] }[] = [];
  for (const state of allStates) {
    for (const lga of state.lgas) {
      lgaStmts.push({
        sql: `INSERT INTO lgas (state_id, name, slug) VALUES ((SELECT id FROM states WHERE slug = ?), ?, ?)
              ON CONFLICT(slug) DO UPDATE SET name = excluded.name, state_id = excluded.state_id`,
        params: [state.slug, lga.name, lga.slug],
      });
    }
  }
  await runBatched(lgaStmts, 50);
  console.log(`  ✓ ${lgaStmts.length} LGAs`);

  // Upsert facilities
  console.log('Upserting facilities...');
  const facilityStmts: { sql: string; params: unknown[] }[] = [];
  for (const state of allStates) {
    for (const lga of state.lgas) {
      for (const facility of lga.facilities) {
        facilityStmts.push({
          sql: `INSERT INTO facilities (lga_id, type, name, slug, lat, lng, source, verified, metadata, added_by)
                VALUES ((SELECT id FROM lgas WHERE slug = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(slug) DO UPDATE SET
                  name = excluded.name,
                  type = excluded.type,
                  lga_id = excluded.lga_id,
                  lat = excluded.lat,
                  lng = excluded.lng,
                  source = excluded.source,
                  verified = excluded.verified,
                  metadata = excluded.metadata,
                  added_by = excluded.added_by`,
          params: [
            lga.slug,
            facility.type,
            facility.name,
            facility.slug,
            facility.coordinates?.lat ?? null,
            facility.coordinates?.lng ?? null,
            facility.source,
            facility.verified ? 1 : 0,
            facility.metadata ? JSON.stringify(facility.metadata) : null,
            facility.added_by ?? null,
          ],
        });
      }
    }
  }
  process.stdout.write(`  Upserting ${facilityStmts.length.toLocaleString()} facilities...`);
  await runBatched(facilityStmts, 50);
  console.log(`\n  ✓ ${facilityStmts.length.toLocaleString()} facilities`);

  // Delete stale rows
  console.log('\nRemoving stale rows...');
  await deleteStale('facilities', facilitySlugs);
  await deleteStale('lgas', lgaSlugs);
  await deleteStale('states', stateSlugs);
  console.log('  ✓ Stale rows removed');

  console.log(`\nSync complete!`);
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
