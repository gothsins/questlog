export type LibraryViewMode = 'hybrid' | 'covers'

export const LIBRARY_VIEW_STORAGE_KEY = 'questlog.library.view.v1'

export function readLibraryViewMode(): LibraryViewMode {
    try {
        if (typeof window !== 'undefined' && window.localStorage.getItem(LIBRARY_VIEW_STORAGE_KEY) === 'covers') {
            return 'covers'
        }
    } catch {
        // A preferência visual não deve impedir o uso da biblioteca.
    }
    return 'hybrid'
}

export function saveLibraryViewMode(mode: LibraryViewMode): void {
    try {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(LIBRARY_VIEW_STORAGE_KEY, mode)
        }
    } catch {
        // Navegação privada ou armazenamento bloqueado: mantém o estado em memória.
    }
}
