import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'

import { Link, useNavigate } from 'react-router-dom'

import {
    getAvatarSrc,
    getMyProfile,
    removeMyAvatar,
    updateMyProfile,
    uploadMyAvatar,
} from '../api/profile'
import type { MyProfile } from '../api/profile'

import '../styles/profile.css'

function ProfilePage() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const [nickname, setNickname] = useState('')
    const [success, setSuccess] = useState('')

    const fileInputRef = useRef<HTMLInputElement>(null)

    const [avatarError, setAvatarError] = useState('')
    const [avatarMessage, setAvatarMessage] = useState('')

    const {
        data: profile,
        isPending,
        error,
    } = useQuery({
        queryKey: ['my-profile'],
        queryFn: getMyProfile,
        staleTime: 5 * 60 * 1000,
        retry: false,
    })

    useEffect(() => {
        if (profile) {
            setNickname(profile.nickname ?? '')
        }
    }, [profile?.nickname])

    const updateMutation = useMutation({
        mutationFn: updateMyProfile,

        onSuccess: (updatedProfile) => {
            queryClient.setQueryData(
                ['my-profile'],
                updatedProfile,
            )

            setSuccess('Apelido atualizado com sucesso!')
        },

        onError: (error) => {
            if (error.message === 'SESSION_EXPIRED') {
                sessionStorage.removeItem('questlog_token')
                queryClient.clear()
                navigate('/login', { replace: true })
            }
        },
    })

    function handleAvatarError(error: Error) {
        if (error.message === 'SESSION_EXPIRED') {
            sessionStorage.removeItem('questlog_token')
            queryClient.clear()
            navigate('/login', { replace: true })
            return
        }

        const messages: Record<string, string> = {
            AVATAR_TOO_LARGE: 'A imagem ultrapassa o limite de 2 MB.',
            INVALID_AVATAR: 'Imagem inválida. Escolha um JPG ou PNG.',
            AVATAR_UPLOAD_FAILED: 'Não foi possível enviar a foto.',
            AVATAR_REMOVE_FAILED: 'Não foi possível remover a foto.',
        }

        setAvatarError(
            messages[error.message]
            ?? 'Ocorreu um erro ao atualizar o avatar.',
        )
    }

    const uploadAvatarMutation = useMutation({
        mutationFn: uploadMyAvatar,

        onSuccess: (updatedProfile) => {
            queryClient.setQueryData(
                ['my-profile'],
                updatedProfile,
            )

            setAvatarError('')
            setAvatarMessage('Foto atualizada com sucesso!')
        },

        onError: handleAvatarError,
    })

    const removeAvatarMutation = useMutation({
        mutationFn: removeMyAvatar,

        onSuccess: () => {
            queryClient.setQueryData<MyProfile>(
                ['my-profile'],
                (current) =>
                    current
                        ? { ...current, avatarUrl: null }
                        : current,
            )

            setAvatarError('')
            setAvatarMessage('Foto removida com sucesso!')
        },

        onError: handleAvatarError,
    })

    const avatarBusy =
        uploadAvatarMutation.isPending
        || removeAvatarMutation.isPending

    function handleAvatarFileChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.currentTarget.files?.[0]
        
        event.currentTarget.value = ''

        if (!file) return

        setAvatarError('')
        setAvatarMessage('')

        if (
            file.type !== 'image/jpeg'
            && file.type !== 'image/png'
        ) {
            setAvatarError('Escolha uma imagem JPG ou PNG.')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            setAvatarError('A imagem deve ter no máximo 2 MB.')
            return
        }

        uploadAvatarMutation.mutate(file)
    }

    function handleRemoveAvatar() {
        if (!profile?.avatarUrl || avatarBusy) {
            return
        }

        setAvatarError('')
        setAvatarMessage('')

        removeAvatarMutation.mutate()
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSuccess('')

        const normalizedNickname = nickname.trim()

        if (!/^[a-zA-Z0-9_]{3,24}$/.test(normalizedNickname)) {
            return
        }

        updateMutation.mutate(normalizedNickname)
    }

    if (isPending) {
        return (
            <p className="profile-state">
                Carregando seu perfil...
            </p>
        )
    }

    if (error || !profile) {
        return (
            <p className="profile-state" role="alert">
                Não foi possível carregar seu perfil.
            </p>
        )
    }

    const displayName =
        profile.nickname || profile.username

    const initial = displayName.charAt(0).toUpperCase()

    const avatarSrc = getAvatarSrc(profile.avatarUrl)

    const memberSince = new Date(
        `${profile.createdAt.slice(0, 10)}T12:00:00`,
    ).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
    })

    const nicknameChanged =
        nickname.trim() !== (profile.nickname ?? '')

    return (
        <div className="profile-page">
            <header className="profile-heading">
                <Link
                    to="/library"
                    className="profile-back-link"
                >
                    <span aria-hidden="true">←</span>
                    Voltar à biblioteca
                </Link>

                <span className="profile-eyebrow">
                    QUESTLOG / CONTA
                </span>

                <h1>Meu perfil</h1>

                <p>
                    Personalize sua identidade na comunidade
                    Questlog.
                </p>
            </header>

            <section className="profile-card">
                <div className="profile-identity">
                    <div className="profile-avatar">
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt={`Foto de perfil de ${displayName}`}
                            />
                        ) : (
                            initial
                        )}
                    </div>

                    <div>
                        <h2>{displayName}</h2>

                        <span>@{profile.username}</span>

                        <p>
                            Jogador desde {memberSince}
                        </p>
                    </div>
                </div>

                <div className="profile-avatar-note">
                    <strong>Foto de perfil</strong>

                    <p>
                        Personalize seu avatar com uma imagem JPG ou PNG,
                        de até 2 MB.
                    </p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                        onChange={handleAvatarFileChange}
                        disabled={avatarBusy}
                        aria-label="Escolher nova foto de perfil"
                        hidden
                    />

                    <div className="profile-avatar-buttons">
                        <button
                            type="button"
                            className="profile-avatar-upload"
                            disabled={avatarBusy}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploadAvatarMutation.isPending
                                ? 'Enviando foto...'
                                : 'Alterar foto'}
                        </button>

                        <button
                            type="button"
                            className="profile-avatar-remove"
                            disabled={avatarBusy || !profile.avatarUrl}
                            onClick={handleRemoveAvatar}
                        >
                            {removeAvatarMutation.isPending
                                ? 'Removendo...'
                                : 'Remover foto'}
                        </button>
                    </div>

                    {avatarError && (
                        <p className="profile-error" role="alert">
                            {avatarError}
                        </p>
                    )}

                    {avatarMessage && (
                        <p className="profile-success" role="status">
                            {avatarMessage}
                        </p>
                    )}
                </div>
            </section>

            <section className="profile-card">
                <div className="profile-section-heading">
                    <h2>Identidade pública</h2>

                    <p>
                        Este apelido aparecerá no seu perfil
                        e nas suas futuras análises.
                    </p>
                </div>

                <form
                    className="profile-form"
                    onSubmit={handleSubmit}
                >
                    <div className="profile-field">
                        <label htmlFor="profile-nickname">
                            Apelido
                        </label>

                        <input
                            id="profile-nickname"
                            type="text"
                            value={nickname}
                            onChange={(event) => {
                                setNickname(event.target.value)
                                setSuccess('')
                            }}
                            minLength={3}
                            maxLength={24}
                            pattern="[a-zA-Z0-9_]+"
                            autoComplete="off"
                            placeholder="Escolha seu apelido"
                            aria-describedby="nickname-help"
                            required
                        />

                        <span id="nickname-help">
                            Entre 3 e 24 caracteres.
                            Use letras, números ou _.
                        </span>
                    </div>

                    {updateMutation.error && (
                        <p
                            className="profile-error"
                            role="alert"
                        >
                            {updateMutation.error.message ===
                            'NICKNAME_ALREADY_EXISTS'
                                ? 'Este apelido já está em uso.'
                                : 'Não foi possível salvar o apelido.'}
                        </p>
                    )}

                    {success && (
                        <p
                            className="profile-success"
                            role="status"
                        >
                            {success}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={
                            updateMutation.isPending
                            || !nicknameChanged
                        }
                    >
                        {updateMutation.isPending
                            ? 'Salvando...'
                            : 'Salvar alterações'}
                    </button>
                </form>
            </section>
        </div>
    )
}

export default ProfilePage
