
CREATE TABLE game_reviews (
    id BIGSERIAL PRIMARY KEY,

    library_entry_id BIGINT NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_game_reviews_library_entry
        FOREIGN KEY (library_entry_id)
        REFERENCES library_entries(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_game_reviews_library_entry
        UNIQUE (library_entry_id),

    CONSTRAINT chk_game_reviews_content_length
        CHECK (
            char_length(btrim(content)) BETWEEN 20 AND 2000
    )
);

CREATE INDEX idx_library_entries_game_id
    ON library_entries(game_id);
