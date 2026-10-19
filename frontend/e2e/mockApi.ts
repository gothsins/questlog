import { expect, test as base, type BrowserContext, type Page } from '@playwright/test'
import { FRONTEND_ORIGIN, MOCK_API_ORIGIN } from './network'
import type { GameReview } from '../src/types/reviews'
import type { LibraryEntry } from '../src/types/library'

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

export class MockApi {
    readonly calls: string[] = []
    readonly libraryPatches: Partial<LibraryEntry>[] = []
    readonly unexpected: string[] = []
    entries: LibraryEntry[] = [{ ...libraryEntry }]
    mediaFails = false
    gameFails = false
    libraryUnauthorized = false
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
            if (call === 'GET /api/games/42/reviews') {
                return this.reviewListStatus
                    ? json({ status: this.reviewListStatus }, this.reviewListStatus)
                    : json(this.reviews)
            }
            if (call === 'GET /api/library/1/review') {
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
            if (call === 'PATCH /api/library/1') {
                const changes = request.postDataJSON() as Partial<typeof libraryEntry>
                this.libraryPatches.push(changes)
                this.entries[0] = { ...this.entries[0], ...changes }
                if ('rating' in changes) {
                    if (this.myReview) this.myReview = { ...this.myReview, rating: this.entries[0].rating }
                    this.reviews = this.reviews.map((review) => review.libraryEntryId === 1
                        ? { ...review, rating: this.entries[0].rating }
                        : review)
                }
                return json(this.entries[0])
            }
            if (call === 'GET /api/games/search') {
                return json([{ igdbId: 99, title: game.title,
                    releaseDate: game.releaseDate, coverUrl: null }])
            }
            if (call === 'POST /api/library/import') {
                this.entries = [{ ...libraryEntry }]
                return json(this.entries[0], 201)
            }
            if (call === 'GET /api/games/42') {
                return this.gameFails ? json({ status: 503 }, 503) : json(game)
            }
            if (call === 'GET /api/games/42/media') {
                return this.mediaFails ? json({ status: 503 }, 503) : json({
                    summary: 'Uma jornada por terras desconhecidas.',
                    genres: ['RPG'],
                    screenshots: [image('#31234a'), image('#57429a')],
                    trailerVideoId: null,
                })
            }
            if (call === 'GET /api/games/42/steam-reviews') {
                return json({ steamAppId: null, available: false,
                    reviewScoreDescription: null, totalPositive: null,
                    totalNegative: null, totalReviews: null, positivePercentage: null })
            }
            if (call === 'GET /api/games/42/steam-review-texts') {
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
