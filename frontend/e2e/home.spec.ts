import { test, expect, useVisualSession, libraryEntry } from './mockApi'

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
    await expect(page.getByRole('button', { name: 'Elden Ring está na biblioteca' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Adicionar Steam Peak Game à biblioteca' }).first()).toBeEnabled()
    expect(await page.locator('a button, button a').count()).toBe(0)
    if (process.env.HOME_DISCOVERY_CAPTURE === '1') {
        await page.screenshot({ path: `../docs/screenshots/home-discovery-${test.info().project.name}.jpg`, type: 'jpeg', quality: 78, fullPage: true })
    }
    await page.getByRole('link', { name: 'Ver detalhes de Elden Ring' }).click()
    await expect(page).toHaveURL(/\/games\/42$/)
    await page.getByRole('navigation', { name: 'Navegação estrutural' }).getByRole('link', { name: 'Biblioteca' }).click()
    await expect(page).toHaveURL(/\/library$/)
    await expect(page.getByRole('heading', { name: 'Minha biblioteca' })).toBeVisible()
    await page.getByRole('link', { name: 'Início' }).click()
    await page.getByRole('link', { name: 'Conhecer Future Game' }).click()
    await expect(page).toHaveURL(/\/games\/igdb\/199$/)
    await expect(page.getByRole('heading', { name: 'Future Game' })).toBeVisible()
    expect(api.calls).not.toContain('POST /api/library/import')
})

for (const [section, title, igdbId] of [
    ['Mais jogados na Steam', 'Steam Peak Game', 299],
    ['Na mira: FPS', 'First Person Game', 399],
    ['Cantinho Indie', 'Indie Game', 499],
    ['Populares na IGDB', 'Elden Ring', 99],
    ['Próximos lançamentos', 'Future Game', 199],
] as const) {
    test(`quick add imports ${title} from ${section} without navigating`, async ({ page, api, isMobile }) => {
        api.entries = []
        await useVisualSession(page)
        await page.goto('/home')
        const collection = page.getByRole('region', { name: section })
        const add = collection.getByRole('button', { name: `Adicionar ${title} à biblioteca` })
        await add.click()

        await expect(page).toHaveURL(/\/home$/)
        await expect(collection.getByRole('button', { name: `${title} está na biblioteca` })).toBeVisible()
        await expect(page.getByRole('status')).toContainText(`${title} foi adicionado`)
        expect(api.importedIgdbIds).toEqual([igdbId])
        expect(api.entries.find(entry => entry.igdbId === igdbId)?.status).toBe('WISHLIST')
        if (isMobile) {
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
        }
    })
}

test('hero quick add is independent from its details link', async ({ page, api }) => {
    api.entries = []
    await useVisualSession(page)
    await page.goto('/home')
    const hero = page.getByRole('region', { name: 'Descubra o que vem depois.' })
    await hero.getByRole('button', { name: 'Adicionar Steam Peak Game à biblioteca' }).click()
    await expect(page).toHaveURL(/\/home$/)
    await expect(hero.getByRole('button', { name: 'Steam Peak Game está na biblioteca' })).toBeVisible()
    expect(api.importedIgdbIds).toEqual([299])
    await hero.getByRole('link', { name: 'Conhecer Steam Peak Game' }).click()
    await expect(page).toHaveURL(/\/games\/igdb\/299$/)
    expect(api.importedIgdbIds).toEqual([299])
})

test('repeated IGDB identity synchronizes Hero and every collection after add and F5', async ({ page, api }) => {
    api.entries = []
    api.discovery.fps.games[1] = api.discovery.steam.games[0]
    await useVisualSession(page)
    await page.goto('/home')
    await page.getByRole('region', { name: 'Na mira: FPS' })
        .getByRole('button', { name: 'Adicionar Steam Peak Game à biblioteca' }).click()
    await expect(page.getByRole('button', { name: 'Steam Peak Game está na biblioteca' })).toHaveCount(3)
    expect(api.importedIgdbIds).toEqual([299])
    await page.reload()
    await expect(page.getByRole('button', { name: 'Steam Peak Game está na biblioteca' })).toHaveCount(3)
    expect(api.importedIgdbIds).toEqual([299])
})

test('a pending import blocks duplicate clicks and preserves the scroll position', async ({ page, api }) => {
    api.entries = []
    let finishImport!: () => void
    api.importGate = new Promise<void>(resolve => { finishImport = resolve })
    await useVisualSession(page)
    await page.goto('/home')
    const add = page.getByRole('region', { name: 'Cantinho Indie' })
        .getByRole('button', { name: 'Adicionar Indie Game à biblioteca' })
    await add.scrollIntoViewIfNeeded()
    const initialScroll = await page.evaluate(() => window.scrollY)
    await add.click()
    await expect(add).toBeDisabled()
    await expect(add).toContainText('Adicionando...')
    await add.evaluate((button: HTMLButtonElement) => button.click())
    finishImport()
    await expect(page.getByRole('button', { name: 'Indie Game está na biblioteca' })).toBeVisible()
    expect(api.importedIgdbIds).toEqual([499])
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - initialScroll)).toBeLessThan(100)
})

test('HTTP 409 only marks a game owned after a successful library refetch', async ({ page, api }) => {
    api.entries = []
    api.importStatus = 409
    api.importConflictEntry = { ...libraryEntry, id: 77, gameId: 177, igdbId: 299, title: 'Steam Peak Game' }
    await useVisualSession(page)
    await page.goto('/home')
    await page.getByRole('region', { name: 'Mais jogados na Steam' })
        .getByRole('button', { name: 'Adicionar Steam Peak Game à biblioteca' }).click()
    await expect(page.getByRole('button', { name: 'Steam Peak Game está na biblioteca' })).toHaveCount(2)
    await expect(page.getByRole('status')).toContainText('já está na sua biblioteca')
    expect(api.calls.filter(call => call === 'GET /api/library').length).toBeGreaterThan(1)
    expect(api.entries.find(entry => entry.igdbId === 299)?.gameId).toBe(177)
})

test('unconfirmed conflict and failed import preserve retry without false ownership', async ({ page, api }) => {
    api.entries = []
    api.importStatus = 409
    await useVisualSession(page)
    await page.goto('/home')
    const add = page.getByRole('region', { name: 'Mais jogados na Steam' })
        .getByRole('button', { name: 'Adicionar Steam Peak Game à biblioteca' })
    await add.click()
    await expect(page.getByRole('alert')).toContainText('Não foi possível confirmar Steam Peak Game')
    await expect(add).toBeEnabled()
    api.importStatus = 500
    await add.click()
    await expect(page.getByRole('alert')).toContainText('Não foi possível adicionar Steam Peak Game')
    await expect(add).toBeEnabled()
    api.importStatus = null
    await add.click()
    await expect(page.getByRole('button', { name: 'Steam Peak Game está na biblioteca' })).toHaveCount(2)
    expect(api.importedIgdbIds).toEqual([299, 299, 299])
})

for (const status of [401, 403]) {
    test(`expired session on quick add HTTP ${status} redirects to login`, async ({ page, api }) => {
        api.entries = []
        api.importStatus = status
        await useVisualSession(page)
        await page.goto('/home')
        await page.getByRole('region', { name: 'Mais jogados na Steam' })
            .getByRole('button', { name: 'Adicionar Steam Peak Game à biblioteca' }).click()
        await expect(page).toHaveURL(/\/login$/)
        expect(await page.evaluate(() => sessionStorage.getItem('questlog_token'))).toBeNull()
    })
}

test('library outage disables quick add until a successful retry', async ({ page, api }) => {
    api.entries = []
    api.libraryStatus = 503
    await useVisualSession(page)
    await page.goto('/home')
    const warning = page.getByRole('alert').filter({ hasText: 'Não foi possível verificar sua biblioteca' })
    await expect(warning).toBeVisible()
    const steam = page.getByRole('region', { name: 'Mais jogados na Steam' })
    await expect(steam.getByRole('button', { name: 'Adicionar Steam Peak Game à biblioteca' })).toBeDisabled()
    expect(api.importedIgdbIds).toEqual([])
    api.libraryStatus = null
    await warning.getByRole('button', { name: 'Tentar novamente' }).click()
    await steam.getByRole('button', { name: 'Adicionar Steam Peak Game à biblioteca' }).click()
    await expect(steam.getByRole('button', { name: 'Steam Peak Game está na biblioteca' })).toBeVisible()
    expect(api.importedIgdbIds).toEqual([299])
})

test('quick add and details remain separate keyboard controls', async ({ page, api }) => {
    api.entries = []
    await useVisualSession(page)
    await page.goto('/home')
    const steam = page.getByRole('region', { name: 'Mais jogados na Steam' })
    const add = steam.getByRole('button', { name: 'Adicionar Steam Peak Game à biblioteca' })
    await add.focus()
    await expect(add).toBeFocused()
    await page.keyboard.press('Space')
    await expect(steam.getByRole('button', { name: 'Steam Peak Game está na biblioteca' })).toBeVisible()
    await steam.getByRole('link', { name: 'Conhecer Steam Peak Game' }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/games\/igdb\/299$/)
    expect(api.importedIgdbIds).toEqual([299])
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
