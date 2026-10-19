import type { FormEvent } from 'react'
import { REVIEW_MAX_LENGTH, reviewValidation } from './reviewPresentation'

interface Props {
    draft: string
    mode: 'create' | 'edit'
    saving: boolean
    attempted: boolean
    onChange: (value: string) => void
    onSubmit: () => void
    onCancel: () => void
}

export default function MyReviewEditor(props: Props) {
    const validation = reviewValidation(props.draft)
    const showError = props.attempted || props.draft.length > 0

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        props.onSubmit()
    }

    return (
        <form className="quest-review-editor" onSubmit={submit} noValidate>
            <label htmlFor="quest-review-content">
                {props.mode === 'edit' ? 'Editar sua análise' : 'Sua análise'}
            </label>
            <textarea
                id="quest-review-content"
                value={props.draft}
                autoFocus
                onChange={(event) => props.onChange(event.target.value)}
                rows={7}
                aria-describedby="quest-review-help quest-review-count quest-review-validation"
                aria-invalid={showError && validation !== null}
                disabled={props.saving}
                placeholder="Conte como foi sua experiência com este jogo..."
            />
            <div className="quest-review-editor__meta">
                <span id="quest-review-help">Entre 20 e 2.000 caracteres.</span>
                <span id="quest-review-count">{props.draft.length.toLocaleString('pt-BR')} / {REVIEW_MAX_LENGTH.toLocaleString('pt-BR')}</span>
            </div>
            <p id="quest-review-validation" className="quest-review-editor__validation" role={props.attempted && validation ? 'alert' : undefined}>
                {showError ? validation : null}
            </p>
            <div className="quest-review-editor__actions">
                <button type="submit" disabled={props.saving}>
                    {props.saving ? 'Salvando...' : props.mode === 'edit' ? 'Salvar análise' : 'Publicar análise'}
                </button>
                <button type="button" className="quest-review-button--quiet" onClick={props.onCancel} disabled={props.saving}>
                    Cancelar
                </button>
            </div>
        </form>
    )
}
