import { useQuery } from '@tanstack/react-query'
import { authenticatedFetch } from './client'
import type { LibraryEntry } from '../types/library'

export const LIBRARY_QUERY_KEY = ['library'] as const
export const SESSION_EXPIRED = 'SESSION_EXPIRED'

export type LibraryEntryChanges = {
    status?: LibraryEntry['status']
    rating?: number
    hoursPlayed?: number
}

function isUnauthorized(status: number) {
    return status === 401 || status === 403
}

export async function fetchLibrary(signal?: AbortSignal): Promise<LibraryEntry[]> {
    const response = await authenticatedFetch('/api/library', { signal })
    if (isUnauthorized(response.status)) throw new Error(SESSION_EXPIRED)
    if (!response.ok) throw new Error('LIBRARY_UNAVAILABLE')
    return response.json() as Promise<LibraryEntry[]>
}

export async function importIgdbGame(igdbId: number): Promise<LibraryEntry> {
    const response = await authenticatedFetch('/api/library/import', {
        method: 'POST',
        body: JSON.stringify({ igdbId }),
    })
    if (isUnauthorized(response.status)) throw new Error(SESSION_EXPIRED)
    if (response.status === 409) throw new Error('ALREADY_IN_LIBRARY')
    if (!response.ok) throw new Error('IMPORT_FAILED')
    return response.json() as Promise<LibraryEntry>
}

export async function patchLibraryEntry(
    entryId: number,
    changes: LibraryEntryChanges,
): Promise<LibraryEntry> {
    const response = await authenticatedFetch(`/api/library/${entryId}`, {
        method: 'PATCH',
        body: JSON.stringify(changes),
    })
    if (isUnauthorized(response.status)) throw new Error(SESSION_EXPIRED)
    if (!response.ok) throw new Error('UPDATE_FAILED')
    return response.json() as Promise<LibraryEntry>
}

export function useLibraryQuery(options: { enabled?: boolean; staleTime?: number } = {}) {
    return useQuery<LibraryEntry[]>({
        queryKey: LIBRARY_QUERY_KEY,
        queryFn: ({ signal }) => fetchLibrary(signal),
        staleTime: options.staleTime ?? 30_000,
        enabled: options.enabled ?? true,
        retry: false,
    })
}
