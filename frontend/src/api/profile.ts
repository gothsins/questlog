import { authenticatedFetch } from './client'
import { API_URL } from './config'

export interface MyProfile {
    id: number
    username: string
    nickname: string | null
    avatarUrl: string | null
    createdAt: string
}

export async function getMyProfile(): Promise<MyProfile> {
    const response = await authenticatedFetch('/api/users/me')

    if (response.status === 401 || response.status === 403) {
        throw new Error('SESSION_EXPIRED')
    }

    if (!response.ok) {
        throw new Error('PROFILE_LOAD_FAILED')
    }

    return (await response.json()) as MyProfile
}

export async function updateMyProfile(
    nickname: string,
): Promise<MyProfile> {
    const response = await authenticatedFetch('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ nickname }),
    })

    if (response.status === 409) {
        throw new Error('NICKNAME_ALREADY_EXISTS')
    }

    if (response.status === 401 || response.status === 403) {
        throw new Error('SESSION_EXPIRED')
    }

    if (!response.ok) {
        throw new Error('PROFILE_UPDATE_FAILED')
    }

    return (await response.json()) as MyProfile
}

export function getAvatarSrc(
    avatarUrl: string | null | undefined,
): string | null {
    if (!avatarUrl) {
        return null
    }

    return new URL(avatarUrl, API_URL).toString()
}


export async function uploadMyAvatar(
    file: File,
): Promise<MyProfile> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await authenticatedFetch(
        '/api/users/me/avatar',
        {
            method: 'POST',
            body: formData,
        },
    )

    if (response.status === 401 || response.status === 403) {
        throw new Error('SESSION_EXPIRED')
    }

    if (response.status === 413) {
        throw new Error('AVATAR_TOO_LARGE')
    }

    if (response.status === 400) {
        throw new Error('INVALID_AVATAR')
    }

    if (!response.ok) {
        throw new Error('AVATAR_UPLOAD_FAILED')
    }

    return (await response.json()) as MyProfile
}

export async function removeMyAvatar(): Promise<void> {
    const response = await authenticatedFetch(
        '/api/users/me/avatar',
        {
            method: 'DELETE',
        },
    )

    if (response.status === 401 || response.status === 403) {
        throw new Error('SESSION_EXPIRED')
    }

    if (!response.ok) {
        throw new Error('AVATAR_REMOVE_FAILED')
    }
}

