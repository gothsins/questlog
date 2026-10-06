import { useState } from 'react'
import type { LibraryEntry } from '../types/library'

interface GameCardProps {
    game: LibraryEntry
}

const statusLabels: Record<LibraryEntry['status'], string> = {
    BACKLOG: 'Backlog',
    PLAYING: 'Jogando',
    COMPLETED: 'Concluído',
    DROPPED: 'Abandonado',
    WISHLIST: 'Lista de desejos',
}

function GameCard({ game }: GameCardProps) {
    const [imageError, setImageError] = useState(false)

    const coverUrl =
        imageError
            ? undefined
            : game.coverUrl ?? undefined

    return (
        <article className="game-card">
            <div className="game-card__cover">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={`Capa de ${game.title}`}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="game-card__cover-placeholder">
                        <span>Q</span>
                    </div>
                )}
            </div>

            <div className="game-card__content">
                <div className="game-card__header">
                    <h2>{game.title}</h2>

                    <span
                        className={`status-badge status-badge--${game.status.toLowerCase()}`}
                    >
            {statusLabels[game.status]}
          </span>
                </div>

                <div className="game-card__stats">
                    <div>
            <span className="game-card__label">
              Nota
            </span>

                        <strong>
                            {game.rating ?? '—'}
                        </strong>
                    </div>

                    <div>
            <span className="game-card__label">
              Horas
            </span>

                        <strong>
                            {game.hoursPlayed}h
                        </strong>
                    </div>
                </div>
            </div>
        </article>
    )
}

export default GameCard