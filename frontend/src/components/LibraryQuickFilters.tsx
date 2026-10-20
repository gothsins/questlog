import { motion } from 'motion/react'
import type { LibraryEntry } from '../types/library'

export type LibraryStatusFilter = 'ALL' | LibraryEntry['status']

const filters: { value: LibraryStatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'WISHLIST', label: 'Quero jogar' },
    { value: 'PLAYING', label: 'Jogando' },
    { value: 'COMPLETED', label: 'Concluídos' },
    { value: 'DROPPED', label: 'Abandonados' },
]

interface LibraryQuickFiltersProps {
    games: LibraryEntry[]
    selected: LibraryStatusFilter
    onSelect: (filter: LibraryStatusFilter) => void
    reducedMotion: boolean
}

function LibraryQuickFilters({ games, selected, onSelect, reducedMotion }: LibraryQuickFiltersProps) {
    const counts: Record<LibraryStatusFilter, number> = {
        ALL: games.length,
        WISHLIST: 0,
        PLAYING: 0,
        COMPLETED: 0,
        DROPPED: 0,
    }
    for (const game of games) counts[game.status] += 1

    return (
        <div className="library-quick-filters" role="group" aria-label="Filtros rápidos">
            {filters.map(({ value, label }) => (
                <button
                    key={value}
                    type="button"
                    className="library-quick-filters__button"
                    aria-pressed={selected === value}
                    onClick={() => onSelect(value)}
                >
                    {selected === value && (
                        <motion.span
                            className="library-quick-filters__indicator"
                            layoutId={reducedMotion ? undefined : 'library-active-filter'}
                            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 480, damping: 38 }}
                            aria-hidden="true"
                        />
                    )}
                    <span className="library-quick-filters__label">{label}</span>
                    <span className="library-quick-filters__count">{counts[value]}</span>
                </button>
            ))}
        </div>
    )
}

export default LibraryQuickFilters
