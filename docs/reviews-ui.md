# Questlog player reviews

`/games/:gameId` reads community reviews from
`GET /api/games/{gameId}/reviews`. The page reads `GET /api/library` through
TanStack Query to find the current user's entry by `gameId`. It then calls
`GET /api/library/{entryId}/review` to determine whether the user may create or
edit an existing review. A `404` from this second endpoint means the entry has
no review; other errors retain retry controls. Ownership is never inferred
from a displayed username. The current backend uses `404` for both a missing
review and an entry removed concurrently; the latter will be surfaced by a
failed mutation and can be resolved by refreshing the library state.

The editor sends text only to `PUT /api/library/{entryId}/review` and deletes
through `DELETE /api/library/{entryId}/review`. It checks the backend's 20
trimmed-character minimum and 2,000 raw-character maximum, then sends the
original draft. The backend remains responsible for canonical normalization
and authorization. Failed saves keep the draft; failed deletes keep the
published card. After the server confirms a mutation, the UI reconciles both
the own-review and community caches by review ID or library entry ID, then
invalidates the community query. Confirmed data remains visible with a retry
control if that refetch fails. No additional rating mutation occurs. The
displayed `rating` comes from `LibraryEntry.rating`, which can be changed in
the existing library UI. A successful library rating save updates any cached
review for that entry and invalidates that game's community query; status and
hours-only changes do not refetch reviews.

The Questlog section is separate from Steam aggregates and written reviews.
Review content is rendered as React text with CSS-preserved line breaks. The
API does not provide an avatar, so the card uses a textual initial. The API
also has no pagination or explicit `edited` flag: the UI lists all returned
reviews and infers an edit when `updatedAt` is more than one second after
`createdAt`, avoiding a label caused by timestamp differences on insert.

Run `npm ci`, `npm run build`, `npm run lint`, `npm test`, and
`npm run test:e2e` in `frontend/`. Browser tests use explicit local fixtures
for every review endpoint, including failures, and keep the Quality
Engineering network block in place. No real user, database, Steam, IGDB, or
production token is used. A future API version could add pagination and an
explicit edit indicator without changing the ownership or rating model.

The mobile login test retried in GitHub Actions run `39159797496`. That run
did not retain a trace because the browser job succeeded on retry. A local
20-repeat run without retries reproduced two failures. Its traces show that
the test filled the registration page's username field during the route
transition to login; the login username remained empty, so native required
validation prevented the login POST. The test now waits for the login URL and
its distinct heading before filling the form. No application login behavior
or timeout was changed.
