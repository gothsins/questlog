import { test, expect, useVisualSession, libraryEntry } from './mockApi'
import type { LibraryEntry } from '../src/types/library'

const cover = (top: string, bottom: string, mark: string) =>
    `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="600" height="800" fill="url(#g)"/><circle cx="470" cy="230" r="210" fill="#ffffff18"/><path d="M0 660 600 350v450H0Z" fill="#09091366"/><text x="50" y="720" fill="#fff" font-size="110" font-family="Arial" font-weight="bold">${mark}</text></svg>`,
    )}`

const collection: LibraryEntry[] = [
    { ...libraryEntry, coverUrl: cover('#503d8e', '#130f2b', 'ER'), rating: 9.5, hoursPlayed: 84 },
    { ...libraryEntry, id: 2, gameId: 43, title: 'Hollow Knight', status: 'PLAYING', coverUrl: cover('#1f5361', '#08131e', 'HK'), rating: 8, hoursPlayed: 37 },
    { ...libraryEntry, id: 3, gameId: 44, title: 'The Legend of Zelda: Tears of the Kingdom', status: 'COMPLETED', coverUrl: cover('#667f56', '#162524', 'Z'), rating: 10, hoursPlayed: 126 },
    { ...libraryEntry, id: 4, gameId: 45, title: 'Uma aventura com um título muito longo que precisa permanecer acessível na coleção', status: 'DROPPED', coverUrl: cover('#854b59', '#210f1d', 'Q'), rating: null, hoursPlayed: 4 },
    { ...libraryEntry, id: 5, gameId: 46, title: 'Celeste', status: 'WISHLIST', coverUrl: cover('#5f75aa', '#211a54', 'C'), rating: null, hoursPlayed: 0 },
    { ...libraryEntry, id: 6, gameId: 47, title: 'Jogo sem capa', status: 'WISHLIST', coverUrl: null, rating: null, hoursPlayed: 0 },
]

test('collection shows all statuses, artwork and a missing-cover fallback', async ({ page, api }, testInfo) => {
    api.entries = collection.map((entry) => ({ ...entry }))
    await useVisualSession(page)
    await page.goto('/library')
    await expect(page.getByRole('heading', { name: 'Minha biblioteca' })).toBeVisible()
    await expect(page.locator('.game-card')).toHaveCount(collection.length)
    await expect(page.getByRole('button', { name: 'Híbrido' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.status-badge')).toHaveText([
        'Quero jogar', 'Jogando', 'Concluído', 'Abandonado', 'Quero jogar', 'Quero jogar',
    ])
    await expect(page.locator('.game-card__cover-placeholder')).toHaveCount(1)
    await expect(page.locator('.game-card__manage-panel').first()).toBeHidden()
    await expect(page.getByRole('link', { name: collection[3].title, exact: true })).toHaveAttribute('title', collection[3].title)
    if (process.env.LIBRARY_CAPTURE) {
        await expect(page.locator('.library-grid__item').last()).toHaveCSS('opacity', '1')
        await page.screenshot({
            path: `../docs/screenshots/library-${process.env.LIBRARY_CAPTURE}-${testInfo.project.name}.jpg`,
            quality: 86,
            fullPage: true,
        })
        if (process.env.LIBRARY_CAPTURE === 'after') {
            await page.getByRole('button', { name: 'Capas' }).click()
            await page.screenshot({
                path: `../docs/screenshots/library-covers-${testInfo.project.name}.jpg`,
                quality: 86,
                fullPage: true,
            })
            await page.locator('.game-card').first().getByRole('button', { name: 'Gerenciar' }).click()
            await page.evaluate(() => window.scrollTo(0, 0))
            await page.screenshot({
                path: `../docs/screenshots/library-manage-${testInfo.project.name}.jpg`,
                quality: 86,
                fullPage: true,
            })
        }
    }
})

test('view change keeps search, sort and library data without another request', async ({ page, api }) => {
    api.entries = collection.map((entry) => ({ ...entry }))
    await useVisualSession(page)
    await page.goto('/library')
    await expect(page.locator('.game-card')).toHaveCount(collection.length)
    const initialLibraryRequests = api.calls.filter((call) => call === 'GET /api/library').length
    await page.getByLabel('Pesquisar jogos').fill('Hollow')
    await page.getByLabel('Ordenar por').selectOption('title')
    await page.getByRole('button', { name: 'Capas' }).click()
    await expect(page.getByRole('button', { name: 'Capas' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByLabel('Pesquisar jogos')).toHaveValue('Hollow')
    await expect(page.getByLabel('Ordenar por')).toHaveValue('title')
    await expect(page.locator('.game-card')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Hollow Knight' })).toBeVisible()
    await page.getByLabel('Pesquisar jogos').clear()
    await expect(page.locator('.game-card')).toHaveCount(collection.length)
    await expect(page.locator('.game-card').first().getByRole('heading')).toHaveText('Celeste')
    await page.getByRole('button', { name: 'Híbrido' }).click()
    await expect(page.locator('.library-grid')).toHaveClass(/library-grid--hybrid/)
    expect(api.calls.filter((call) => call === 'GET /api/library')).toHaveLength(initialLibraryRequests)
})

test('manage panel edits status, rating and hours and keeps a failed draft', async ({ page, api }) => {
    await useVisualSession(page)
    await page.goto('/library')
    const card = page.locator('.game-card')
    const manage = card.getByRole('button', { name: 'Gerenciar' })
    await expect(card.getByLabel('Estado do jogo')).toBeHidden()
    await manage.click()
    await expect(card.getByLabel('Estado do jogo')).toBeVisible()
    await card.getByLabel('Estado do jogo').selectOption('PLAYING')
    await expect(card.locator('.status-badge')).toHaveText('Jogando')
    await card.getByRole('button', { name: /Registrar avaliação/ }).click()
    await card.getByLabel('Nota (0 a 10)').fill('9,5')
    await card.getByLabel('Horas jogadas').fill('42,5')
    await card.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(card.getByText('42,5h')).toBeVisible()
    await expect(card.getByText('★ 9,5')).toBeVisible()
    await card.getByRole('button', { name: /Editar avaliação/ }).click()
    await card.getByLabel('Horas jogadas').fill('55')
    api.libraryPatchStatus = 503
    await card.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(card.getByRole('alert')).toContainText('Não foi possível salvar')
    await expect(card.getByLabel('Horas jogadas')).toHaveValue('55')
    await card.getByRole('button', { name: 'Fechar' }).click()
    await expect(card.getByLabel('Estado do jogo')).toBeHidden()
    await card.getByRole('button', { name: 'Gerenciar' }).click()
    await expect(card.getByLabel('Horas jogadas')).toHaveValue('55')
    expect(api.libraryPatches).toEqual([
        { status: 'PLAYING' },
        { rating: 9.5, hoursPlayed: 42.5 },
        { rating: 9.5, hoursPlayed: 55 },
    ])
})

test('cover link opens details and view controls work by keyboard without overflow', async ({ page, api }) => {
    api.entries = collection.map((entry) => ({ ...entry }))
    await useVisualSession(page)
    await page.goto('/library')
    await page.getByRole('button', { name: 'Capas' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.library-grid')).toHaveClass(/library-grid--covers/)
    await expect(page.locator('.game-card').first().getByRole('heading')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.locator('.game-card').first().getByRole('link', { name: /Ver detalhes de Elden Ring/ }).click()
    await expect(page).toHaveURL(/\/games\/42$/)
})
