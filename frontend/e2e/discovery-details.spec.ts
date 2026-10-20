import { test, expect, useVisualSession, libraryEntry } from './mockApi'

test('viewing discovery details is read only and keeps IGDB and internal IDs separate', async ({ page, api, isMobile }) => {
    api.entries = []
    await useVisualSession(page)
    await page.goto('/home')
    await page.getByRole('link', { name: 'Conhecer Elden Ring' }).first().click()
    await expect(page).toHaveURL(/\/games\/igdb\/99$/)
    await expect(page.getByRole('heading', { name: 'Elden Ring' })).toBeVisible()
    await expect(page.getByText('Uma jornada por terras desconhecidas.')).toBeVisible()
    await expect(page.getByLabel('Gêneros')).toContainText('RPG')
    await expect(page.getByRole('heading', { name: 'Explore cada detalhe' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Trailer' })).toBeVisible()
    if (process.env.DISCOVERY_DETAILS_CAPTURE === '1') {
        await page.screenshot({ path: `../docs/screenshots/discovery-details-${test.info().project.name}.jpg`, type: 'jpeg', quality: 78, fullPage: true })
    }
    await page.reload()
    await expect(page.getByRole('button', { name: 'Adicionar à biblioteca' })).toBeVisible()
    expect(api.calls).not.toContain('POST /api/library/import')
    expect(api.calls).not.toContain('GET /api/games/99/reviews')
    expect(api.calls).not.toContain('GET /api/games/99/steam-reviews')
    expect(api.calls).not.toContain('GET /api/games/42')
    if (isMobile) expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('Explore artwork and title open details without importing', async ({ page, api }) => {
    await useVisualSession(page)
    await page.goto('/explore?q=Elden%20Ring')
    await page.getByRole('link', { name: 'Conhecer Elden Ring' }).click()
    await expect(page).toHaveURL(/\/games\/igdb\/99$/)
    await page.goBack()
    await page.getByRole('link', { name: 'Elden Ring', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/games\/igdb\/99$/)
    expect(api.calls).not.toContain('POST /api/library/import')
})

test('uncollected game imports only on explicit action and uses returned internal ID', async ({ page, api }) => {
    await useVisualSession(page)
    await page.goto('/games/igdb/199')
    await expect(page.getByRole('heading', { name: 'Future Game' })).toBeVisible()
    await expect(page.getByText('Data não informada')).toBeVisible()
    await expect(page.getByText('Este jogo ainda não tem capturas')).toBeVisible()
    expect(api.calls).not.toContain('POST /api/library/import')
    await page.getByRole('button', { name: 'Adicionar à biblioteca' }).click()
    await expect(page).toHaveURL(/\/games\/143$/)
    expect(api.calls).toContain('POST /api/library/import')
    expect(api.entries.find(entry => entry.igdbId === 199)?.gameId).toBe(143)
})

test('existing library entry shows internal link without duplicate import', async ({ page, api }) => {
    await useVisualSession(page)
    await page.goto('/games/igdb/99')
    await expect(page.getByText('Na sua biblioteca')).toBeVisible()
    await page.getByRole('link', { name: 'Abrir detalhes da coleção' }).click()
    await expect(page).toHaveURL(/\/games\/42$/)
    expect(api.calls).not.toContain('POST /api/library/import')
})

test('import conflict refetches library and resolves its real entry', async ({ page, api }) => {
    api.entries = []
    api.importStatus = 409
    await useVisualSession(page)
    await page.goto('/games/igdb/99')
    await expect(page.getByRole('button', { name: 'Adicionar à biblioteca' })).toBeEnabled()
    api.entries = [{ ...libraryEntry }]
    await page.getByRole('button', { name: 'Adicionar à biblioteca' }).click()
    await expect(page.getByText('Esse jogo já está na sua biblioteca.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Abrir detalhes da coleção' })).toHaveAttribute('href', '/games/42')
})

test('unresolved import conflict never invents a local ID', async ({ page, api }) => {
    api.entries = []
    api.importStatus = 409
    await useVisualSession(page)
    await page.goto('/games/igdb/99')
    await page.getByRole('button', { name: 'Adicionar à biblioteca' }).click()
    await expect(page.getByText('O jogo já está na biblioteca, mas não foi possível recuperar')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Abrir detalhes da coleção' })).toHaveCount(0)
})

test('unavailable provider and import failure preserve the page', async ({ page, api }) => {
    api.entries = []
    api.discoveryDetailsStatus = 503
    await useVisualSession(page)
    await page.goto('/games/igdb/99')
    await expect(page.getByRole('heading', { name: 'IGDB indisponível no momento' })).toBeVisible()
    api.discoveryDetailsStatus = null
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { name: 'Elden Ring' })).toBeVisible()
    api.importStatus = 503
    await page.getByRole('button', { name: 'Adicionar à biblioteca' }).click()
    await expect(page.getByRole('status')).toContainText('Não foi possível adicionar')
    await expect(page.getByRole('heading', { name: 'Elden Ring' })).toBeVisible()
})

test('invalid and missing IDs show controlled states', async ({ page, api }) => {
    await useVisualSession(page)
    await page.goto('/games/igdb/0')
    await expect(page.getByRole('alert')).toContainText('Jogo inválido')
    api.discoveryDetailsStatus = 404
    await page.goto('/games/igdb/99')
    await expect(page.getByRole('heading', { name: 'Jogo não encontrado' })).toBeVisible()
})

test('expired session redirects and keyboard can reach the discovery action', async ({ page, api }) => {
    api.entries = []
    await useVisualSession(page)
    await page.goto('/games/igdb/99')
    await page.getByRole('button', { name: 'Adicionar à biblioteca' }).focus()
    await expect(page.getByRole('button', { name: 'Adicionar à biblioteca' })).toBeFocused()
    api.libraryUnauthorized = true
    await page.reload()
    await expect(page).toHaveURL(/\/login$/)
})
