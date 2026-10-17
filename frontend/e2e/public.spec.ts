import { test, expect } from './mockApi'

test('landing tour has manual scenes and public navigation', async ({ page, api }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Todo jogo tem uma história/ })).toBeVisible()
    const scenes = page.getByRole('group', { name: 'Escolher cena' })
    await scenes.getByRole('button', { name: /Adicionar/ }).click()
    await expect(scenes.getByRole('button', { name: /Adicionar/ })).toHaveAttribute('aria-pressed', 'true')
    await scenes.getByRole('button', { name: /Acompanhar/ }).click()
    await expect(page.getByLabel('Controles da demonstração')).toBeVisible()
    await page.getByRole('button', { name: 'Reiniciar demonstração' }).click()
    await expect(scenes.getByRole('button', { name: /Descobrir/ })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('link', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.getByRole('link', { name: /Criar minha conta/ }).click()
    await expect(page).toHaveURL(/\/register$/)
    expect(api.calls).toEqual([])
})

test('registration rejects an overlong UTF-8 password without calling the API', async ({ page, api }) => {
    await page.goto('/register')
    await page.getByRole('textbox', { name: 'Usuário' }).fill('visual_user')
    await page.getByLabel('Senha', { exact: true }).fill('🔒'.repeat(19))
    await page.getByLabel('Confirmar senha').fill('🔒'.repeat(19))
    await page.getByRole('button', { name: /Criar minha conta/ }).click()
    await expect(page.getByRole('alert')).toContainText('72 bytes')
    expect(api.calls).toEqual([])
})

test('registration and login show controlled API errors', async ({ page, api }) => {
    await page.goto('/register')
    await page.getByRole('textbox', { name: 'Usuário' }).fill('visual_user')
    await page.getByLabel('Senha', { exact: true }).fill('exemplo-ficticio-2026')
    await page.getByLabel('Confirmar senha').fill('exemplo-ficticio-2026')
    await page.getByRole('button', { name: /Criar minha conta/ }).click()
    await expect(page.getByRole('alert')).toContainText('Não foi possível verificar a segurança')
    await page.getByRole('link', { name: /Entrar no Questlog/ }).click()
    await page.getByRole('textbox', { name: 'Usuário' }).fill('visual_user')
    await page.getByLabel('Senha', { exact: true }).fill('exemplo-ficticio-2026')
    await page.getByRole('button', { name: /Entrar no Questlog/ }).click()
    await expect(page.getByRole('alert')).toContainText('Usuário ou senha inválidos')
    expect(api.calls).toEqual(['POST /api/auth/register', 'POST /api/auth/login'])
})

test('protected library redirects visitors without a session', async ({ page, api }) => {
    await page.goto('/library')
    await expect(page).toHaveURL(/\/login$/)
    expect(api.calls).toEqual([])
})

test('unexpected external HTTP and WebSocket destinations are blocked', async ({ page, api }) => {
    await page.goto('/')
    const httpRejected = await page.evaluate(async () => {
        try {
            await fetch('https://unexpected.invalid/questlog-probe')
            return false
        } catch {
            return true
        }
    })
    expect(httpRejected).toBe(true)
    api.assertBlocked('GET https://unexpected.invalid/questlog-probe')

    const apiRejected = await page.evaluate(async () => {
        try {
            await fetch('http://127.0.0.1:8080/api/unexpected')
            return false
        } catch {
            return true
        }
    })
    expect(apiRejected).toBe(true)
    api.assertBlocked('GET http://127.0.0.1:8080/api/unexpected')

    const socketClosed = await page.evaluate(() => new Promise<boolean>((resolve) => {
        const socket = new WebSocket('wss://unexpected.invalid/questlog-probe')
        socket.addEventListener('open', () => resolve(false), { once: true })
        socket.addEventListener('close', () => resolve(true), { once: true })
    }))
    expect(socketClosed).toBe(true)
    api.assertBlocked('WS wss://unexpected.invalid/questlog-probe')
})

test('mobile public pages do not overflow horizontally', async ({ page, api }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile viewport only')
    for (const path of ['/', '/login', '/register']) {
        await page.goto(path)
        await expect(page.locator('body')).toBeVisible()
        const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth > window.innerWidth + 1)
        expect(overflow, `${path} has horizontal overflow`).toBe(false)
    }
    expect(api.calls).toEqual([])
})
