export interface LibraryEntry {
    id: number
    gameId: number
    title: string
    coverUrl: string | null
    status:
        | 'BACKLOG'
        | 'PLAYING'
        | 'COMPLETED'
        | 'DROPPED'
        | 'WISHLIST'
    rating: number | null
    hoursPlayed: number
    createdAt: string
    updatedAt: string
    igdbId: number | null
}