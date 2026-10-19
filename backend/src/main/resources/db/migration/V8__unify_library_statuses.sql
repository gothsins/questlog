UPDATE library_entries
SET status = 'WISHLIST'
WHERE status = 'BACKLOG';

ALTER TABLE library_entries
    ALTER COLUMN status SET DEFAULT 'WISHLIST';

ALTER TABLE library_entries
DROP CONSTRAINT chk_library_entries_status;

ALTER TABLE library_entries
    ADD CONSTRAINT chk_library_entries_status
        CHECK (
            status IN (
                       'WISHLIST',
                       'PLAYING',
                       'COMPLETED',
                       'DROPPED'
                )
            );
