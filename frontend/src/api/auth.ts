import { API_URL } from './config'
import type { AuthResponse, LoginRequest } from '../types/auth'

export async function login(
    credentials: LoginRequest
): Promise<AuthResponse> {

    const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        },
    )

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