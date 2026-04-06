# OpenGrid — Nigeria Facilities API

An open directory and free API for public facilities across all 36 states of Nigeria and the FCT.

**Data is seeded from [Grid3](https://grid3.org/) and community-driven** — anyone can contribute via pull request or the web form.

## API

Base URL: `https://opengrid.pages.dev/api`

No authentication required. All responses are JSON.

### Examples

```bash
# Get all schools in Kano
curl "https://opengrid.pages.dev/api/facilities?type=school&state=kano&limit=10"

# Get health facilities in Ikeja LGA
curl "https://opengrid.pages.dev/api/facilities?type=health_facility&lga=ikeja-ikeja"

# List all facility types with counts
curl "https://opengrid.pages.dev/api/types"

# Search for a specific facility
curl "https://opengrid.pages.dev/api/facilities?q=general+hospital&state=lagos"
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/facilities` | List facilities (filter by `type`, `state`, `lga`, `q`, `source`) |
| GET | `/api/facilities/:slug` | Get a single facility |
| GET | `/api/types` | List all facility types with counts |
| GET | `/api/states` | List all states |
| GET | `/api/states/:slug` | Get state with LGA list |
| GET | `/api/lgas` | List LGAs (filter by `state`) |
| GET | `/api/lgas/:slug` | Get LGA |
| GET | `/api/coverage` | Coverage summary by state and type |
| POST | `/api/contribute` | Submit a new facility |

### Facility Types

| Type | Description |
|------|-------------|
| `market` | Markets |
| `health_facility` | Hospitals, clinics, PHCs |
| `school` | Primary and secondary schools |
| `government_building` | Federal, state, local government offices |
| `police_station` | Police stations |
| `fire_station` | Fire stations |
| `post_office` | Post offices |
| `idp_site` | Internally Displaced Persons sites |
| `church` | Churches |
| `mosque` | Mosques |
| `water_point` | Boreholes, wells, water points |
| `farm` | Farms |
| `factory` | Factories and industrial sites |
| `energy_substation` | Electricity substations |
| `filling_station` | Fuel filling stations |

### Query Parameters for `/api/facilities`

| Param | Description | Example |
|-------|-------------|---------|
| `type` | Facility type | `type=school` |
| `state` | State slug | `state=lagos` |
| `lga` | LGA slug | `lga=ikeja-ikeja` |
| `q` | Search query | `q=general+hospital` |
| `source` | `grid3` or `community` | `source=community` |
| `limit` | Results per page (max 100) | `limit=20` |
| `offset` | Pagination offset | `offset=40` |
| `order` | `asc` or `desc` | `order=desc` |

## Contributing Facilities

### Option 1: Pull Request (preferred)

1. Fork this repository
2. Open the state file at `data/states/<state-slug>.json`
3. Find the correct LGA and add a facility to its `facilities` array:

```json
{
  "type": "school",
  "name": "Government Secondary School Ikeja",
  "slug": "government-secondary-school-ikeja-school",
  "coordinates": { "lat": 6.6018, "lng": 3.3515 },
  "source": "community",
  "verified": false,
  "added_by": "your-github-username"
}
```

4. Submit a pull request — CI will validate your data automatically

### Option 2: Web Form

Visit the [contribute page](https://opengrid.pages.dev/contribute) to submit via a form. The form automatically creates a pull request.

## Data Structure

All facility data lives in `data/states/` as JSON files (one per state). This is the source of truth.

```
data/states/
├── abia.json
├── adamawa.json
├── ...
├── lagos.json
└── zamfara.json
```

Each file:

```json
{
  "name": "Lagos",
  "slug": "lagos",
  "lgas": [
    {
      "name": "Lagos Island",
      "slug": "lagos-lagos-island",
      "facilities": [
        {
          "type": "market",
          "name": "Balogun Market",
          "slug": "balogun-market-market",
          "coordinates": { "lat": 6.4541, "lng": 3.3947 },
          "source": "grid3",
          "verified": true
        }
      ]
    }
  ]
}
```

## Development

```bash
npm install
npm run dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Build for production |
| `npm run deploy` | Build and deploy to Cloudflare Pages |
| `npm run ingest` | Re-ingest all Grid3 CSV files into `data/states/` |
| `npm run validate` | Validate all data files |
| `npm run seed` | Regenerate state/LGA skeleton (clears facilities!) |
| `npm run db:migrate` | Run D1 migrations locally |
| `npm run sync` | Sync JSON data to Cloudflare D1 |

### Tech Stack

- [Hono](https://hono.dev) — lightweight web framework
- [Cloudflare Pages](https://pages.cloudflare.com) — hosting and edge compute
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — SQLite database at the edge
- [Vite](https://vitejs.dev) — build tool
- [Grid3](https://grid3.org/) — seed data source

### Setting up D1

```bash
# Create the database
wrangler d1 create opengrid

# Update wrangler.toml with the database_id from above

# Run migrations
wrangler d1 execute opengrid --local --file=migrations/0001_create_tables.sql
wrangler d1 execute opengrid --local --file=migrations/0002_add_facilities.sql

# Ingest Grid3 data
npm run ingest

# Sync to D1
npm run sync
```

### CI/CD

- **PRs touching `data/`** → `validate-data.yml` validates the data
- **Merges to `main` touching `data/`** → `sync-database.yml` syncs JSON to D1

Required GitHub secrets for sync: `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_DATABASE_ID`

For the contribute form (GitHub App):
- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_APP_INSTALLATION_ID`

## License

MIT
