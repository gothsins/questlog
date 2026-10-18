export interface GameReview {
    id: number
    libraryEntryId: number
    gameId: number
    username: string
    content: string
    rating: number | null
    createdAt: string
    updatedAt: string
}
