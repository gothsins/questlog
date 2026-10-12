import { useState } from 'react'
import type { FormEvent } from 'react'
import type { LibraryEntry } from '../types/library'

interface GameCardProps {
    game: LibraryEntry
    isSaving: boolean
    disabled: boolean
    pendingStatus?: LibraryEntry['status']
    onStatusChange: (
        entryId: number,
        status: LibraryEntry['status'],
    ) => void
    onSaveDetails: (
        entryId: number,
        details: { rating?: number; hoursPlayed: number },
    ) => Promise<boolean>
}

const statusLabels: Record<LibraryEntry['status'], string> = {
    BACKLOG: 'Backlog',
    PLAYING: 'Jogando',
    COMPLETED: 'Concluído',
    DROPPED: 'Abandonado',
    WISHLIST: 'Lista de desejos',
}

const numberFormatter = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
})

function GameCard({
    game,
    isSaving,
    disabled,
    pendingStatus,
    onStatusChange,
    onSaveDetails,
}: GameCardProps) {
    const [imageError, setImageError] = useState(false)
    const [editing, setEditing] = useState(false)
    const [ratingInput, setRatingInput] = useState('')
    const [hoursInput, setHoursInput] = useState('')
    const [formError, setFormError] = useState('')

    const coverUrl = imageError
        ? undefined
        : game.coverUrl ?? undefined

    function openEditor() {
        setRatingInput(
            game.rating === null
                ? ''
                : String(game.rating).replace('.', ','),
        )
        setHoursInput(String(game.hoursPlayed ?? 0).replace('.', ','))
        setFormError('')
        setEditing(true)
    }

    function closeEditor() {
        setEditing(false)
        setFormError('')
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (disabled) return

        const ratingText = ratingInput.trim().replace(',', '.')
        const hoursText = hoursInput.trim().replace(',', '.')

        if (ratingText === '' && game.rating !== null) {
            setFormError(
                'Para alterar uma nota existente, informe um valor de 0 a 10. Ainda não é possível apagar a nota.',
            )
            return
        }

        if (
            ratingText !== '' &&
            !/^(?:10(?:\.0)?|[0-9](?:\.[0-9])?)$/.test(ratingText)
        ) {
            setFormError('A nota deve ser entre 0 e 10, com até uma casa decimal.')
            return
        }

        if (!/^\d{1,7}(?:\.\d)?$/.test(hoursText)) {
            setFormError(
                'Informe horas não negativas, com até uma casa decimal.',
            )
            return
        }

        setFormError('')

        const saved = await onSaveDetails(game.id, {
            ...(ratingText !== '' ? { rating: Number(ratingText) } : {}),
            hoursPlayed: Number(hoursText),
        })

        if (saved) {
            closeEditor()
        } else {
            setFormError('Não foi possível salvar. Tente novamente.')
        }
    }

    return (
        <article className="game-card">
            <div className="game-card__cover">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={`Capa de ${game.title}`}
                        loading="lazy"
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
                        <span className="game-card__label">Nota</span>
                        <strong>
                            {game.rating === null
                                ? '—'
                                : `★ ${numberFormatter.format(game.rating)}`}
                        </strong>
                    </div>

                    <div>
                        <span className="game-card__label">Horas</span>
                        <strong>
                            {numberFormatter.format(game.hoursPlayed ?? 0)}h
                        </strong>
                    </div>
                </div>

                <div className="game-card__status-editor">
                    <label htmlFor={`game-status-${game.id}`}>
                        Estado do jogo
                    </label>

                    <select
                        id={`game-status-${game.id}`}
                        value={pendingStatus ?? game.status}
                        disabled={disabled}
                        onChange={(event) =>
                            onStatusChange(
                                game.id,
                                event.target.value as LibraryEntry['status'],
                            )
                        }
                    >
                        {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>

                    {isSaving && (
                        <small role="status">Salvando alteração...</small>
                    )}
                </div>

                {!editing ? (
                    <button
                        className="game-card__edit-button"
                        type="button"
                        disabled={disabled}
                        onClick={openEditor}
                    >
                        {game.rating === null
                            ? '★ Registrar avaliação'
                            : '★ Editar avaliação'}
                    </button>
                ) : (
                    <form
                        className="game-card__details-form"
                        onSubmit={(event) => void handleSubmit(event)}
                        noValidate
                    >
                        <div className="game-card__details-fields">
                            <div>
                                <label htmlFor={`game-rating-${game.id}`}>
                                    Nota (0 a 10)
                                </label>
                                <input
                                    id={`game-rating-${game.id}`}
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="Ex.: 9,5"
                                    value={ratingInput}
                                    disabled={disabled}
                                    maxLength={5}
                                    onChange={(event) =>
                                        setRatingInput(event.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <label htmlFor={`game-hours-${game.id}`}>
                                    Horas jogadas
                                </label>
                                <input
                                    id={`game-hours-${game.id}`}
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="Ex.: 62,5"
                                    value={hoursInput}
                                    disabled={disabled}
                                    maxLength={12}
                                    onChange={(event) =>
                                        setHoursInput(event.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <p className="game-card__details-hint">
                            Use vírgula ou ponto. A nota é opcional no primeiro registro.
                        </p>

                        {formError && (
                            <p className="game-card__details-error" role="alert">
                                {formError}
                            </p>
                        )}

                        <div className="game-card__details-actions">
                            <button
                                type="button"
                                className="game-card__cancel-button"
                                disabled={disabled}
                                onClick={closeEditor}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="game-card__save-button"
                                disabled={disabled}
                            >
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </article>
    )
}

export default GameCard
