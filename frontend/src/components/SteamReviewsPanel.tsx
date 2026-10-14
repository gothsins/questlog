
import '../styles/steam-reviews.css'

export interface SteamReviews {
    steamAppId: number | null
    available: boolean
    reviewScoreDescription: string | null
    totalPositive: number | null
    totalNegative: number | null
    totalReviews: number | null
    positivePercentage: number | null
}

interface SteamReviewsPanelProps {
    reviews?: SteamReviews
    loading: boolean
    error: boolean
}

const scoreTranslations: Record<string, string> = {
    'Overwhelmingly Positive': 'Extremamente positivas',
    'Very Positive': 'Muito positivas',
    'Positive': 'Positivas',
    'Mostly Positive': 'Majoritariamente positivas',
    'Mixed': 'Mistas',
    'Mostly Negative': 'Majoritariamente negativas',
    'Negative': 'Negativas',
    'Very Negative': 'Muito negativas',
    'Overwhelmingly Negative': 'Extremamente negativas',
}

const numberFormatter = new Intl.NumberFormat('pt-BR')

function SteamReviewsPanel({
                               reviews,
                               loading,
                               error,
                           }: SteamReviewsPanelProps) {
    const percentage = reviews?.positivePercentage ?? null

    const formattedPercentage = percentage === null
        ? '—'
        : `${percentage.toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        })}%`

    const scoreDescription =
        scoreTranslations[reviews?.reviewScoreDescription ?? '']
        ?? reviews?.reviewScoreDescription
        ?? 'Sem classificação'

    let message: string | null = null

    if (loading) {
        message = 'Carregando avaliações da Steam...'
    } else if (error) {
        message = 'Não foi possível consultar as avaliações da Steam.'
    } else if (!reviews?.available) {
        message = reviews?.steamAppId
            ? 'As avaliações da Steam estão indisponíveis no momento.'
            : 'Este jogo não possui uma associação identificada com a Steam.'
    }

    return (
        <section
            className="steam-reviews"
            aria-labelledby="steam-reviews-heading"
        >
            <div className="steam-reviews__heading">
                <div>
                    <span className="steam-reviews__eyebrow">
                        DADOS EXTERNOS
                    </span>

                    <h2 id="steam-reviews-heading">
                        Avaliações na Steam
                    </h2>
                </div>

                {reviews?.steamAppId && (
                    <a
                        href={`https://store.steampowered.com/app/${reviews.steamAppId}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="steam-reviews__link"
                    >
                        Ver na Steam ↗
                    </a>
                )}
            </div>

            {message ? (
                <p className="steam-reviews__message" role="status">
                    {message}
                </p>
            ) : (
                <div className="steam-reviews__content">
                    <div className="steam-reviews__score">
                        <strong>{formattedPercentage}</strong>

                        <div>
                            <span>{scoreDescription}</span>
                            <p>de avaliações positivas</p>
                        </div>
                    </div>

                    {percentage !== null && (
                        <div
                            className="steam-reviews__progress"
                            role="progressbar"
                            aria-label="Percentual de avaliações positivas"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={percentage}
                        >
                            <div
                                className="steam-reviews__progress-fill"
                                style={{
                                    width: `${percentage}%`,
                                }}
                            />
                        </div>
                    )}

                    <div className="steam-reviews__statistics">
                        <div>
                            <span>Positivas</span>
                            <strong>
                                {numberFormatter.format(
                                    reviews?.totalPositive ?? 0,
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Negativas</span>
                            <strong>
                                {numberFormatter.format(
                                    reviews?.totalNegative ?? 0,
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Total de avaliações</span>
                            <strong>
                                {numberFormatter.format(
                                    reviews?.totalReviews ?? 0,
                                )}
                            </strong>
                        </div>
                    </div>
                </div>
            )}

            <p className="steam-reviews__disclaimer">
                Estatísticas fornecidas pela Steam.
                As análises da comunidade Questlog são independentes.
            </p>
        </section>
    )
}

export default SteamReviewsPanel
