import { test, expect, useVisualSession as seedVisualSession } from './mockApi'
import type { GameReview } from '../src/types/reviews'

const communityReview: GameReview = {
    id: 80,
    libraryEntryId: 90,
    gameId: 42,
    username: 'jogadora_exemplo',
    content: 'Uma aventura memorável.\nVoltaria a explorar tudo novamente.',
    rating: 8,
    createdAt: '2026-01-02T10:00:00',
    updatedAt: '2026-01-03T10:00:00',
}

const ownReview: GameReview = {
    ...communityReview,
    id: 101,
    libraryEntryId: 1,
    username: 'visual_user',
    content: 'Minha jornada foi intensa e recompensadora.',
    rating: 7,
    createdAt: '2026-01-02T12:00:00',
    updatedAt: '2026-01-02T12:00:00',
}

async function openDetails(page: import('@playwright/test').Page) {
    await seedVisualSession(page)
    await page.goto('/games/42')
    await expect(page.getByRole('heading', { name: 'Análises dos jogadores' })).toBeVisible()
}

test('community reviews show real fixture fields, line breaks, date and library rating beside Steam', async ({ page, api }) => {
    api.reviews = [communityReview]
    await openDetails(page)
    const card = page.locator('.quest-review-card')
    await expect(card).toHaveCount(1)
    await expect(card.getByText('jogadora_exemplo')).toBeVisible()
    await expect(card.getByLabel('Nota 8 de 10')).toBeVisible()
    await expect(card.getByText('Publicada em 02/01/2026 · Editada')).toBeVisible()
    await expect(card.locator('.quest-review-card__content')).toHaveCSS('white-space', 'pre-wrap')
    await expect(page.getByRole('heading', { name: 'Avaliações na Steam' })).toBeVisible()
    await expect(page.getByText('1 análise', { exact: true })).toBeVisible()
})

test('empty list and game outside library keep reading available but prohibit writing', async ({ page, api }) => {
    api.entries = []
    await openDetails(page)
    await expect(page.getByText('Ainda não há análises para este jogo.')).toBeVisible()
    await expect(page.getByText('Adicione este jogo à sua biblioteca')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explorar jogos' })).toHaveAttribute('href', '/explore')
    await expect(page.getByRole('button', { name: 'Escrever análise' })).toHaveCount(0)
    expect(api.calls).not.toContain('GET /api/library/1/review')
})

test('community load error can be retried without affecting Steam', async ({ page, api }) => {
    api.reviewListStatus = 503
    await openDetails(page)
    await expect(page.getByText('O servidor está indisponível. Tente novamente mais tarde.')).toBeVisible()
    api.reviewListStatus = null
    api.reviews = [communityReview]
    await page.locator('.quest-reviews__feed').getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.locator('.quest-review-card')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Avaliações na Steam' })).toBeVisible()
})

test('creates an analysis with the matching library entry and leaves the library rating intact', async ({ page, api }) => {
    api.entries[0].rating = 7
    await openDetails(page)
    await page.getByRole('button', { name: 'Escrever análise' }).click()
    await page.getByRole('textbox', { name: 'Sua análise' }).fill('  Uma experiência marcante e cheia de descobertas.  ')
    await page.getByRole('button', { name: 'Publicar análise' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Análise salva com sucesso.' })).toBeVisible()
    await expect(page.locator('.quest-review-card').getByLabel('Nota 7 de 10')).toBeVisible()
    expect(api.calls).toContain('PUT /api/library/1/review')
    expect(api.calls).not.toContain('PATCH /api/library/1')
})

test('confirmed create, edit and delete remain reflected in the feed when reconciliation fails', async ({ page, api }) => {
    await openDetails(page)
    await expect(page.getByText('Ainda não há análises para este jogo.')).toBeVisible()
    api.reviewListStatus = 503

    await page.getByRole('button', { name: 'Escrever análise' }).click()
    await page.getByRole('textbox', { name: 'Sua análise' }).fill('Esta análise foi publicada com confirmação do servidor.')
    await page.getByRole('button', { name: 'Publicar análise' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Análise salva com sucesso.' })).toBeVisible()
    await expect(page.locator('.quest-review-card')).toHaveCount(1)
    await expect(page.locator('.quest-review-card')).toContainText('Esta análise foi publicada')

    await page.getByRole('button', { name: 'Editar minha análise' }).click()
    await page.getByLabel('Editar sua análise').fill('Esta análise foi editada e confirmada pelo servidor.')
    await page.getByRole('button', { name: 'Salvar análise' }).click()
    await expect(page.locator('.quest-review-card')).toHaveCount(1)
    await expect(page.locator('.quest-review-card')).toContainText('Esta análise foi editada')

    await page.getByRole('button', { name: 'Excluir minha análise' }).click()
    await page.getByRole('dialog', { name: 'Excluir minha análise?' }).getByRole('button', { name: 'Excluir análise' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Análise excluída com sucesso.' })).toBeVisible()
    await expect(page.locator('.quest-review-card')).toHaveCount(0)
    await expect(page.getByText('Ainda não há análises para este jogo.')).toBeVisible()
    expect(api.calls.filter((call) => call === 'GET /api/games/42/reviews').length).toBeGreaterThan(1)
})

test('library rating save refreshes the game review feed on return to details', async ({ page, api }) => {
    api.entries[0].rating = 7
    api.myReview = { ...ownReview }
    api.reviews = [{ ...ownReview }, communityReview]
    await openDetails(page)
    await expect(page.locator('.quest-review-card').filter({ hasText: 'visual_user' }).getByLabel('Nota 7 de 10')).toBeVisible()

    await page.getByRole('link', { name: 'Biblioteca', exact: true }).click()
    await expect(page).toHaveURL(/\/library$/)
    await page.getByRole('button', { name: 'Gerenciar' }).click()
    await page.getByRole('button', { name: '★ Editar avaliação' }).click()
    await page.getByRole('textbox', { name: 'Nota (0 a 10)' }).fill('9')
    api.reviewListStatus = 503
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Avaliação e horas salvas' })).toBeVisible()
    await page.getByRole('link', { name: 'Elden Ring', exact: true }).click()
    await expect(page).toHaveURL(/\/games\/42$/)
    await expect(page.getByText('Sua nota:')).toContainText('9 / 10')
    await expect(page.locator('.quest-review-card').filter({ hasText: 'visual_user' }).getByLabel('Nota 9 de 10')).toBeVisible()
    await expect(page.locator('.quest-review-card')).toHaveCount(2)
    expect(api.calls).toContain('PATCH /api/library/1')
})

test('edits own analysis through the authenticated endpoint without matching usernames', async ({ page, api }) => {
    api.myReview = { ...ownReview }
    api.reviews = [{ ...ownReview }, communityReview]
    await openDetails(page)
    await page.getByRole('button', { name: 'Editar minha análise' }).click()
    await expect(page.getByLabel('Editar sua análise')).toHaveValue(ownReview.content)
    await page.getByLabel('Editar sua análise').fill('Atualizei minha análise depois de terminar o jogo.')
    await page.getByRole('button', { name: 'Salvar análise' }).click()
    await expect(page.locator('.quest-review-card').filter({ hasText: 'visual_user' })).toContainText('Atualizei minha análise')
    expect(api.calls).toContain('GET /api/library/1/review')
})

test('delete confirmation supports cancellation and only removes after success', async ({ page, api }) => {
    api.myReview = { ...ownReview }
    api.reviews = [{ ...ownReview }]
    await openDetails(page)
    await page.getByRole('button', { name: 'Excluir minha análise' }).click()
    const dialog = page.getByRole('dialog', { name: 'Excluir minha análise?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(dialog).toBeHidden()
    expect(api.calls).not.toContain('DELETE /api/library/1/review')
    await page.getByRole('button', { name: 'Excluir minha análise' }).click()
    await dialog.getByRole('button', { name: 'Excluir análise' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Análise excluída com sucesso.' })).toBeVisible()
    await expect(page.locator('.quest-review-card')).toHaveCount(0)
    expect(api.calls).toContain('DELETE /api/library/1/review')
})

test('failed deletion keeps the published analysis available', async ({ page, api }) => {
    api.myReview = { ...ownReview }
    api.reviews = [{ ...ownReview }]
    api.reviewDeleteStatus = 503
    await openDetails(page)
    await page.getByRole('button', { name: 'Excluir minha análise' }).click()
    await page.getByRole('dialog', { name: 'Excluir minha análise?' }).getByRole('button', { name: 'Excluir análise' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'servidor está indisponível' })).toBeVisible()
    await expect(page.locator('.quest-review-card')).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Excluir minha análise' })).toBeVisible()
})

test('validates both length limits and preserves the draft after a failed publication', async ({ page, api }) => {
    await openDetails(page)
    await page.getByRole('button', { name: 'Escrever análise' }).click()
    const editor = page.getByRole('textbox', { name: 'Sua análise' })
    await editor.fill('  curto  ')
    await page.getByRole('button', { name: 'Publicar análise' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'pelo menos 20 caracteres' })).toBeVisible()
    await editor.fill('x'.repeat(2001))
    await expect(page.getByRole('alert').filter({ hasText: 'no máximo 2.000 caracteres' })).toBeVisible()
    expect(api.calls).not.toContain('PUT /api/library/1/review')
    const draft = 'Este texto é válido, mas a operação falhará.'
    await editor.fill(draft)
    api.reviewSaveStatus = 503
    await page.getByRole('button', { name: 'Publicar análise' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'servidor está indisponível' })).toBeVisible()
    await expect(editor).toHaveValue(draft)
    api.reviewSaveStatus = null
    await page.getByRole('button', { name: 'Publicar análise' }).click()
    await expect(page.locator('.quest-review-card')).toContainText([draft])
})

test('normal missing review is distinct from infrastructure failure and invalid session redirects', async ({ page, api }) => {
    api.myReviewStatus = 503
    await openDetails(page)
    await expect(page.getByRole('alert').filter({ hasText: 'servidor está indisponível' })).toBeVisible()
    api.myReviewStatus = null
    await page.locator('.quest-reviews__mine').getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('button', { name: 'Escrever análise' })).toBeVisible()
    api.myReviewStatus = 401
    await page.reload()
    await expect(page).toHaveURL(/\/login$/)
})

test('review layout has no mobile horizontal overflow', async ({ page, api }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile viewport only')
    api.reviews = [{ ...communityReview, content: 'palavra'.repeat(180) }]
    await openDetails(page)
    await expect(page.locator('.quest-review-card')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)
})

test('cancelled review requests preserve AbortError for TanStack Query', async ({ page, api }) => {
    await page.goto('/')
    const errorName = await page.evaluate(async () => {
        const modulePath = '/src/api/reviews.ts'
        const { getGameReviews } = await import(/* @vite-ignore */ modulePath)
        const controller = new AbortController()
        controller.abort()
        try {
            await getGameReviews(42, controller.signal)
            return 'unexpected success'
        } catch (error) {
            return error instanceof Error ? error.name : 'unexpected error'
        }
    })
    expect(errorName).toBe('AbortError')
    expect(api.calls).toEqual([])
})
