export interface LibraryEntry {
    id: number
    gameId: number
    title: string
    coverUrl: string | null
    status:
        | 'WISHLIST'
        | 'PLAYING'
        | 'COMPLETED'
        | 'DROPPED'
    rating: number | null
    hoursPlayed: number
    createdAt: string
    updatedAt: string
    igdbId: number | null
}
