export const REVIEW_MIN_LENGTH = 20
export const REVIEW_MAX_LENGTH = 2000

export function reviewValidation(content: string) {
    if (content.trim().length < REVIEW_MIN_LENGTH) {
        return 'Escreva pelo menos 20 caracteres, sem contar espaços nas extremidades.'
    }
    if (content.length > REVIEW_MAX_LENGTH) {
        return 'A análise pode ter no máximo 2.000 caracteres.'
    }
    return null
}

export function reviewDate(value: string) {
    const day = value.slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return 'Data indisponível'
    const date = new Date(`${day}T00:00:00Z`)
    if (Number.isNaN(date.getTime())) return 'Data indisponível'
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date)
}

export function reviewInitial(username: string) {
    return Array.from(username.trim())[0]?.toLocaleUpperCase('pt-BR') ?? '?'
}
