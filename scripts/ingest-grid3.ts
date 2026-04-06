/**
 * OpenGrid Grid3 CSV Ingest Script
 *
 * Reads all Grid3 CSV files, normalises field names per facility type,
 * and merges into the per-state JSON files in data/states/.
 *
 * Existing facilities with source='community' are preserved.
 * Grid3 facilities are fully replaced on each run.
 *
 * Usage: npm run ingest
 */

import { createReadStream, readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';
import type { StateData, LGAData, FacilityData, FacilityType } from '../types';

const DATA_DIR = join(process.cwd(), 'data', 'states');

// ─── CSV → Facility type mapping ─────────────────────────────────────────────

interface CsvConfig {
  file: string;
  type: FacilityType;
  nameField: string;
  stateField: string;
  lgaField: string;
  latField: string;
  lngField: string;
  metadataFields?: string[];
}

const CSV_CONFIGS: CsvConfig[] = [
  {
    file: 'grid3/Markets_in_Nigeria_8237200773111699054.csv',
    type: 'market',
    nameField: 'market_nam',
    stateField: 'statename',
    lgaField: 'lganame',
    latField: 'y',
    lngField: 'x',
    metadataFields: ['mrkt_type', 'mrkt_frqcy', 'mrkt_days'],
  },
  {
    file: 'grid3/GRID3_NGA_health_facilities_v2_0_3768559736750290399.csv',
    type: 'health_facility',
    nameField: 'facility_name',
    stateField: 'state',
    lgaField: 'lga',
    latField: 'latitude',
    lngField: 'longitude',
    metadataFields: ['facility_level', 'facility_level_option', 'ownership', 'ownership_type'],
  },
  {
    file: 'grid3/Schools_in_Nigeria_4350877279695829240.csv',
    type: 'school',
    nameField: 'name',
    stateField: 'statename',
    lgaField: 'lganame',
    latField: 'y',
    lngField: 'x',
    metadataFields: ['category', 'management', 'education', 'subtype'],
  },
  {
    file: 'grid3/GRID3_NGA_Government_Buildings_5762285103048400725.csv',
    type: 'government_building',
    nameField: 'poi_name',
    stateField: 'statename',
    lgaField: 'lganame',
    latField: 'y',
    lngField: 'x',
    metadataFields: ['category'],
  },
  {
    file: 'grid3/GRID3_NGA_Police_Stations_-7868985337605458759.csv',
    type: 'police_station',
    nameField: 'plc_st_nam',
    stateField: 'statename',
    lgaField: 'lganame',
    latField: 'y',
    lngField: 'x',
  },
  {
    file: 'grid3/GRID3_NGA_Fire_Stations_-8227812090643857916.csv',
    type: 'fire_station',
    nameField: 'poi_file_n',
    stateField: 'state_name',
    lgaField: 'lga_name',
    latField: 'latitude',
    lngField: 'longitude',
  },
  {
    file: 'grid3/GRID3_NGA_Post_Offices_-4519163771452536831.csv',
    type: 'post_office',
    nameField: 'postoffc_n',
    stateField: 'statename',
    lgaField: 'lganame',
    latField: 'y',
    lngField: 'x',
  },
  {
    file: 'grid3/IDP_sites_in_Nigeria_1002280074927442464.csv',
    type: 'idp_site',
    nameField: 'site_name',
    stateField: 'statename',
    lgaField: 'lganame',
    latField: 'y',
    lngField: 'x',
    metadataFields: ['site_type', 'site_statu', 'total_pop'],
  },
  {
    file: 'grid3/Churches_in_Nigeria_-1734362325775030501.csv',
    type: 'church',
    nameField: 'name',
    stateField: 'statename',
    lgaField: 'lganame',
    latField: 'y',
    lngField: 'x',
  },
  {
    file: 'grid3/Mosques_in_Nigeria_6609239168743695382.csv',
    type: 'mosque',
    nameField: 'name',
    stateField: 'statename',
    lgaField: 'lganame',
    latField: 'y',
    lngField: 'x',
  },
  {
    file: 'grid3/Water_points_in_Nigeria_-5822932318649382909.csv',
    type: 'water_point',
    nameField: 'name',
    stateField: 'statename',
    lgaField: 'lganame',
    latField: 'y',
    lngField: 'x',
    metadataFields: ['water_typ'],
  },
  {
    file: 'grid3/Farms_in_Nigeria_-118746013669857057.csv',
    type: 'farm',
    nameField: 'poi_name',
    stateField: 'statename',
    lgaField: 'lganame',
    latField: 'y',
    lngField: 'x',
    metadataFields: ['farm_ctgry', 'farm_type'],
  },
  {
    file: 'grid3/Factories_and_industrial_sites_in_Nigeria_-2376841027209567817.csv',
    type: 'factory',
    nameField: 'fctry_st_n',
    stateField: 'statename',
    lgaField: 'lganame',
    latField: 'y',
    lngField: 'x',
    metadataFields: ['fctry_st_s'],
  },
  {
    file: 'grid3/Energy_and_electricity_substations_in_Nigeria_3706089383384116443.csv',
    type: 'energy_substation',
    nameField: 'ecity_nam',
    stateField: 'statename',
    lgaField: 'lganame',
    latField: 'y',
    lngField: 'x',
  },
  {
    file: 'grid3/filling_stations.csv',
    type: 'filling_station',
    nameField: 'poi_name',
    stateField: 'statename',
    lgaField: 'lganame',
    latField: 'y',
    lngField: 'x',
  },
];

// ─── Utility helpers ──────────────────────────────────────────────────────────

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeStateName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeLgaName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isInNigeria(lat: number, lng: number): boolean {
  return lat >= 3 && lat <= 15 && lng >= 1 && lng <= 16;
}

const slugCounter = new Map<string, number>();
function uniqueSlug(base: string): string {
  const count = (slugCounter.get(base) ?? 0) + 1;
  slugCounter.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
}

// ─── CSV Reader ───────────────────────────────────────────────────────────────

async function readCsv(filePath: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    let headers: string[] = [];
    const rl = createInterface({ input: createReadStream(filePath, { encoding: 'utf8' }) });

    rl.on('line', (line) => {
      if (headers.length === 0) {
        // Strip BOM from first field
        headers = parseCsvLine(line).map((h) => h.replace(/^\uFEFF/, '').trim());
        return;
      }
      const values = parseCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim(); });
      rows.push(row);
    });

    rl.on('close', () => resolve(rows));
    rl.on('error', reject);
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Load existing state files ────────────────────────────────────────────────

function loadStateFiles(): Map<string, StateData> {
  const map = new Map<string, StateData>();
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const data: StateData = JSON.parse(readFileSync(join(DATA_DIR, f), 'utf-8'));
    map.set(data.slug, data);
  }
  return map;
}

// Build a normalised state-name → state-slug lookup from existing JSON files
function buildStateLookup(stateFiles: Map<string, StateData>): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const [slug, data] of stateFiles) {
    lookup.set(normalizeStateName(data.name), slug);
    lookup.set(normalizeStateName(slug), slug);
  }
  return lookup;
}

// Build normalised lga-name → lga-slug lookup per state
function buildLgaLookup(stateData: StateData): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const lga of stateData.lgas) {
    lookup.set(normalizeLgaName(lga.name), lga.slug);
    lookup.set(normalizeLgaName(lga.slug), lga.slug);
  }
  return lookup;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Loading existing state files...');
  const stateFiles = loadStateFiles();
  const stateLookup = buildStateLookup(stateFiles);

  console.log(`Found ${stateFiles.size} state files.\n`);

  // Strip all existing grid3 facilities before re-ingesting.
  // Also migrate old-format state files (markets[] → facilities[])
  for (const [, stateData] of stateFiles) {
    for (const lga of stateData.lgas) {
      // Handle old format: lga may have `markets` but not `facilities`
      if (!Array.isArray((lga as unknown as Record<string, unknown>).facilities)) {
        const oldMarkets = ((lga as unknown as Record<string, unknown>).markets as unknown[]) ?? [];
        lga.facilities = (oldMarkets as Array<Record<string, unknown>>)
          .filter((m) => m.source === 'community') // preserve only community-sourced old markets
          .map((m) => ({
            type: 'market' as const,
            name: String(m.name ?? ''),
            slug: String(m.slug ?? ''),
            coordinates: m.coordinates as { lat: number; lng: number } | undefined,
            source: 'community' as const,
            verified: false,
            added_by: m.added_by as string | undefined,
          }));
      } else {
        // Already new format: just strip grid3 entries for re-ingest
        lga.facilities = lga.facilities.filter((f) => f.source !== 'grid3');
      }
    }
  }


  let totalIngested = 0;
  let totalSkipped = 0;

  for (const config of CSV_CONFIGS) {
    const filePath = join(process.cwd(), config.file);
    if (!existsSync(filePath)) {
      console.warn(`  [SKIP] File not found: ${config.file}`);
      continue;
    }

    console.log(`Processing ${config.type} from ${config.file.split('/').pop()}...`);
    const rows = await readCsv(filePath);

    let ingested = 0;
    let skipped = 0;

    for (const row of rows) {
      const stateName = row[config.stateField]?.trim();
      const lgaName = row[config.lgaField]?.trim();
      const rawName = row[config.nameField]?.trim();
      const lat = parseFloat(row[config.latField]);
      const lng = parseFloat(row[config.lngField]);

      if (!stateName || !lgaName || !rawName) { skipped++; continue; }
      if (!isFinite(lat) || !isFinite(lng) || !isInNigeria(lat, lng)) { skipped++; continue; }

      const stateSlug = stateLookup.get(normalizeStateName(stateName));
      if (!stateSlug) { skipped++; continue; }

      const stateData = stateFiles.get(stateSlug)!;
      const lgaLookup = buildLgaLookup(stateData);
      const lgaSlug = lgaLookup.get(normalizeLgaName(lgaName));
      if (!lgaSlug) { skipped++; continue; }

      const lgaEntry = stateData.lgas.find((l) => l.slug === lgaSlug)!;

      const nameSlug = slugify(rawName);
      if (!nameSlug) { skipped++; continue; }

      const slug = uniqueSlug(`${nameSlug}-${config.type.replace(/_/g, '-')}`);

      const facility: FacilityData = {
        type: config.type,
        name: rawName,
        slug,
        coordinates: { lat, lng },
        source: 'grid3',
        verified: true,
      };

      if (config.metadataFields && config.metadataFields.length > 0) {
        const meta: Record<string, string> = {};
        for (const field of config.metadataFields) {
          const val = row[field]?.trim();
          if (val) meta[field] = val;
        }
        if (Object.keys(meta).length > 0) {
          facility.metadata = meta;
        }
      }

      lgaEntry.facilities.push(facility);
      ingested++;
    }

    console.log(`  ✓ ${ingested.toLocaleString()} ingested, ${skipped.toLocaleString()} skipped`);
    totalIngested += ingested;
    totalSkipped += skipped;
  }

  // Write updated state files
  console.log('\nWriting state files...');
  for (const [slug, stateData] of stateFiles) {
    const filePath = join(DATA_DIR, `${slug}.json`);
    writeFileSync(filePath, JSON.stringify(stateData, null, 2) + '\n', 'utf-8');
  }

  console.log(`\nDone!`);
  console.log(`  Total ingested: ${totalIngested.toLocaleString()}`);
  console.log(`  Total skipped:  ${totalSkipped.toLocaleString()}`);
  console.log(`  State files written: ${stateFiles.size}`);
}

main().catch((err) => {
  console.error('Ingest failed:', err);
  process.exit(1);
});
