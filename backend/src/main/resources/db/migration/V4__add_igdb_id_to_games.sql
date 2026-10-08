ALTER TABLE games
    ADD COLUMN igdb_id BIGINT;

ALTER TABLE games
    ADD CONSTRAINT uq_games_igdb_id
        UNIQUE (igdb_id);