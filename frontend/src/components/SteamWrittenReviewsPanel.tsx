
import { useState } from 'react'

import '../styles/steam-written-reviews.css'

export interface SteamWrittenReview {
    id: string
    content: string
    recommended: boolean
    createdAt: number | null
    language: string | null
    playtimeMinutes: number | null
}

export interface SteamWrittenReviews {
    steamAppId: number | null
    available: boolean
    reviews: SteamWrittenReview[]
    nextCursor: string | null
}

interface Props {
    data?: SteamWrittenReviews
    loading: boolean
    error: boolean
}

const numberFormatter = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
})

function ReviewCard({
                        review,
                    }: {
    review: SteamWrittenReview
}) {
    const [expanded, setExpanded] = useState(false)

    const isLong = review.content.length > 450

    const content =
        isLong && !expanded
            ? `${review.content.slice(0, 450)}...`
            : review.content

    const hours =
        review.playtimeMinutes !== null
            ? numberFormatter.format(
                review.playtimeMinutes / 60,
            )
            : null

    const date =
        review.createdAt !== null
            ? new Date(
                review.createdAt * 1000,
            ).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            })
            : null

    return (
        <article className="steam-written__card">
            <div className="steam-written__card-header">
                <span
                    className={
                        review.recommended
                            ? 'steam-written__badge steam-written__badge--positive'
                            : 'steam-written__badge steam-written__badge--negative'
                    }
                >
                    {review.recommended
                        ? '👍 Recomenda'
                        : '👎 Não recomenda'}
                </span>

                {date && (
                    <time className="steam-written__date">
                        {date}
                    </time>
                )}
            </div>

            <p className="steam-written__content">
                {content}
            </p>

            {isLong && (
                <button
                    type="button"
                    className="steam-written__expand"
                    aria-expanded={expanded}
                    onClick={() =>
                        setExpanded((current) => !current)
                    }
                >
                    {expanded ? 'Ler menos' : 'Ler mais'}
                </button>
            )}

            <div className="steam-written__card-footer">
                {hours !== null && (
                    <span>
                        🎮 {hours} horas jogadas
                    </span>
                )}

                {review.language && (
                    <span>
                        {review.language === 'brazilian'
                            ? 'Português'
                            : review.language === 'english'
                                ? 'Inglês'
                                : review.language}
                    </span>
                )}
            </div>
        </article>
    )
}

function SteamWrittenReviewsPanel({
                                      data,
                                      loading,
                                      error,
                                  }: Props) {
    return (
        <section
            className="steam-written"
            aria-labelledby="steam-written-heading"
        >
            <div className="steam-written__heading">
                <div>
                    <span className="steam-written__eyebrow">
                        OPINIÕES EXTERNAS
                    </span>

                    <h2 id="steam-written-heading">
                        O que os jogadores estão dizendo
                    </h2>

                    <p>
                        Avaliações publicadas na Steam.
                    </p>
                </div>
            </div>

            {loading ? (
                <p className="steam-written__state" role="status">
                    Carregando avaliações...
                </p>
            ) : error ? (
                <p className="steam-written__state" role="status">
                    Não foi possível carregar as avaliações.
                </p>
            ) : !data?.available ? (
                <p className="steam-written__state">
                    Avaliações da Steam não disponíveis
                    para este jogo.
                </p>
            ) : data.reviews.length === 0 ? (
                <p className="steam-written__state">
                    Nenhuma avaliação encontrada nos
                    idiomas selecionados.
                </p>
            ) : (
                <div className="steam-written__grid">
                    {data.reviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                        />
                    ))}
                </div>
            )}

            <p className="steam-written__disclaimer">
                As opiniões acima pertencem aos respectivos
                autores na Steam e são independentes das
                análises da comunidade Questlog.
            </p>
        </section>
    )
}

export default SteamWrittenReviewsPanel
