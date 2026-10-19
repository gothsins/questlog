import { useEffect, useRef } from 'react'

interface Props {
    open: boolean
    deleting: boolean
    onCancel: () => void
    onConfirm: () => void
}

export default function ReviewDeleteConfirmation({ open, deleting, onCancel, onConfirm }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (open && !dialog.open) dialog.showModal()
        if (!open && dialog.open) dialog.close()
    }, [open])

    return (
        <dialog
            ref={dialogRef}
            className="quest-review-dialog"
            aria-labelledby="quest-review-delete-title"
            aria-describedby="quest-review-delete-description"
            onCancel={(event) => {
                if (deleting) event.preventDefault()
                else onCancel()
            }}
            onClose={onCancel}
        >
            <h3 id="quest-review-delete-title">Excluir minha análise?</h3>
            <p id="quest-review-delete-description">Esta ação remove o texto publicado. Sua nota na biblioteca será mantida.</p>
            <div className="quest-review-dialog__actions">
                <button type="button" className="quest-review-button--quiet" onClick={onCancel} disabled={deleting}>Cancelar</button>
                <button type="button" className="quest-review-button--danger" onClick={onConfirm} disabled={deleting}>
                    {deleting ? 'Excluindo...' : 'Excluir análise'}
                </button>
            </div>
        </dialog>
    )
}
