export function registrationPasswordError(password: string): string | null {
    if (!password.trim()) return 'Informe uma senha.'

    for (let index = 0; index < password.length; index++) {
        const code = password.charCodeAt(index)
        if (code >= 0xd800 && code <= 0xdbff) {
            const next = password.charCodeAt(++index)
            if (next < 0xdc00 || next > 0xdfff || Number.isNaN(next)) {
                return 'A senha contém caracteres inválidos.'
            }
        } else if (code >= 0xdc00 && code <= 0xdfff) {
            return 'A senha contém caracteres inválidos.'
        }
    }

    if (Array.from(password).length < 8) {
        return 'A senha deve ter pelo menos 8 caracteres.'
    }
    if (new TextEncoder().encode(password).length > 72) {
        return 'A senha deve ter no máximo 72 bytes em UTF-8.'
    }
    return null
}
