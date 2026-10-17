export function formatReleaseDate(value: string | null): string {
    if (!value) return 'Data não informada'
    const date = new Date(`${value}T00:00:00`)
    if (Number.isNaN(date.getTime())) return 'Data não informada'
    return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

export function youtubeEmbedUrl(
    videoId: string | null | undefined,
): string | null {
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null
    return `https://www.youtube-nocookie.com/embed/${videoId}`
}

export function reviewPercentage(
    value: number | null | undefined,
): number | null {
    if (value == null || !Number.isFinite(value)) return null
    return Math.min(100, Math.max(0, value))
}
