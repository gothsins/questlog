import { expect, test as base, type Page } from '@playwright/test'

const date = '2026-01-01T00:00:00'

export const game = {
    id: 42,
    title: 'Elden Ring',
    releaseDate: '2022-02-25',
    coverUrl: null,
}

export const libraryEntry = {
    id: 1,
    gameId: 42,
    title: game.title,
    coverUrl: null,
    status: 'BACKLOG',
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
    readonly unexpected: string[] = []
    entries: (typeof libraryEntry)[] = [{ ...libraryEntry }]
    mediaFails = false
    gameFails = false
    libraryUnauthorized = false
    loginSucceeds = false
    registrationSucceeds = false

    async install(page: Page) {
        await page.route('http://127.0.0.1:8080/api/**', async (route) => {
            const request = route.request()
            const path = new URL(request.url()).pathname
            const method = request.method()
            const call = `${method} ${path}`
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
                return json({ id: 7, username: 'visual_user', nickname: null,
                    avatarUrl: null, createdAt: date })
            }
            if (call === 'GET /api/library') {
                return this.libraryUnauthorized
                    ? json({ message: 'Authentication required', status: 401 }, 401)
                    : json(this.entries)
            }
            if (call === 'PATCH /api/library/1') {
                const changes = request.postDataJSON() as Partial<typeof libraryEntry>
                this.entries[0] = { ...this.entries[0], ...changes }
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
            this.unexpected.push(call)
            return route.abort()
        })
    }
}

export const test = base.extend<{ api: MockApi }>({
    api: async ({ page }, applyFixture) => {
        const api = new MockApi()
        await api.install(page)
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
