import { API_URL } from './config'
import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    RegisteredUser,
} from '../types/auth'

export async function login(
    credentials: LoginRequest,
): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    })

    if (response.status === 401) {
        throw new Error('Usuário ou senha inválidos')
    }
    if (response.status === 429) {
        throw new Error('Muitas tentativas. Tente novamente em instantes.')
    }
    if (!response.ok) {
        throw new Error('Não foi possível realizar o login')
    }
    return response.json()
}

export async function register(
    credentials: RegisterRequest,
): Promise<RegisteredUser> {
    let response: Response

    try {
        response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        })
    } catch {
        throw new Error('Sem conexão com o servidor. Tente novamente.')
    }

    if (response.status === 409) {
        throw new Error('Este nome de usuário já está em uso.')
    }
    if (response.status === 400) {
        const body: { message?: string } = await response.json().catch(() => ({}))
        const messages: Record<string, string> = {
            'Choose a less common password': 'Escolha uma senha menos comum.',
            'This password appears in a breach; choose another': 'Esta senha apareceu em um vazamento. Escolha outra.',
            'Password must contain at least 8 characters': 'A senha deve ter pelo menos 8 caracteres.',
            'Password must be at most 72 UTF-8 bytes': 'A senha deve ter no máximo 72 bytes em UTF-8.',
            'Password contains invalid Unicode': 'A senha contém caracteres inválidos.',
        }
        throw new Error(messages[body?.message ?? ''] ?? 'Dados inválidos. Confira o usuário e a senha.')
    }
    if (response.status === 429) {
        throw new Error('Muitas tentativas de cadastro. Aguarde um pouco.')
    }
    if (response.status === 503) {
        const body: { message?: string } = await response.json().catch(() => ({}))
        if (body?.message === 'Password safety check unavailable; try again later') {
            throw new Error('Não foi possível verificar a segurança da senha agora. Tente novamente mais tarde.')
        }
        throw new Error('Cadastro temporariamente indisponível. Tente novamente mais tarde.')
    }
    if (!response.ok) {
        throw new Error('Não foi possível criar sua conta. Tente novamente.')
    }

    return (await response.json()) as RegisteredUser
}
