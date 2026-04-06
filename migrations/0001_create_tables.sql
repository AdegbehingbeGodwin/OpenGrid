CREATE TABLE IF NOT EXISTS states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS lgas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state_id INTEGER NOT NULL REFERENCES states(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS markets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lga_id INTEGER NOT NULL REFERENCES lgas(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    lat REAL,
    lng REAL,
    added_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_lgas_state_id ON lgas(state_id);
CREATE INDEX IF NOT EXISTS idx_markets_lga_id ON markets(lga_id);
CREATE INDEX IF NOT EXISTS idx_markets_name ON markets(name);
