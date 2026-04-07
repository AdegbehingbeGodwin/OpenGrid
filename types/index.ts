export interface State {
  id: number;
  name: string;
  slug: string;
}

export interface LGA {
  id: number;
  state_id: number;
  name: string;
  slug: string;
}

export const FACILITY_TYPES = [
  'market',
  'health_facility',
  'school',
  'government_building',
  'police_station',
  'fire_station',
  'post_office',
  'idp_site',
  'church',
  'mosque',
  'water_point',
  'farm',
  'factory',
  'energy_substation',
  'filling_station',
] as const;

export type FacilityType = (typeof FACILITY_TYPES)[number];

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  market: 'Market',
  health_facility: 'Health Facility',
  school: 'School',
  government_building: 'Government Building',
  police_station: 'Police Station',
  fire_station: 'Fire Station',
  post_office: 'Post Office',
  idp_site: 'IDP Site',
  church: 'Church',
  mosque: 'Mosque',
  water_point: 'Water Point',
  farm: 'Farm',
  factory: 'Factory',
  energy_substation: 'Energy Substation',
  filling_station: 'Filling Station',
};

export interface Facility {
  id: number;
  lga_id: number;
  type: FacilityType;
  name: string;
  slug: string;
  lat: number | null;
  lng: number | null;
  source: 'grid3' | 'community';
  verified: number;
  metadata: string | null;
  added_by: string | null;
}

// Data file types (JSON structure in data/states/*.json)
export interface FacilityData {
  type: FacilityType;
  name: string;
  slug: string;
  coordinates?: { lat: number; lng: number };
  source: 'grid3' | 'community';
  verified: boolean;
  metadata?: Record<string, unknown>;
  added_by?: string;
}

export interface LGAData {
  name: string;
  slug: string;
  facilities: FacilityData[];
}

export interface StateData {
  name: string;
  slug: string;
  lgas: LGAData[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { total: number; limit: number; offset: number };
}

export interface ApiError {
  success: false;
  error: { message: string; code: string };
}

// Hono bindings
export type Bindings = {
  DB: D1Database;
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  GITHUB_APP_INSTALLATION_ID: string;
  DOCS_URL?: string;
};
