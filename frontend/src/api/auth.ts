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
        throw new Error('Dados inválidos. Confira o usuário e a senha.')
    }
    if (response.status === 429) {
        throw new Error('Muitas tentativas de cadastro. Aguarde um pouco.')
    }
    if (!response.ok) {
        throw new Error('Não foi possível criar sua conta. Tente novamente.')
    }

    return (await response.json()) as RegisteredUser
}
