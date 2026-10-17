import { test, expect, useVisualSession } from './mockApi'

test('mocked login opens library and can update a game status', async ({ page, api }) => {
    api.loginSucceeds = true
    await page.goto('/login')
    await page.getByRole('textbox', { name: 'Usuário' }).fill('visual_user')
    await page.getByLabel('Senha', { exact: true }).fill('exemplo-ficticio-2026')
    await page.getByRole('button', { name: /Entrar no Questlog/ }).click()
    await expect(page).toHaveURL(/\/library$/)
    await expect(page.getByRole('heading', { name: 'Minha biblioteca' })).toBeVisible()
    await page.getByLabel('Estado do jogo').selectOption('PLAYING')
    await expect(page.getByText('Jogando', { exact: true }).first()).toBeVisible()
    expect(api.calls).toContain('PATCH /api/library/1')
})

test('expired mocked session redirects and clears access', async ({ page, api }) => {
    api.libraryUnauthorized = true
    await useVisualSession(page)
    await page.goto('/library')
    await expect(page).toHaveURL(/\/login$/)
    const token = await page.evaluate(() => sessionStorage.getItem('questlog_token'))
    expect(token).toBeNull()
})

test('explore search and library import use only local fixtures', async ({ page, api }) => {
    api.entries = []
    await useVisualSession(page)
    await page.goto('/explore')
    await page.getByLabel('Buscar no catálogo').fill('Elden Ring')
    await page.getByRole('button', { name: 'Buscar jogos' }).click()
    await expect(page.getByRole('heading', { name: /Resultados para/ })).toBeVisible()
    await page.getByRole('button', { name: /Adicionar à biblioteca/ }).click()
    await expect(page.getByRole('status').filter({ hasText: /foi adicionado/ })).toBeVisible()
    await page.getByRole('link', { name: 'Biblioteca', exact: true }).click()
    await expect(page).toHaveURL(/\/library$/)
    await expect(page.getByRole('heading', { name: 'Elden Ring', exact: true })).toBeVisible()
    expect(api.calls).toContain('POST /api/library/import')
})

test('game details gallery supports keyboard and lightbox', async ({ page, api }) => {
    await useVisualSession(page)
    await page.goto('/games/42')
    await expect(page.getByRole('heading', { name: 'Elden Ring' })).toBeVisible()
    const gallery = page.getByRole('region', { name: 'Explore cada detalhe' })
    await expect(gallery.locator('.game-gallery__count')).toHaveText('1 / 2')
    await gallery.getByRole('button', { name: /Mostrar imagem 2/ }).click()
    await expect(gallery.locator('.game-gallery__count')).toHaveText('2 / 2')
    await gallery.getByRole('button', { name: /Ampliar imagem 2/ }).click()
    const dialog = page.getByRole('dialog', { name: /Galeria de imagens/ })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Imagem anterior' }).click()
    await expect(dialog.getByText('1 / 2')).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(dialog.getByText('2 / 2')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    expect(api.calls).toContain('GET /api/games/42/media')
})

test('game details exposes external-data and game-load errors', async ({ page, api }) => {
    await useVisualSession(page)
    api.mediaFails = true
    await page.goto('/games/42')
    await expect(page.getByText('Não foi possível carregar as informações extras.')).toBeVisible()
    api.gameFails = true
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Não foi possível carregar o jogo' })).toBeVisible()
})
