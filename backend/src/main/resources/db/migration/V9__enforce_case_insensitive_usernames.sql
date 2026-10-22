-- Usernames are login identifiers: "Gui" and "gui" must not be two accounts.
-- If this fails, two existing users differ only by letter case; rename one
-- of them manually before running the migration again.
CREATE UNIQUE INDEX uq_users_username_lower
    ON users (LOWER(username));
