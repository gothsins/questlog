import { authenticatedFetch } from './client'
import type { LibraryEntry } from '../types/library'
import type { GameReview } from '../types/reviews'

export class ReviewApiError extends Error {
    readonly status: number | null

    constructor(status: number | null) {
        super('REVIEW_REQUEST_FAILED')
        this.status = status
    }
}

async function request(path: string, options: RequestInit = {}) {
    try {
        const response = await authenticatedFetch(path, options)
        if (!response.ok) throw new ReviewApiError(response.status)
        return response
    } catch (error) {
        if (error instanceof ReviewApiError) throw error
        throw new ReviewApiError(null)
    }
}

export async function getGameReviews(gameId: number, signal?: AbortSignal) {
    const response = await request(`/api/games/${gameId}/reviews`, { signal })
    return (await response.json()) as GameReview[]
}

export async function getReviewLibrary(signal?: AbortSignal) {
    const response = await request('/api/library', { signal })
    return (await response.json()) as LibraryEntry[]
}

export async function getMyReview(entryId: number, signal?: AbortSignal) {
    try {
        const response = await request(`/api/library/${entryId}/review`, { signal })
        return (await response.json()) as GameReview
    } catch (error) {
        if (error instanceof ReviewApiError && error.status === 404) return null
        throw error
    }
}

export async function saveMyReview(entryId: number, content: string) {
    const response = await request(`/api/library/${entryId}/review`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
    })
    return (await response.json()) as GameReview
}

export async function deleteMyReview(entryId: number) {
    await request(`/api/library/${entryId}/review`, { method: 'DELETE' })
}

export function reviewErrorMessage(error: unknown, action: 'load' | 'save' | 'delete') {
    const status = error instanceof ReviewApiError ? error.status : null
    if (status === 400) return 'A análise não atende aos limites de 20 a 2.000 caracteres.'
    if (status === 401) return 'Sua sessão expirou. Entre novamente para continuar.'
    if (status === 403) return 'Você não tem permissão para realizar esta ação.'
    if (status === 404) return 'O jogo ou a análise não foi encontrado. Atualize a página e tente novamente.'
    if (status === 429) return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
    if (status === 500 || status === 503) return 'O servidor está indisponível. Tente novamente mais tarde.'
    if (status === null) return 'Falha de conexão. Verifique sua rede e tente novamente.'
    return action === 'load'
        ? 'Não foi possível carregar as análises. Tente novamente.'
        : action === 'save'
          ? 'Não foi possível salvar sua análise. Tente novamente.'
          : 'Não foi possível excluir sua análise. Tente novamente.'
}
