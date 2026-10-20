import { useState } from 'react'
import type { ReactNode } from 'react'
import GameGallery from './GameGallery'
import { formatReleaseDate, youtubeEmbedUrl } from './gameDetailsPresentation'

export interface DetailsGame {
    id: number
    title: string
    releaseDate: string | null
    coverUrl: string | null
}

export interface DetailsMedia {
    summary: string | null
    genres: string[]
    screenshots: string[]
    trailerVideoId: string | null
}

function GameCover({ title, url }: { title: string; url: string | null }) {
    const [failed, setFailed] = useState(false)
    return (
        <div className="game-details__cover">
            {url && !failed ? (
                <img src={url} alt={`Capa de ${title}`} onError={() => setFailed(true)} />
            ) : (
                <div className="game-details__placeholder" role="img" aria-label="Capa indisponível">
                    Q
                </div>
            )}
        </div>
    )
}

function Trailer({ title, url }: { title: string; url: string }) {
    const [playing, setPlaying] = useState(false)
    return (
        <section className="game-details__trailer" aria-labelledby="game-trailer-heading">
            <div className="game-details__section-heading">
                <div>
                    <span className="game-details__eyebrow">EM MOVIMENTO</span>
                    <h2 id="game-trailer-heading">Trailer</h2>
                </div>
                <span>Vídeo hospedado no YouTube</span>
            </div>
            <div className="game-details__video">
                {playing ? (
                    <iframe
                        src={url}
                        title={`Trailer de ${title}`}
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setPlaying(true)}
                        aria-label={`Carregar trailer de ${title} no YouTube`}
                    >
                        <span className="game-details__play-icon" aria-hidden="true">▶</span>
                        <strong>Assistir ao trailer</strong>
                        <small>O vídeo será carregado ao reproduzir</small>
                    </button>
                )}
            </div>
        </section>
    )
}

export function GameDetailsLoading() {
    return (
        <main className="game-details" aria-busy="true">
            <div className="game-details__skeleton game-details__skeleton--back" />
            <div className="game-details__hero game-details__hero--loading">
                <div className="game-details__skeleton game-details__skeleton--cover" />
                <div className="game-details__skeleton-copy">
                    <div className="game-details__skeleton game-details__skeleton--eyebrow" />
                    <div className="game-details__skeleton game-details__skeleton--title" />
                    <div className="game-details__skeleton game-details__skeleton--line" />
                    <div className="game-details__skeleton game-details__skeleton--line" />
                </div>
            </div>
            <span className="game-details__sr-only" role="status">Carregando jogo...</span>
        </main>
    )
}

export default function GameDetailsContent({ game, media, mediaPending = false, mediaError = false, onMediaRetry, action }: {
    game: DetailsGame
    media?: DetailsMedia
    mediaPending?: boolean
    mediaError?: boolean
    onMediaRetry?: () => void
    action?: ReactNode
}) {
    const trailerUrl = youtubeEmbedUrl(media?.trailerVideoId)
    return (
        <>
            <section className="game-details__hero" aria-labelledby="game-title">
                <GameCover key={game.id} title={game.title} url={game.coverUrl} />
                <div className="game-details__info">
                    <span className="game-details__eyebrow">QUESTLOG / DETALHES DO JOGO</span>
                    <h1 id="game-title">{game.title}</h1>
                    <div className="game-details__metadata">
                        <span>Lançamento</span>
                        <strong>{formatReleaseDate(game.releaseDate)}</strong>
                    </div>
                    {media?.genres && media.genres.length > 0 && (
                        <div className="game-details__genres" aria-label="Gêneros">
                            {media.genres.map(genre => <span key={genre}>{genre}</span>)}
                        </div>
                    )}
                    <div className="game-details__synopsis">
                        <h2>Sobre o jogo</h2>
                        {mediaPending ? (
                            <div className="game-details__skeleton game-details__skeleton--summary" role="status" aria-label="Carregando descrição" />
                        ) : mediaError ? (
                            <div className="game-details__inline-state" role="status">
                                Não foi possível carregar as informações extras.{' '}
                                {onMediaRetry && <button type="button" onClick={onMediaRetry}>Tentar novamente</button>}
                            </div>
                        ) : (
                            <p>{media?.summary || 'Ainda não temos uma descrição disponível para este jogo.'}</p>
                        )}
                    </div>
                    {action}
                </div>
            </section>
            {mediaPending ? (
                <section className="game-details__media-state" aria-label="Carregando galeria">
                    <div className="game-details__skeleton game-details__skeleton--media" />
                </section>
            ) : mediaError ? null : (
                <>
                    {media?.screenshots && media.screenshots.length > 0 ? (
                        <GameGallery key={game.id} title={game.title} screenshots={media.screenshots} />
                    ) : (
                        <section className="game-details__media-state">
                            <h2>Galeria</h2>
                            <p>Este jogo ainda não tem capturas de tela disponíveis.</p>
                        </section>
                    )}
                    {trailerUrl && <Trailer key={`${game.id}-${trailerUrl}`} title={game.title} url={trailerUrl} />}
                </>
            )}
        </>
    )
}
