CREATE TABLE games (
                       id BIGSERIAL PRIMARY KEY,
                       title VARCHAR(150) NOT NULL,
                       release_date DATE,
                       cover_url VARCHAR(500)
);
