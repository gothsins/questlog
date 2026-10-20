import { test, expect, useVisualSession, libraryEntry } from './mockApi'
import type { LibraryEntry } from '../src/types/library'

const entries: LibraryEntry[] = [
    { ...libraryEntry, id: 1, gameId: 42, title: 'Zelda', status: 'WISHLIST', createdAt: '2026-10-04T12:00:00Z' },
    { ...libraryEntry, id: 2, gameId: 43, title: 'Celeste', status: 'PLAYING', createdAt: '2026-10-03T12:00:00Z' },
    { ...libraryEntry, id: 3, gameId: 44, title: 'Hollow Knight', status: 'COMPLETED', createdAt: '2026-10-02T12:00:00Z' },
    { ...libraryEntry, id: 4, gameId: 45, title: 'Disco Elysium', status: 'DROPPED', createdAt: '2026-10-01T12:00:00Z' },
]

const visibleCards = (page: import('@playwright/test').Page) =>
    page.locator('.library-grid__item:not([aria-hidden="true"]) .game-card')

test('quick counts, select and local filtering stay synchronized without refetching', async ({ page, api }) => {
    api.entries = entries.map((entry) => ({ ...entry }))
    await useVisualSession(page)
    await page.goto('/library')
    const filters = page.getByRole('group', { name: 'Filtros rápidos' })
    await expect(filters.getByRole('button', { name: 'Todos 4' })).toHaveAttribute('aria-pressed', 'true')
    for (const label of ['Quero jogar', 'Jogando', 'Concluídos', 'Abandonados']) {
        await expect(filters.getByRole('button', { name: `${label} 1` })).toBeVisible()
    }
    const initialGets = api.calls.filter((call) => call === 'GET /api/library').length
    await filters.getByRole('button', { name: 'Jogando 1' }).click()
    await expect(page.getByLabel('Estado', { exact: true })).toHaveValue('PLAYING')
    await expect(visibleCards(page)).toHaveCount(1)
    await expect(visibleCards(page).getByRole('heading')).toHaveText('Celeste')
    await filters.getByRole('button', { name: 'Todos 4' }).click()
    await expect(visibleCards(page)).toHaveCount(4)
    await page.getByLabel('Estado', { exact: true }).selectOption('COMPLETED')
    await expect(filters.getByRole('button', { name: 'Concluídos 1' })).toHaveAttribute('aria-pressed', 'true')
    await expect(visibleCards(page).getByRole('heading')).toHaveText('Hollow Knight')
    await page.getByLabel('Estado', { exact: true }).selectOption('ALL')
    await page.getByLabel('Ordenar por').selectOption('title')
    await expect(visibleCards(page).getByRole('heading')).toHaveText(['Celeste', 'Disco Elysium', 'Hollow Knight', 'Zelda'])
    await page.getByLabel('Pesquisar jogos').fill('Zelda')
    await expect(visibleCards(page)).toHaveCount(1)
    await page.getByLabel('Pesquisar jogos').clear()
    await expect(visibleCards(page)).toHaveCount(4)
    expect(api.calls.filter((call) => call === 'GET /api/library')).toHaveLength(initialGets)
})

test('cards and active filter travel through intermediate positions', async ({ page, api }) => {
    api.entries = entries.map((entry) => ({ ...entry }))
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await useVisualSession(page)
    await page.goto('/library')
    await expect(visibleCards(page)).toHaveCount(4)
    await page.getByLabel('Ordenar por').selectOption('title')
    const positions = await page.evaluate(async () => {
        const card = [...document.querySelectorAll<HTMLElement>('.game-card')]
            .find((element) => element.textContent?.includes('Zelda'))?.parentElement
        if (!card) return []
        const points: string[] = []
        for (let index = 0; index < 18; index += 1) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
            const rect = card.getBoundingClientRect()
            points.push(`${Math.round(rect.x)},${Math.round(rect.y)}`)
        }
        return points
    })
    await expect(visibleCards(page).getByRole('heading')).toHaveText(['Celeste', 'Disco Elysium', 'Hollow Knight', 'Zelda'])
    expect(new Set(positions).size).toBeGreaterThan(2)
    await page.getByRole('group', { name: 'Filtros rápidos' }).getByRole('button', { name: 'Jogando 1' }).click()
    const indicatorPositions = await page.evaluate(async () => {
        const indicator = document.querySelector<HTMLElement>('.library-quick-filters__indicator')
        if (!indicator) return []
        const points: number[] = []
        for (let index = 0; index < 18; index += 1) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
            points.push(Math.round(indicator.getBoundingClientRect().x))
        }
        return points
    })
    expect(new Set(indicatorPositions).size).toBeGreaterThan(2)
})

test('covers preference survives navigation and invalid storage falls back to hybrid', async ({ page, api }) => {
    api.entries = entries.map((entry) => ({ ...entry }))
    await useVisualSession(page)
    await page.goto('/library')
    const card = visibleCards(page).first()
    await card.getByRole('button', { name: 'Gerenciar' }).click()
    await card.getByRole('button', { name: /Registrar avaliação/ }).click()
    await card.getByLabel('Horas jogadas').fill('17,5')
    await page.getByRole('button', { name: 'Capas' }).click()
    await page.getByLabel('Ordenar por').selectOption('title')
    await expect(visibleCards(page).filter({ hasText: 'Zelda' }).getByLabel('Horas jogadas')).toHaveValue('17,5')
    await page.getByRole('group', { name: 'Filtros rápidos' }).getByRole('button', { name: 'Jogando 1' }).click()
    await expect(page.locator('.game-card').filter({ hasText: 'Zelda' })).toHaveCount(0)
    await page.getByRole('group', { name: 'Filtros rápidos' }).getByRole('button', { name: 'Todos 4' }).click()
    await expect(visibleCards(page).filter({ hasText: 'Zelda' }).getByLabel('Horas jogadas')).toHaveValue('17,5')
    await expect(page.getByRole('button', { name: 'Capas' })).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('questlog.library.view.v1'))).toBe('covers')
    await page.reload()
    await expect(page.getByRole('button', { name: 'Capas' })).toHaveAttribute('aria-pressed', 'true')
    await page.evaluate(() => localStorage.setItem('questlog.library.view.v1', 'invalid'))
    await page.reload()
    await expect(page.getByRole('button', { name: 'Híbrido' })).toHaveAttribute('aria-pressed', 'true')
})

test('library still works when localStorage writes are unavailable', async ({ page, api }) => {
    api.entries = entries.map((entry) => ({ ...entry }))
    await useVisualSession(page)
    await page.goto('/library')
    await expect(page.getByRole('button', { name: 'Híbrido' })).toHaveAttribute('aria-pressed', 'true')
    await page.evaluate(() => {
        Object.defineProperty(window.localStorage, 'setItem', {
            configurable: true,
            value: () => { throw new Error('storage blocked') },
        })
    })
    await page.getByRole('button', { name: 'Capas' }).click()
    await expect(page.getByRole('button', { name: 'Capas' })).toHaveAttribute('aria-pressed', 'true')
})

test('state changes update quick counts only after success and errors keep the card', async ({ page, api }) => {
    api.entries = entries.map((entry) => ({ ...entry }))
    await useVisualSession(page)
    await page.goto('/library')
    const filters = page.getByRole('group', { name: 'Filtros rápidos' })
    await filters.getByRole('button', { name: 'Quero jogar 1' }).click()
    const card = visibleCards(page)
    await card.getByRole('button', { name: 'Gerenciar' }).click()
    api.libraryPatchStatus = 503
    await card.getByLabel('Estado do jogo').selectOption('PLAYING')
    await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível salvar' })).toBeVisible()
    await expect(card).toHaveCount(1)
    await expect(filters.getByRole('button', { name: 'Quero jogar 1' })).toBeVisible()
    api.libraryPatchStatus = null
    await card.getByLabel('Estado do jogo').selectOption('PLAYING')
    await expect(visibleCards(page)).toHaveCount(0)
    await expect(filters.getByRole('button', { name: 'Quero jogar 0' })).toBeVisible()
    await expect(filters.getByRole('button', { name: 'Jogando 2' })).toBeVisible()
    await filters.getByRole('button', { name: 'Jogando 2' }).click()
    await expect(visibleCards(page)).toHaveCount(2)
    expect(api.calls.filter((call) => call === 'GET /api/library').length).toBeLessThanOrEqual(2)
})

test('large collection, keyboard filters and reduced motion remain usable without overflow', async ({ page, api }) => {
    api.entries = Array.from({ length: 104 }, (_, index) => ({
        ...entries[index % entries.length], id: index + 1, gameId: index + 42,
        title: `Jogo ${String(index + 1).padStart(3, '0')}`,
    }))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await useVisualSession(page)
    await page.goto('/library')
    await expect(visibleCards(page)).toHaveCount(104)
    const playing = page.getByRole('group', { name: 'Filtros rápidos' }).getByRole('button', { name: 'Jogando 26' })
    await playing.focus()
    await page.keyboard.press('Enter')
    await expect(playing).toHaveAttribute('aria-pressed', 'true')
    await expect(playing).toBeFocused()
    await expect(visibleCards(page)).toHaveCount(26)
    await page.getByRole('button', { name: 'Capas' }).click()
    const abandoned = page.getByRole('group', { name: 'Filtros rápidos' }).getByRole('button', { name: 'Abandonados 26' })
    await abandoned.click()
    await expect(abandoned).toHaveAttribute('aria-pressed', 'true')
    await expect(visibleCards(page)).toHaveCount(26)
    if ((page.viewportSize()?.width ?? 0) < 600) {
        expect(await page.getByRole('group', { name: 'Filtros rápidos' }).evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
    await expect(visibleCards(page).first().locator('..')).toHaveCSS('transform', 'none')
})
