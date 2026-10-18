import type { GameReview } from '../types/reviews'
import { reviewDate, reviewInitial } from './reviewPresentation'

export default function GameReviewCard({ review }: { review: GameReview }) {
    const edited = Date.parse(review.updatedAt) - Date.parse(review.createdAt) > 1000

    return (
        <li className="quest-review-card">
            <div className="quest-review-card__top">
                <span className="quest-review-card__avatar" aria-hidden="true">
                    {reviewInitial(review.username)}
                </span>
                <div className="quest-review-card__identity">
                    <strong>{review.username}</strong>
                    <span>
                        Publicada em {reviewDate(review.createdAt)}
                        {edited && ' · Editada'}
                    </span>
                </div>
                {review.rating !== null && (
                    <span className="quest-review-card__rating" aria-label={`Nota ${review.rating} de 10`}>
                        <strong>{review.rating}</strong><small>/ 10</small>
                    </span>
                )}
            </div>
            <p className="quest-review-card__content">{review.content}</p>
        </li>
    )
}
