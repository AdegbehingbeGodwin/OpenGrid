-- OpenGrid: Multi-facility schema
-- Adds facilities table replacing markets

CREATE TABLE IF NOT EXISTS facilities (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  lga_id   INTEGER NOT NULL REFERENCES lgas(id),
  type     TEXT    NOT NULL,
  name     TEXT    NOT NULL,
  slug     TEXT    NOT NULL UNIQUE,
  lat      REAL,
  lng      REAL,
  source   TEXT    NOT NULL DEFAULT 'grid3',
  verified INTEGER NOT NULL DEFAULT 1,
  metadata TEXT,
  added_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_facilities_lga_id  ON facilities(lga_id);
CREATE INDEX IF NOT EXISTS idx_facilities_type     ON facilities(type);
CREATE INDEX IF NOT EXISTS idx_facilities_source   ON facilities(source);
CREATE INDEX IF NOT EXISTS idx_facilities_name     ON facilities(name);
CREATE INDEX IF NOT EXISTS idx_facilities_type_lga ON facilities(type, lga_id);
