import type { GameReview } from '../types/reviews'

export function upsertReview(current: GameReview[] | undefined, review: GameReview) {
    if (!current) return [review]
    const ownsSlot = (item: GameReview) =>
        item.id === review.id || item.libraryEntryId === review.libraryEntryId
    const first = current.findIndex(ownsSlot)
    const withoutOwn = current.filter((item) => !ownsSlot(item))
    withoutOwn.splice(first < 0 ? 0 : Math.min(first, withoutOwn.length), 0, review)
    return withoutOwn
}

export function removeReview(current: GameReview[] | undefined, entryId: number) {
    return current?.filter((item) => item.libraryEntryId !== entryId)
}

export function syncReviewRating(current: GameReview[] | undefined, entryId: number, rating: number | null) {
    return current?.map((item) =>
        item.libraryEntryId === entryId ? { ...item, rating } : item,
    )
}
