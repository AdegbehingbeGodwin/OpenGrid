ALTER TABLE lgas ADD COLUMN population REAL;

CREATE INDEX IF NOT EXISTS idx_lgas_population ON lgas(population);
