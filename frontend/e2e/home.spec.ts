import { test, expect, useVisualSession } from './mockApi'

test('authenticated home separates IGDB discovery from personal game IDs', async ({ page, api }) => {
    api.entries = [{ ...api.entries[0], status: 'PLAYING', rating: 8, hoursPlayed: 12 }]
    await useVisualSession(page)
    await page.goto('/home')
    await expect(page.getByRole('heading', { name: 'Populares na IGDB' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Próximos lançamentos' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mais jogados na Steam' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Na mira: FPS' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cantinho Indie' })).toBeVisible()
    await expect(page.getByText('EM DESTAQUE · IGDB PopScore · pico Steam em 24 horas')).toBeVisible()
    await expect(page.getByText('12h registradas · Nota 8/10')).toBeVisible()
    if (process.env.HOME_DISCOVERY_CAPTURE === '1') {
        await page.screenshot({ path: `../docs/screenshots/home-discovery-${test.info().project.name}.jpg`, type: 'jpeg', quality: 78, fullPage: true })
    }
    await page.getByRole('link', { name: 'Ver detalhes de Elden Ring' }).click()
    await expect(page).toHaveURL(/\/games\/42$/)
    await page.getByRole('navigation', { name: 'Navegação estrutural' }).getByRole('link', { name: 'Biblioteca' }).click()
    await expect(page).toHaveURL(/\/library$/)
    await page.getByRole('link', { name: 'Início' }).click()
    await page.getByRole('link', { name: 'Conhecer Future Game' }).click()
    await expect(page).toHaveURL(/\/games\/igdb\/199$/)
    await expect(page.getByRole('heading', { name: 'Future Game' })).toBeVisible()
    expect(api.calls).not.toContain('POST /api/library/import')
})

test('each new collection opens IGDB details without importing a game', async ({ page, api }) => {
    await useVisualSession(page)
    for (const [title, id] of [
        ['Steam Peak Game', 299], ['First Person Game', 399], ['Indie Game', 499],
    ] as const) {
        await page.goto('/home')
        await page.getByRole('link', { name: `Conhecer ${title}` }).last().click()
        await expect(page).toHaveURL(new RegExp(`/games/igdb/${id}$`))
        await expect(page.getByRole('heading', { name: title })).toBeVisible()
    }
    expect(api.calls).not.toContain('POST /api/library/import')
})

test('one unavailable collection leaves the other sections and journey intact', async ({ page, api }) => {
    api.discovery.steam = { available: false, games: [], updatedAt: null }
    api.entries = [{ ...api.entries[0], status: 'PLAYING' }]
    await useVisualSession(page)
    await page.goto('/home')
    await expect(page.getByRole('region', { name: 'Mais jogados na Steam' })
        .getByText('Dados da IGDB indisponíveis')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Conhecer First Person Game' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Conhecer Indie Game' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver detalhes de Elden Ring' })).toBeVisible()
})

test('new collections support keyboard focus and reduced motion', async ({ page, api }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await useVisualSession(page)
    await page.goto('/home')
    const steam = page.getByRole('region', { name: 'Mais jogados na Steam' })
        .getByRole('link', { name: 'Conhecer Steam Peak Game' })
    await steam.focus()
    await expect(steam).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/games\/igdb\/299$/)
    expect(api.calls).not.toContain('POST /api/library/import')
})

test('reloading the home keeps discovery separate from personal library writes', async ({ page, api, isMobile }) => {
    await useVisualSession(page)
    await page.goto('/home')
    await expect(page.getByRole('link', { name: 'Conhecer Indie Game' })).toBeVisible()
    const readsBeforeReload = api.calls.filter(call => call === 'GET /api/discovery/home').length
    await page.reload()
    await expect(page.getByRole('link', { name: 'Conhecer Steam Peak Game' }).last()).toBeVisible()
    expect(api.calls.filter(call => call === 'GET /api/discovery/home').length).toBeGreaterThan(readsBeforeReload)
    expect(api.calls).not.toContain('POST /api/library/import')
    if (isMobile) {
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
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
    await expect(page.getByRole('region', { name: 'Populares na IGDB' }).getByRole('link', { name: 'Conhecer Elden Ring' })).toBeVisible()
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
