
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { IgdbSearchResult } from '../types/igdb'
import '../styles/search-game-card.css'

interface SearchGameCardProps {
    game: IgdbSearchResult
    isInLibrary: boolean
    isAdding: boolean
    disabled: boolean
    onAdd: (igdbId: number) => void
}

function SearchGameCard({
                            game,
                            isInLibrary,
                            isAdding,
                            disabled,
                            onAdd,
                        }: SearchGameCardProps) {
    const [imageError, setImageError] = useState(false)

    const coverUrl = imageError ? null : game.coverUrl

    const releaseYear = game.releaseDate
        ? game.releaseDate.slice(0, 4)
        : 'Data desconhecida'

    return (
        <article className="signature-card">
            <Link className="signature-card__artwork" to={`/games/igdb/${game.igdbId}`} aria-label={`Conhecer ${game.title}`}>
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={`Capa de ${game.title}`}
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="signature-card__placeholder">
                        <span>Q</span>
                    </div>
                )}

                <div
                    className="signature-card__shade"
                    aria-hidden="true"
                />

                <span className="signature-card__source">
                    IGDB
                </span>
            </Link>

            <div className="signature-card__details">
                <h3 title={game.title}><Link to={`/games/igdb/${game.igdbId}`}>{game.title}</Link></h3>

                <div className="signature-card__metadata">
                    <span>{releaseYear}</span>
                    <span aria-hidden="true">•</span>
                    <span>Jogo</span>
                </div>

                <button
                    type="button"
                    className={
                        isInLibrary
                            ? 'signature-card__add signature-card__add--added'
                            : 'signature-card__add'
                    }
                    disabled={disabled || isInLibrary}
                    onClick={() => onAdd(game.igdbId)}
                    aria-busy={isAdding}
                >
                    {isInLibrary
                        ? '✓ Na biblioteca'
                        : isAdding
                            ? 'Adicionando...'
                            : '+ Adicionar à biblioteca'}
                </button>
            </div>
        </article>
    )
}

export default SearchGameCard
