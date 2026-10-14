ALTER TABLE users
    ADD COLUMN avatar_version UUID;

CREATE TABLE user_avatars (

    user_id BIGINT PRIMARY KEY
        REFERENCES users(id) ON DELETE CASCADE,

    image_data BYTEA NOT NULL
);