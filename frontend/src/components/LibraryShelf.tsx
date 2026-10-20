import { forwardRef, memo, useCallback, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useIsPresent } from 'motion/react'
import type { LibraryEntry } from '../types/library'
import type { LibraryViewMode } from './libraryViewPreference'
import GameCard from './GameCard'
import type { GameCardDraftState } from './GameCard'

interface LibraryShelfProps {
    games: LibraryEntry[]
    viewMode: LibraryViewMode
    reducedMotion: boolean
    pendingUpdate: { id: number; status?: LibraryEntry['status'] } | null
    onStatusChange: (entryId: number, status: LibraryEntry['status']) => void
    onSaveDetails: (entryId: number, details: { rating?: number; hoursPlayed: number }) => Promise<boolean>
}

interface ShelfItemProps {
    game: LibraryEntry
    index: number
    viewMode: LibraryViewMode
    reducedMotion: boolean
    pendingUpdate: LibraryShelfProps['pendingUpdate']
    onStatusChange: LibraryShelfProps['onStatusChange']
    onSaveDetails: LibraryShelfProps['onSaveDetails']
    draft?: GameCardDraftState
    onDraftChange: (entryId: number, draft: GameCardDraftState) => void
}

const ShelfItem = memo(forwardRef<HTMLDivElement, ShelfItemProps>(function ShelfItem({
    game, index, viewMode, reducedMotion, pendingUpdate, onStatusChange, onSaveDetails, draft, onDraftChange,
}, ref) {
    const isPresent = useIsPresent()
    return (
        <motion.div
            ref={ref}
            className="library-grid__item"
            layout={reducedMotion ? false : 'position'}
            initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0, transition: { duration: 0 } } : {
                opacity: 0, scale: 0.97, transition: { duration: 0.22, ease: 'easeOut' },
            }}
            transition={reducedMotion ? { duration: 0 } : {
                layout: { type: 'spring', stiffness: 390, damping: 36, mass: 0.8 },
                opacity: { duration: 0.22, delay: Math.min(index, 8) * 0.018 },
                y: { duration: 0.22, delay: Math.min(index, 8) * 0.018 },
                scale: { duration: 0.22 },
            }}
            inert={!isPresent}
            aria-hidden={!isPresent}
        >
            <GameCard
                game={game}
                viewMode={viewMode}
                draft={draft}
                onDraftChange={onDraftChange}
                isSaving={pendingUpdate?.id === game.id}
                disabled={pendingUpdate !== null}
                pendingStatus={pendingUpdate?.id === game.id ? pendingUpdate.status : undefined}
                onStatusChange={onStatusChange}
                onSaveDetails={onSaveDetails}
            />
        </motion.div>
    )
}))

function LibraryShelf({ games, viewMode, reducedMotion, pendingUpdate, onStatusChange, onSaveDetails }: LibraryShelfProps) {
    const [drafts, setDrafts] = useState(() => new Map<number, GameCardDraftState>())
    const onDraftChange = useCallback((entryId: number, draft: GameCardDraftState) => {
        setDrafts((current) => new Map(current).set(entryId, draft))
    }, [])

    return (
        <LayoutGroup id="library-shelf">
            <div className={`library-grid library-grid--${viewMode}`}>
                <AnimatePresence mode="popLayout">
                    {games.map((game, index) => (
                        <ShelfItem
                            key={game.id}
                            game={game}
                            index={index}
                            viewMode={viewMode}
                            reducedMotion={reducedMotion}
                            pendingUpdate={pendingUpdate}
                            onStatusChange={onStatusChange}
                            onSaveDetails={onSaveDetails}
                            draft={drafts.get(game.id)}
                            onDraftChange={onDraftChange}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </LayoutGroup>
    )
}

export default LibraryShelf
