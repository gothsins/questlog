import { test, expect, useVisualSession } from './mockApi'

test('mocked login opens home and can update a game status', async ({ page, api }) => {
    api.loginSucceeds = true
    await page.goto('/login')
    await page.getByRole('textbox', { name: 'Usuário' }).fill('visual_user')
    await page.getByLabel('Senha', { exact: true }).fill('exemplo-ficticio-2026')
    await page.getByRole('button', { name: /Entrar no Questlog/ }).click()
    await expect(page).toHaveURL(/\/home$/)
    await page.getByRole('link', { name: 'Biblioteca', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Minha biblioteca' })).toBeVisible()
    await page.getByRole('button', { name: 'Gerenciar' }).click()
    await page.getByLabel('Estado do jogo').selectOption('PLAYING')
    await expect(page.getByText('Jogando', { exact: true }).first()).toBeVisible()
    expect(api.calls).toContain('PATCH /api/library/1')
})

test('library offers exactly four statuses and filters Quero jogar', async ({ page, api }) => {
    await useVisualSession(page)
    await page.goto('/library')

    const status = page.getByLabel('Estado do jogo')
    const filter = page.getByLabel('Estado', { exact: true })
    await page.getByRole('button', { name: 'Gerenciar' }).click()
    await expect(status).toHaveValue('WISHLIST')
    await expect(page.locator('.status-badge')).toHaveText('Quero jogar')
    await expect(status.locator('option')).toHaveText([
        'Quero jogar', 'Jogando', 'Concluído', 'Abandonado',
    ])
    await filter.selectOption('WISHLIST')
    await expect(page.getByRole('heading', { name: 'Elden Ring' })).toBeVisible()
    await filter.selectOption('COMPLETED')
    await expect(page.getByRole('heading', { name: 'Elden Ring' })).toHaveCount(0)
    await filter.selectOption('ALL')
    if (!(await status.isVisible())) {
        await page.getByRole('button', { name: 'Gerenciar' }).click()
    }

    for (const value of ['PLAYING', 'COMPLETED', 'DROPPED', 'WISHLIST'] as const) {
        await status.selectOption(value)
        await expect(status).toHaveValue(value)
    }
    expect(api.libraryPatches.map((patch) => patch.status)).toEqual([
        'PLAYING', 'COMPLETED', 'DROPPED', 'WISHLIST',
    ])
    expect(api.libraryPatches.some((patch) => String(patch.status) === 'BACKLOG')).toBe(false)
})

test('expired mocked session redirects and clears access', async ({ page, api }) => {
    api.libraryUnauthorized = true
    await useVisualSession(page)
    await page.goto('/library')
    await expect(page).toHaveURL(/\/login$/)
    const token = await page.evaluate(() => sessionStorage.getItem('questlog_token'))
    expect(token).toBeNull()
})

test('profile protects access, retries a failed load and keeps the saved nickname', async ({ page, api }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login$/)
    expect(api.calls).toEqual([])

    await useVisualSession(page)
    api.profileStatus = 503
    await page.goto('/profile')
    await expect(page.getByRole('alert')).toContainText('Não foi possível carregar seu perfil.')
    api.profileStatus = null
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { name: 'Meu perfil' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Apelido' }).fill('visual_nick')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(page.getByRole('status')).toContainText('Apelido atualizado com sucesso!')
    await expect(page.getByRole('textbox', { name: 'Apelido' })).toHaveValue('visual_nick')
    await expect(page.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled()
    expect(api.calls).toContain('PATCH /api/users/me')
})

test('expired profile session redirects and removes the token', async ({ page, api }) => {
    await useVisualSession(page)
    api.profileStatus = 401
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login$/)
    expect(await page.evaluate(() => sessionStorage.getItem('questlog_token'))).toBeNull()
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
    await expect(page.locator('.status-badge')).toHaveText('Quero jogar')
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
