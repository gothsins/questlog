CREATE TABLE library_entries (
                                 id BIGSERIAL PRIMARY KEY,

                                 user_id BIGINT NOT NULL,
                                 game_id BIGINT NOT NULL,

                                 status VARCHAR(20) NOT NULL DEFAULT 'BACKLOG',

                                 rating NUMERIC(3, 1),
                                 hours_played NUMERIC(8, 1) NOT NULL DEFAULT 0,

                                 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                 CONSTRAINT fk_library_entries_user
                                     FOREIGN KEY (user_id)
                                         REFERENCES users(id)
                                         ON DELETE CASCADE,

                                 CONSTRAINT fk_library_entries_game
                                     FOREIGN KEY (game_id)
                                         REFERENCES games(id)
                                         ON DELETE CASCADE,

                                 CONSTRAINT uq_library_entries_user_game
                                     UNIQUE (user_id, game_id),

                                 CONSTRAINT chk_library_entries_status
                                     CHECK (
                                         status IN (
                                                    'BACKLOG',
                                                    'PLAYING',
                                                    'COMPLETED',
                                                    'DROPPED',
                                                    'WISHLIST'
                                             )
                                         ),

                                 CONSTRAINT chk_library_entries_rating
                                     CHECK (
                                         rating IS NULL
                                             OR rating BETWEEN 0 AND 10
                                         ),

                                 CONSTRAINT chk_library_entries_hours_played
                                     CHECK (hours_played >= 0)
);