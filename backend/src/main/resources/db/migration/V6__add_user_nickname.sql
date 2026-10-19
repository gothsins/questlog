ALTER TABLE users
    ADD COLUMN nickname VARCHAR(24);

CREATE UNIQUE INDEX uq_users_nickname_lower
    ON users (LOWER(nickname))
    WHERE nickname IS NOT NULL;