PRAGMA foreign_keys = true;

/* Dropping in reverse order of creating. */
-- DROP TABLE IF EXISTS more_info_data;
-- DROP TABLE IF EXISTS variants_data;
-- DROP TABLE IF EXISTS genomes;

CREATE TABLE IF NOT EXISTS genomes (
    genome_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS variants_data (
    variant_id INTEGER PRIMARY KEY,
    genome_id INTEGER NOT NULL,
    CHROM TEXT NOT NULL,
    POS INTEGER NOT NULL,
    REF TEXT NOT NULL,
    ALT TEXT NOT NULL,
    FOREIGN KEY (genome_id) REFERENCES genomes (genome_id)
);

CREATE TABLE IF NOT EXISTS more_info_data (
    more_info_data_id INTEGER PRIMARY KEY,
    variant_id INTEGER NOT NULL,
    ID TEXT NOT NULL,
    QUAL TEXT NOT NULL,
    FILTER TEXT NOT NULL,
    INFO TEXT,
    FORMAT TEXT,
    FOREIGN KEY (variant_id) REFERENCES variants_data (variant_id)
)