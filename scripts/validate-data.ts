import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { StateData } from '../types';
import { FACILITY_TYPES } from '../types';

const dataDir = join(process.cwd(), 'data', 'states');
const files = readdirSync(dataDir).filter((f) => f.endsWith('.json'));

let errors: string[] = [];
const allSlugs = new Set<string>();

function validateSlug(slug: string, context: string) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    errors.push(`${context}: invalid slug "${slug}" (must be lowercase alphanumeric with hyphens)`);
  }
  if (allSlugs.has(slug)) {
    errors.push(`${context}: duplicate slug "${slug}"`);
  }
  allSlugs.add(slug);
}

function validateCoordinates(lat: number, lng: number, context: string) {
  if (lat < 3 || lat > 15) {
    errors.push(`${context}: latitude ${lat} is outside Nigeria's range (3-15)`);
  }
  if (lng < 1 || lng > 16) {
    errors.push(`${context}: longitude ${lng} is outside Nigeria's range (1-16)`);
  }
}

for (const file of files) {
  const filePath = join(dataDir, file);
  const expectedSlug = file.replace('.json', '');

  let data: StateData;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    errors.push(`${file}: invalid JSON`);
    continue;
  }

  if (!data.name) errors.push(`${file}: missing state name`);
  if (!data.slug) errors.push(`${file}: missing state slug`);
  if (data.slug !== expectedSlug) {
    errors.push(`${file}: slug "${data.slug}" doesn't match filename "${expectedSlug}"`);
  }
  validateSlug(data.slug, `${file} (state)`);

  if (!Array.isArray(data.lgas)) {
    errors.push(`${file}: missing or invalid lgas array`);
    continue;
  }

  for (const lga of data.lgas) {
    const lgaContext = `${file} > ${lga.name || 'unnamed LGA'}`;

    if (!lga.name) errors.push(`${lgaContext}: missing LGA name`);
    if (!lga.slug) errors.push(`${lgaContext}: missing LGA slug`);
    validateSlug(lga.slug, lgaContext);

    if (!Array.isArray(lga.facilities)) {
      errors.push(`${lgaContext}: missing or invalid facilities array`);
      continue;
    }

    for (const facility of lga.facilities) {
      const fContext = `${lgaContext} > ${facility.name || 'unnamed facility'}`;

      if (!facility.name) errors.push(`${fContext}: missing name`);
      if (!facility.slug) errors.push(`${fContext}: missing slug`);
      if (!facility.type) errors.push(`${fContext}: missing type`);

      if (facility.type && !(FACILITY_TYPES as readonly string[]).includes(facility.type)) {
        errors.push(`${fContext}: invalid type "${facility.type}"`);
      }

      if (!['grid3', 'community'].includes(facility.source)) {
        errors.push(`${fContext}: invalid source "${facility.source}"`);
      }

      validateSlug(facility.slug, fContext);

      if (facility.coordinates) {
        if (typeof facility.coordinates.lat !== 'number' || typeof facility.coordinates.lng !== 'number') {
          errors.push(`${fContext}: coordinates must be numbers`);
        } else {
          validateCoordinates(facility.coordinates.lat, facility.coordinates.lng, fContext);
        }
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Validation failed with ${errors.length} error(s):\n`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
} else {
  const totalFacilities = files.reduce((acc, file) => {
    const data: StateData = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'));
    return acc + data.lgas.reduce((sum, lga) => sum + lga.facilities.length, 0);
  }, 0);
  console.log(`Validation passed: ${files.length} states, ${totalFacilities.toLocaleString()} facilities.`);
}
