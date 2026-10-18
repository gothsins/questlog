import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    deleteMyReview,
    getGameReviews,
    getMyReview,
    getReviewLibrary,
    ReviewApiError,
    reviewErrorMessage,
    saveMyReview,
} from '../api/reviews'
import type { LibraryEntry } from '../types/library'
import type { GameReview } from '../types/reviews'
import GameReviewCard from './GameReviewCard'
import MyReviewEditor from './MyReviewEditor'
import ReviewDeleteConfirmation from './ReviewDeleteConfirmation'
import { reviewValidation } from './reviewPresentation'
import '../styles/game-reviews.css'

export default function GameReviewsSection({ gameId }: { gameId: number }) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null)
    const [draft, setDraft] = useState('')
    const [attempted, setAttempted] = useState(false)
    const [notice, setNotice] = useState('')
    const [operationError, setOperationError] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(false)
    const saveInFlight = useRef(false)
    const deleteInFlight = useRef(false)

    const communityQuery = useQuery<GameReview[]>({
        queryKey: ['game-reviews', gameId],
        queryFn: ({ signal }) => getGameReviews(gameId, signal),
        retry: false,
        staleTime: 60_000,
    })
    const libraryQuery = useQuery<LibraryEntry[]>({
        queryKey: ['library'],
        queryFn: ({ signal }) => getReviewLibrary(signal),
        retry: false,
        staleTime: 60_000,
    })
    const entry = libraryQuery.data?.find((item) => item.gameId === gameId)
    const entryId = entry?.id
    const myReviewQuery = useQuery<GameReview | null>({
        queryKey: ['my-review', entryId],
        enabled: entryId !== undefined,
        queryFn: ({ signal }) => getMyReview(entryId!, signal),
        retry: false,
        staleTime: 60_000,
    })

    function expireSession() {
        sessionStorage.removeItem('questlog_token')
        queryClient.clear()
        navigate('/login', { replace: true })
    }

    useEffect(() => {
        const errors = [communityQuery.error, libraryQuery.error, myReviewQuery.error]
        if (errors.some((error) => error instanceof ReviewApiError && error.status === 401)) {
            sessionStorage.removeItem('questlog_token')
            queryClient.clear()
            navigate('/login', { replace: true })
        }
    }, [communityQuery.error, libraryQuery.error, myReviewQuery.error, navigate, queryClient])

    const saveMutation = useMutation({
        mutationFn: (content: string) => saveMyReview(entryId!, content),
        onSuccess: (review) => {
            queryClient.setQueryData(['my-review', entryId], review)
            void queryClient.invalidateQueries({ queryKey: ['game-reviews', gameId] })
            setEditorMode(null)
            setDraft(review.content)
            setNotice('Análise salva com sucesso.')
            setOperationError('')
        },
        onError: (error) => {
            if (error instanceof ReviewApiError && error.status === 401) expireSession()
            else setOperationError(reviewErrorMessage(error, 'save'))
        },
        onSettled: () => { saveInFlight.current = false },
    })
    const deleteMutation = useMutation({
        mutationFn: () => deleteMyReview(entryId!),
        onSuccess: () => {
            queryClient.setQueryData(['my-review', entryId], null)
            void queryClient.invalidateQueries({ queryKey: ['game-reviews', gameId] })
            setConfirmDelete(false)
            setNotice('Análise excluída com sucesso. Sua nota permanece na biblioteca.')
            setOperationError('')
        },
        onError: (error) => {
            setConfirmDelete(false)
            if (error instanceof ReviewApiError && error.status === 401) expireSession()
            else setOperationError(reviewErrorMessage(error, 'delete'))
        },
        onSettled: () => { deleteInFlight.current = false },
    })

    function openEditor(mode: 'create' | 'edit') {
        setDraft(mode === 'edit' ? myReviewQuery.data?.content ?? '' : '')
        setAttempted(false)
        setOperationError('')
        setNotice('')
        setEditorMode(mode)
    }

    function submitReview() {
        setAttempted(true)
        if (!entryId || reviewValidation(draft) || saveInFlight.current) return
        saveInFlight.current = true
        setOperationError('')
        saveMutation.mutate(draft)
    }

    function removeReview() {
        if (!entryId || deleteInFlight.current) return
        deleteInFlight.current = true
        setOperationError('')
        deleteMutation.mutate()
    }

    const count = communityQuery.data?.length

    return (
        <section className="game-details__reviews quest-reviews" aria-labelledby="quest-reviews-title">
            <div className="quest-reviews__heading">
                <div>
                    <span className="game-details__eyebrow">COMUNIDADE QUESTLOG</span>
                    <h2 id="quest-reviews-title">Análises dos jogadores</h2>
                    <p>Experiências compartilhadas pela comunidade do Questlog.</p>
                </div>
                {count !== undefined && (
                    <span className="quest-reviews__count">{count} {count === 1 ? 'análise' : 'análises'}</span>
                )}
            </div>

            <div className="quest-reviews__layout">
                <div className="quest-reviews__feed">
                    {communityQuery.isPending && <div className="quest-reviews__state" role="status">Carregando análises...</div>}
                    {communityQuery.isError && (
                        <div className="quest-reviews__state" role="alert">
                            <p>{reviewErrorMessage(communityQuery.error, 'load')}</p>
                            <button type="button" onClick={() => void communityQuery.refetch()}>Tentar novamente</button>
                        </div>
                    )}
                    {communityQuery.isSuccess && count === 0 && (
                        <div className="quest-reviews__state quest-reviews__state--empty">
                            <strong>Ainda não há análises para este jogo.</strong>
                            <p>Quando alguém compartilhar sua experiência, ela aparecerá aqui.</p>
                        </div>
                    )}
                    {communityQuery.isSuccess && count! > 0 && (
                        <ol className="quest-reviews__list" aria-label="Análises da comunidade">
                            {communityQuery.data.map((review) => <GameReviewCard key={review.id} review={review} />)}
                        </ol>
                    )}
                </div>

                <aside className="quest-reviews__mine" aria-label="Sua análise">
                    <span className="game-details__eyebrow">SUA VOZ NO QUESTLOG</span>
                    <h3>Minha análise</h3>
                    {libraryQuery.isPending && <p role="status">Consultando sua biblioteca...</p>}
                    {libraryQuery.isError && (
                        <div role="alert">
                            <p>{reviewErrorMessage(libraryQuery.error, 'load')}</p>
                            <button type="button" onClick={() => void libraryQuery.refetch()}>Tentar novamente</button>
                        </div>
                    )}
                    {libraryQuery.isSuccess && !entry && (
                        <div>
                            <p>Adicione este jogo à sua biblioteca para publicar uma análise.</p>
                            <Link to="/explore">Explorar jogos</Link>
                        </div>
                    )}
                    {entry && myReviewQuery.isPending && <p role="status">Consultando sua análise...</p>}
                    {entry && myReviewQuery.isError && (
                        <div role="alert">
                            <p>{reviewErrorMessage(myReviewQuery.error, 'load')}</p>
                            <button type="button" onClick={() => void myReviewQuery.refetch()}>Tentar novamente</button>
                        </div>
                    )}
                    {entry && myReviewQuery.isSuccess && (
                        <>
                            {myReviewQuery.data ? (
                                <>
                                    <p>Sua análise está publicada. A nota exibida vem da sua biblioteca.</p>
                                    {entry.rating !== null && <p className="quest-reviews__own-rating">Sua nota: <strong>{entry.rating} / 10</strong></p>}
                                    {editorMode === null && (
                                        <div className="quest-reviews__actions">
                                            <button type="button" onClick={() => openEditor('edit')}>Editar minha análise</button>
                                            <button type="button" className="quest-review-button--quiet" onClick={() => setConfirmDelete(true)}>Excluir minha análise</button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p>Conte à comunidade como foi sua jornada com este jogo.</p>
                                    {editorMode === null && <button type="button" onClick={() => openEditor('create')}>Escrever análise</button>}
                                </>
                            )}
                            {editorMode && (
                                <MyReviewEditor
                                    mode={editorMode}
                                    draft={draft}
                                    saving={saveMutation.isPending}
                                    attempted={attempted}
                                    onChange={setDraft}
                                    onSubmit={submitReview}
                                    onCancel={() => { setEditorMode(null); setOperationError('') }}
                                />
                            )}
                        </>
                    )}
                    {notice && <p className="quest-reviews__notice" role="status">{notice}</p>}
                    {operationError && <p className="quest-reviews__error" role="alert">{operationError}</p>}
                </aside>
            </div>
            <ReviewDeleteConfirmation
                open={confirmDelete}
                deleting={deleteMutation.isPending}
                onCancel={() => setConfirmDelete(false)}
                onConfirm={removeReview}
            />
        </section>
    )
}
