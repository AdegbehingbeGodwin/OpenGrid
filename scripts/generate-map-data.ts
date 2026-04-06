import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('Generating static map-data.json for production...');

const dataDir = join(process.cwd(), 'data', 'states');
const outPath = join(process.cwd(), 'public', 'static', 'map-data.json');

try {
  const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));
  
  let geo = '{"type":"FeatureCollection","features":[';
  let first = true;

  for (const file of files) {
    const content = readFileSync(join(dataDir, file), 'utf-8');
    const stateData = JSON.parse(content);

    for (const lga of stateData.lgas) {
      for (const f of lga.facilities) {
        if (!f.coordinates) continue;
        
        if (!first) geo += ',';
        first = false;
        
        geo += `{"type":"Feature","geometry":{"type":"Point","coordinates":[${f.coordinates.lng},${f.coordinates.lat}]},"properties":{"t":"${f.type}","n":${JSON.stringify(f.name)},"s":"${f.source}"}}`;
      }
    }
  }
  
  geo += ']}';
  
  writeFileSync(outPath, geo);
  console.log(`Successfully wrote ${Buffer.from(geo).length / 1024 / 1024} MB to public/static/map-data.json`);

} catch (err: any) {
  console.error('Map data generation failed:', err);
  process.exit(1);
}
