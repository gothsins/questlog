import { test, expect, useVisualSession } from './mockApi'

test('authenticated home separates IGDB discovery from personal game IDs', async ({ page, api }) => {
    api.entries = [{ ...api.entries[0], status: 'PLAYING', rating: 8, hoursPlayed: 12 }]
    await useVisualSession(page)
    await page.goto('/home')
    await expect(page.getByRole('heading', { name: 'Populares na IGDB' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Próximos lançamentos' })).toBeVisible()
    await expect(page.getByText('12h registradas · Nota 8/10')).toBeVisible()
    if (process.env.HOME_DISCOVERY_CAPTURE === '1') {
        await page.screenshot({ path: `../docs/screenshots/home-discovery-${test.info().project.name}.jpg`, type: 'jpeg', quality: 78, fullPage: true })
    }
    await page.getByRole('link', { name: 'Ver detalhes de Elden Ring' }).click()
    await expect(page).toHaveURL(/\/games\/42$/)
    await page.getByRole('navigation', { name: 'Navegação estrutural' }).getByRole('link', { name: 'Biblioteca' }).click()
    await expect(page).toHaveURL(/\/library$/)
    await page.getByRole('link', { name: 'Início' }).click()
    await page.getByRole('link', { name: 'Buscar Future Game no catálogo' }).click()
    await expect(page).toHaveURL(/\/explore\?q=Future%20Game$/)
    await expect(page.getByLabel('Buscar no catálogo')).toHaveValue('Future Game')
    expect(api.calls).toContain('GET /api/games/search')
    expect(api.calls).not.toContain('POST /api/library/import')
})

test('home keeps the journey available when IGDB fails', async ({ page, api }) => {
    api.discoveryFails = true
    api.entries = [{ ...api.entries[0], status: 'PLAYING' }]
    await useVisualSession(page)
    await page.goto('/home')
    await expect(page.getByRole('alert')).toContainText('Não foi possível carregar a descoberta')
    await expect(page.getByRole('link', { name: 'Ver detalhes de Elden Ring' })).toBeVisible()
    api.discoveryFails = false
    await page.getByRole('button', { name: 'Tentar novamente' }).first().click()
    await expect(page.getByRole('heading', { name: 'Populares na IGDB' })).toBeVisible()
})

test('home exposes loading and a partial provider outage without blocking the library', async ({ page, api }) => {
    let releaseDiscovery!: () => void
    api.discoveryGate = new Promise<void>(resolve => { releaseDiscovery = resolve })
    api.discovery.upcoming = { games: [], available: false, updatedAt: null }
    await useVisualSession(page)
    await page.goto('/home')
    await expect(page.getByRole('status', { name: 'Carregando Populares na IGDB' })).toBeVisible()
    releaseDiscovery()
    await expect(page.getByRole('region', { name: 'Populares na IGDB' }).getByRole('link', { name: 'Buscar Elden Ring no catálogo' })).toBeVisible()
    await expect(page.getByText('Dados da IGDB indisponíveis no momento. Sua biblioteca continua acessível.')).toBeVisible()
    expect(api.calls).not.toContain('POST /api/library/import')
})

test('home has an empty journey action and remains within the mobile viewport', async ({ page, api, isMobile }) => {
    api.entries = []
    await useVisualSession(page)
    await page.goto('/home')
    await expect(page.getByText('Nenhum jogo em andamento ainda.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explorar jogos →' })).toBeVisible()
    if (isMobile) {
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
})

test('home is protected before its API requests run', async ({ page, api }) => {
    await page.goto('/home')
    await expect(page).toHaveURL(/\/login$/)
    expect(api.calls).toEqual([])
})
