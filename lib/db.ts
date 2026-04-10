import type { State, LGA, Facility, FacilityType } from '../types';

export async function getStates(db: D1Database): Promise<State[]> {
  const { results } = await db.prepare('SELECT * FROM states ORDER BY name').all<State>();
  return results;
}

export async function getStateBySlug(
  db: D1Database,
  slug: string,
  opts: { includeLgas?: boolean } = {}
) {
  const state = await db.prepare('SELECT * FROM states WHERE slug = ?').bind(slug).first<State>();
  if (!state) return null;

  const lgaCount = await db
    .prepare('SELECT COUNT(*) as total FROM lgas WHERE state_id = ?')
    .bind(state.id)
    .first<{ total: number }>();

  const facilityCount = await db
    .prepare(
      `SELECT COUNT(f.id) as total
       FROM facilities f
       JOIN lgas l ON f.lga_id = l.id
       WHERE l.state_id = ?`
    )
    .bind(state.id)
    .first<{ total: number }>();

  const data: State & { lga_count: number; facility_count: number; lgas?: LGA[] } = {
    ...state,
    lga_count: lgaCount?.total ?? 0,
    facility_count: facilityCount?.total ?? 0,
  };

  if (opts.includeLgas) {
    const { results: lgas } = await db
      .prepare('SELECT * FROM lgas WHERE state_id = ? ORDER BY name')
      .bind(state.id)
      .all<LGA>();
    data.lgas = lgas;
  }

  return data;
}

export async function getLGAs(db: D1Database, opts: { stateSlug?: string } = {}) {
  const conditions: string[] = [];
  const bindings: Array<string | number> = [];

  if (opts.stateSlug) {
    conditions.push('s.slug = ?');
    bindings.push(opts.stateSlug);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const { results } = await db
    .prepare(
      `SELECT l.id, l.state_id, l.name, l.slug, l.population, COUNT(f.id) as facility_count,
              CASE
                WHEN l.population > 0 THEN ROUND(COUNT(f.id) * 10000.0 / l.population, 2)
                ELSE NULL
              END as facilities_per_10000
       FROM lgas l
       JOIN states s ON l.state_id = s.id
       LEFT JOIN facilities f ON f.lga_id = l.id
       ${whereClause}
       GROUP BY l.id
       ORDER BY s.name ASC, l.name ASC`
    )
    .bind(...bindings)
    .all();

  return results;
}

export async function getLGABySlug(
  db: D1Database,
  slug: string,
  opts: { includeFacilities?: boolean; type?: FacilityType } = {}
) {
  const lga = await db.prepare('SELECT * FROM lgas WHERE slug = ?').bind(slug).first<LGA>();
  if (!lga) return null;

  const state = await db.prepare('SELECT * FROM states WHERE id = ?').bind(lga.state_id).first<State>();

  const facilityCount = await db
    .prepare('SELECT COUNT(*) as total FROM facilities WHERE lga_id = ?')
    .bind(lga.id)
    .first<{ total: number }>();

  const facilitiesPer10000 =
    lga.population && lga.population > 0
      ? Number(((facilityCount?.total ?? 0) * 10000 / lga.population).toFixed(2))
      : null;

  const data: LGA & {
    state: State | null;
    facility_count: number;
    facilities_per_10000: number | null;
    facilities?: Facility[];
  } = {
    ...lga,
    state: state ?? null,
    facility_count: facilityCount?.total ?? 0,
    facilities_per_10000: facilitiesPer10000,
  };

  if (opts.includeFacilities) {
    const typeFilter = opts.type ? ' AND type = ?' : '';
    const bindings: (string | number)[] = [lga.id];
    if (opts.type) bindings.push(opts.type);

    const { results: facilities } = await db
      .prepare(
        `SELECT id, lga_id, type, name, slug, lat, lng, source, verified, metadata, added_by
         FROM facilities
         WHERE lga_id = ?${typeFilter}
         ORDER BY type ASC, name ASC`
      )
      .bind(...bindings)
      .all<Facility>();
    data.facilities = facilities;
  }

  return data;
}

export async function getFacilities(
  db: D1Database,
  opts: {
    limit: number;
    offset: number;
    order: 'asc' | 'desc';
    q?: string;
    stateSlug?: string;
    lgaSlug?: string;
    type?: FacilityType;
    source?: 'grid3' | 'community';
  }
) {
  const conditions: string[] = [];
  const bindings: Array<string | number> = [];

  if (opts.q) {
    const pattern = `%${opts.q}%`;
    conditions.push('(f.name LIKE ? OR l.name LIKE ? OR s.name LIKE ?)');
    bindings.push(pattern, pattern, pattern);
  }

  if (opts.stateSlug) {
    conditions.push('s.slug = ?');
    bindings.push(opts.stateSlug);
  }

  if (opts.lgaSlug) {
    conditions.push('l.slug = ?');
    bindings.push(opts.lgaSlug);
  }

  if (opts.type) {
    conditions.push('f.type = ?');
    bindings.push(opts.type);
  }

  if (opts.source) {
    conditions.push('f.source = ?');
    bindings.push(opts.source);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db
    .prepare(
      `SELECT COUNT(*) as total
       FROM facilities f
       JOIN lgas l ON f.lga_id = l.id
       JOIN states s ON l.state_id = s.id
       ${whereClause}`
    )
    .bind(...bindings)
    .first<{ total: number }>();

  const total = countResult?.total ?? 0;

  const { results: facilities } = await db
    .prepare(
      `SELECT f.id, f.lga_id, f.type, f.name, f.slug, f.lat, f.lng,
              f.source, f.verified, f.metadata, f.added_by,
              l.name as lga_name, l.slug as lga_slug,
              s.name as state_name, s.slug as state_slug
       FROM facilities f
       JOIN lgas l ON f.lga_id = l.id
       JOIN states s ON l.state_id = s.id
       ${whereClause}
       ORDER BY f.name ${opts.order === 'desc' ? 'DESC' : 'ASC'}
       LIMIT ? OFFSET ?`
    )
    .bind(...bindings, opts.limit, opts.offset)
    .all();

  return { facilities, total };
}

export async function getFacilityBySlug(db: D1Database, slug: string) {
  return db
    .prepare(
      `SELECT f.id, f.lga_id, f.type, f.name, f.slug, f.lat, f.lng,
              f.source, f.verified, f.metadata, f.added_by,
              l.name as lga_name, l.slug as lga_slug,
              s.name as state_name, s.slug as state_slug
       FROM facilities f
       JOIN lgas l ON f.lga_id = l.id
       JOIN states s ON l.state_id = s.id
       WHERE f.slug = ?`
    )
    .bind(slug)
    .first();
}

export async function getFacilityTypeCounts(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT type, COUNT(*) as count
       FROM facilities
       GROUP BY type
       ORDER BY count DESC`
    )
    .all<{ type: string; count: number }>();
  return results;
}

export async function getCoverageSummary(db: D1Database) {
  const { results: stateStats } = await db
    .prepare(
      `SELECT s.slug, s.name,
              COALESCE(fa.facility_count, 0) as facility_count,
              COALESCE(lp.population, 0) as population,
              CASE
                WHEN lp.population > 0 THEN ROUND(COALESCE(fa.facility_count, 0) * 10000.0 / lp.population, 2)
                ELSE NULL
              END as facilities_per_10000,
              COALESCE(fa.lgas_with_data, 0) as lgas_with_data
       FROM states s
       LEFT JOIN (
         SELECT l.state_id,
                COUNT(f.id) as facility_count,
                COUNT(DISTINCT CASE WHEN f.id IS NOT NULL THEN l.id END) as lgas_with_data
         FROM lgas l
         LEFT JOIN facilities f ON f.lga_id = l.id
         GROUP BY l.state_id
       ) fa ON fa.state_id = s.id
       LEFT JOIN (
         SELECT state_id, ROUND(SUM(population), 0) as population
         FROM lgas
         GROUP BY state_id
       ) lp ON lp.state_id = s.id
       ORDER BY facility_count DESC, s.name ASC`
    )
    .all();

  const totalFacilities = await db.prepare('SELECT COUNT(*) as total FROM facilities').first<{ total: number }>();
  const totalStates = await db.prepare('SELECT COUNT(*) as total FROM states').first<{ total: number }>();
  const totalPopulation = await db.prepare('SELECT ROUND(SUM(population), 0) as total FROM lgas').first<{ total: number }>();
  const typeBreakdown = await getFacilityTypeCounts(db);
  const statesWithData = await db
    .prepare(
      `SELECT COUNT(*) as total
       FROM (
         SELECT s.id
         FROM states s
         JOIN lgas l ON l.state_id = s.id
         JOIN facilities f ON f.lga_id = l.id
         GROUP BY s.id
       )`
    )
    .first<{ total: number }>();
  const lgasWithData = await db
    .prepare('SELECT COUNT(DISTINCT lga_id) as total FROM facilities')
    .first<{ total: number }>();

  return {
    total_facilities: totalFacilities?.total ?? 0,
    total_states: totalStates?.total ?? 0,
    total_population: totalPopulation?.total ?? 0,
    states_with_data: statesWithData?.total ?? 0,
    lgas_with_data: lgasWithData?.total ?? 0,
    type_breakdown: typeBreakdown,
    state_stats: stateStats,
  };
}
