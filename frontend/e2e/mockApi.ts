import { expect, test as base, type BrowserContext, type Page } from '@playwright/test'
import { FRONTEND_ORIGIN, MOCK_API_ORIGIN } from './network'
import type { GameReview } from '../src/types/reviews'
import type { LibraryEntry } from '../src/types/library'
import type { DiscoveryGame, HomeDiscovery } from '../src/types/discovery'

const date = '2026-01-01T00:00:00'

export const game = {
    id: 42,
    title: 'Elden Ring',
    releaseDate: '2022-02-25',
    coverUrl: null,
}

export const libraryEntry: LibraryEntry = {
    id: 1,
    gameId: 42,
    title: game.title,
    coverUrl: null,
    status: 'WISHLIST',
    rating: null,
    hoursPlayed: 0,
    createdAt: date,
    updatedAt: date,
    igdbId: 99,
}

const image = (color: string) =>
    `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="${color}"/></svg>`,
    )}`

const coverArt = (id: number) => {
    const hue = (id * 47) % 360
    const svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">',
        '<defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl(', hue,
        ',52%,35%)"/><stop offset="1" stop-color="hsl(', (hue + 80) % 360,
        ',42%,11%)"/></linearGradient></defs>',
        '<rect width="600" height="800" fill="url(#g)"/>',
        '<circle cx="410" cy="240" r="185" fill="none" stroke="#ffffff" stroke-opacity=".28" stroke-width="3"/>',
        '<circle cx="410" cy="240" r="125" fill="#ffffff" fill-opacity=".1"/>',
        '<path d="M0 760 275 300 600 800H0" fill="#0d0b1a" fill-opacity=".45"/>',
        '<path d="M0 620 180 420 390 800H0" fill="#ffffff" fill-opacity=".13"/>',
        '</svg>',
    ].join('')
    return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

const fixtureGame = (igdbId: number, title: string, releaseDate: string,
    popularitySource: string | null): DiscoveryGame => ({
    igdbId, title, coverUrl: coverArt(igdbId), releaseDate, popularitySource,
})

const extraGames = (start: number, group: string, count: number,
    source: string, releaseDate = '2024-01-01'): DiscoveryGame[] =>
    Array.from({ length: count }, (_, index) =>
        fixtureGame(start + index, group + ' ' + (index + 2), releaseDate, source))

export class MockApi {
    readonly calls: string[] = []
    readonly libraryPatches: Partial<LibraryEntry>[] = []
    readonly unexpected: string[] = []
    entries: LibraryEntry[] = [{ ...libraryEntry }]
    discoveryFails = false
    discoveryGate: Promise<void> | null = null
    discoveryDetailsStatus: number | null = null
    importStatus: number | null = null
    discovery: HomeDiscovery = {
        popular: { available: true, updatedAt: '2026-01-01T00:00:00Z', games: [
            fixtureGame(99, 'Elden Ring', '2022-02-25', 'IGDB PopScore · visitas às páginas'),
            ...extraGames(520, 'IGDB discovery', 4, 'IGDB PopScore · visitas às páginas'),
        ] },
        upcoming: { available: true, updatedAt: '2026-01-01T00:00:00Z', games: [
            fixtureGame(199, 'Future Game', '2027-01-01', null),
            ...extraGames(530, 'Upcoming discovery', 4, 'IGDB', '2027-02-01'),
        ] },
        steam: { available: true, updatedAt: '2026-01-01T00:00:00Z', games: [
            fixtureGame(299, 'Steam Peak Game', '2024-01-01', 'IGDB PopScore · pico Steam em 24 horas'),
            ...extraGames(540, 'Steam discovery', 6, 'IGDB PopScore · pico Steam em 24 horas'),
        ] },
        fps: { available: true, updatedAt: '2026-01-01T00:00:00Z', games: [
            fixtureGame(399, 'First Person Game', '2023-01-01', 'IGDB · Shooter em primeira pessoa'),
            ...extraGames(550, 'FPS discovery', 6, 'IGDB · Shooter em primeira pessoa'),
        ] },
        indie: { available: true, updatedAt: '2026-01-01T00:00:00Z', games: [
            fixtureGame(499, 'Indie Game', '2021-01-01', 'IGDB · gênero Indie'),
            ...extraGames(560, 'Indie discovery', 6, 'IGDB · gênero Indie'),
        ] },
        featured: fixtureGame(299, 'Steam Peak Game', '2024-01-01',
            'IGDB PopScore · pico Steam em 24 horas'),
    }
    mediaFails = false
    gameFails = false
    libraryUnauthorized = false
    libraryPatchStatus: number | null = null
    loginSucceeds = false
    registrationSucceeds = false
    reviews: GameReview[] = []
    myReview: GameReview | null = null
    reviewListStatus: number | null = null
    myReviewStatus: number | null = null
    reviewSaveStatus: number | null = null
    reviewDeleteStatus: number | null = null
    profileStatus: number | null = null
    profile = { id: 7, username: 'visual_user', nickname: null as string | null,
        avatarUrl: null, createdAt: date }

    async install(context: BrowserContext) {
        await context.routeWebSocket(/.*/, async (socket) => {
            const url = new URL(socket.url())
            if (url.origin === FRONTEND_ORIGIN.replace('http:', 'ws:')) {
                socket.connectToServer()
                return
            }
            this.unexpected.push(`WS ${url.origin}${url.pathname}`)
            await socket.close({ code: 1008, reason: 'Blocked by E2E network policy' })
        })

        await context.route(/.*/, async (route) => {
            const request = route.request()
            const url = new URL(request.url())
            const path = url.pathname
            const method = request.method()
            const call = `${method} ${path}`

            if (url.origin === FRONTEND_ORIGIN && (method === 'GET' || method === 'HEAD')) {
                return route.continue()
            }
            if (url.origin !== MOCK_API_ORIGIN || !path.startsWith('/api/')) {
                this.unexpected.push(`${method} ${url.origin}${path}`)
                return route.abort('blockedbyclient')
            }

            this.calls.push(call)
            const json = (body: unknown, status = 200) =>
                route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

            if (call === 'POST /api/auth/login') {
                return json(this.loginSucceeds
                    ? { token: 'visual-e2e-token' }
                    : { message: 'Invalid username or password', status: 401 },
                this.loginSucceeds ? 200 : 401)
            }
            if (call === 'POST /api/auth/register') {
                return json(this.registrationSucceeds
                    ? { id: 7, username: 'visual_user', createdAt: date }
                    : { message: 'Password safety check unavailable; try again later', status: 503 },
                this.registrationSucceeds ? 201 : 503)
            }
            if (call === 'GET /api/users/me') {
                return this.profileStatus
                    ? json({ status: this.profileStatus }, this.profileStatus)
                    : json(this.profile)
            }
            if (call === 'PATCH /api/users/me') {
                const changes = request.postDataJSON() as { nickname: string }
                this.profile = { ...this.profile, nickname: changes.nickname }
                return json(this.profile)
            }
            if (call === 'GET /api/library') {
                return this.libraryUnauthorized
                    ? json({ message: 'Authentication required', status: 401 }, 401)
                    : json(this.entries)
            }
            if (call === 'GET /api/discovery/home') {
                if (this.discoveryGate) await this.discoveryGate
                return this.discoveryFails ? json({ status: 503 }, 503) : json(this.discovery)
            }
            const discoveryDetails = /^GET \/api\/discovery\/games\/(99|199|299|399|499|5[2-6]\d)$/.exec(call)
            if (discoveryDetails) {
                if (this.discoveryDetailsStatus) return json({ status: this.discoveryDetailsStatus }, this.discoveryDetailsStatus)
                const isPopular = discoveryDetails[1] === '99'
                const titles: Record<string, string> = {
                    '99': 'Elden Ring', '199': 'Future Game', '299': 'Steam Peak Game',
                    '399': 'First Person Game', '499': 'Indie Game',
                }
                const selectedGame = [
                    ...this.discovery.popular.games, ...this.discovery.upcoming.games,
                    ...this.discovery.steam.games, ...this.discovery.fps.games,
                    ...this.discovery.indie.games,
                ].find(item => item.igdbId === Number(discoveryDetails[1]))
                return json({
                    igdbId: Number(discoveryDetails[1]),
                    gameId: isPopular ? 42 : null,
                    title: selectedGame?.title ?? titles[discoveryDetails[1]],
                    releaseDate: isPopular ? '2022-02-25' : null,
                    coverUrl: selectedGame?.coverUrl ?? null,
                    summary: isPopular ? 'Uma jornada por terras desconhecidas.' : null,
                    genres: isPopular ? ['RPG'] : [],
                    screenshots: isPopular ? [image('#31234a'), image('#57429a')] : [],
                    trailerVideoId: isPopular ? 'M7lc1UVf-VE' : null,
                })
            }
            if (call === 'GET /api/games/42/reviews' || call === 'GET /api/games/143/reviews') {
                return this.reviewListStatus
                    ? json({ status: this.reviewListStatus }, this.reviewListStatus)
                    : json(this.reviews)
            }
            if (call === 'GET /api/library/1/review' || call === 'GET /api/library/2/review') {
                if (this.myReviewStatus) return json({ status: this.myReviewStatus }, this.myReviewStatus)
                return this.myReview
                    ? json(this.myReview)
                    : json({ status: 404 }, 404)
            }
            if (call === 'PUT /api/library/1/review') {
                if (this.reviewSaveStatus) return json({ status: this.reviewSaveStatus }, this.reviewSaveStatus)
                const body = request.postDataJSON() as { content: string }
                const now = '2026-01-02T12:00:00'
                this.myReview = {
                    id: this.myReview?.id ?? 101,
                    libraryEntryId: 1,
                    gameId: 42,
                    username: 'visual_user',
                    content: body.content.trim(),
                    rating: this.entries[0]?.rating ?? null,
                    createdAt: this.myReview?.createdAt ?? now,
                    updatedAt: now,
                }
                this.reviews = [this.myReview, ...this.reviews.filter((item) => item.id !== this.myReview?.id)]
                return json(this.myReview)
            }
            if (call === 'DELETE /api/library/1/review') {
                if (this.reviewDeleteStatus) return json({ status: this.reviewDeleteStatus }, this.reviewDeleteStatus)
                this.reviews = this.reviews.filter((item) => item.id !== this.myReview?.id)
                this.myReview = null
                return route.fulfill({ status: 204 })
            }
            const libraryPatch = /^PATCH \/api\/library\/(\d+)$/.exec(call)
            if (libraryPatch) {
                const changes = request.postDataJSON() as Partial<typeof libraryEntry>
                this.libraryPatches.push(changes)
                if (this.libraryPatchStatus) {
                    return json({ status: this.libraryPatchStatus }, this.libraryPatchStatus)
                }
                const index = this.entries.findIndex((entry) => entry.id === Number(libraryPatch[1]))
                if (index < 0) return json({ status: 404 }, 404)
                this.entries[index] = { ...this.entries[index], ...changes }
                if ('rating' in changes) {
                    if (this.myReview?.libraryEntryId === this.entries[index].id) {
                        this.myReview = { ...this.myReview, rating: this.entries[index].rating }
                    }
                    this.reviews = this.reviews.map((review) => review.libraryEntryId === this.entries[index].id
                        ? { ...review, rating: this.entries[index].rating }
                        : review)
                }
                return json(this.entries[index])
            }
            if (call === 'GET /api/games/search') {
                return json([{ igdbId: 99, title: game.title,
                    releaseDate: game.releaseDate, coverUrl: null }])
            }
            if (call === 'POST /api/library/import') {
                if (this.importStatus) return json({ status: this.importStatus }, this.importStatus)
                const { igdbId } = request.postDataJSON() as { igdbId: number }
                const entry = igdbId === 199
                    ? { ...libraryEntry, id: 2, gameId: 143, igdbId: 199, title: 'Future Game' }
                    : { ...libraryEntry }
                this.entries = [...this.entries.filter(item => item.igdbId !== igdbId), entry]
                return json(entry, 201)
            }
            if (call === 'GET /api/games/42') {
                return this.gameFails ? json({ status: 503 }, 503) : json(game)
            }
            if (call === 'GET /api/games/143') {
                return json({ id: 143, title: 'Future Game', releaseDate: null, coverUrl: null })
            }
            if (call === 'GET /api/games/42/media') {
                return this.mediaFails ? json({ status: 503 }, 503) : json({
                    summary: 'Uma jornada por terras desconhecidas.',
                    genres: ['RPG'],
                    screenshots: [image('#31234a'), image('#57429a')],
                    trailerVideoId: null,
                })
            }
            if (call === 'GET /api/games/143/media') {
                return json({ summary: null, genres: [], screenshots: [], trailerVideoId: null })
            }
            if (call === 'GET /api/games/42/steam-reviews' || call === 'GET /api/games/143/steam-reviews') {
                return json({ steamAppId: null, available: false,
                    reviewScoreDescription: null, totalPositive: null,
                    totalNegative: null, totalReviews: null, positivePercentage: null })
            }
            if (call === 'GET /api/games/42/steam-review-texts' || call === 'GET /api/games/143/steam-review-texts') {
                return json({ steamAppId: null, available: false,
                    reviews: [], nextCursor: null })
            }
            this.unexpected.push(`${method} ${url.origin}${path}`)
            return route.abort('blockedbyclient')
        })
    }

    assertBlocked(destination: string) {
        expect(this.unexpected).toContain(destination)
        this.unexpected.splice(this.unexpected.indexOf(destination), 1)
    }
}

export const test = base.extend<{ api: MockApi }>({
    api: async ({ context }, applyFixture) => {
        const api = new MockApi()
        await api.install(context)
        await applyFixture(api)
        expect(api.unexpected, 'Unexpected API calls must be explicitly mocked').toEqual([])
    },
})

export { expect }

export async function useVisualSession(page: Page) {
    await page.addInitScript(() => {
        sessionStorage.setItem('questlog_token', 'visual-e2e-token')
    })
}
