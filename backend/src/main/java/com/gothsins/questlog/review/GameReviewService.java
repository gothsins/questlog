package com.gothsins.questlog.review;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.game.GameRepository;
import com.gothsins.questlog.library.LibraryEntry;
import com.gothsins.questlog.library.LibraryEntryRepository;
import com.gothsins.questlog.review.dto.CreateGameReviewRequest;
import com.gothsins.questlog.review.dto.GameReviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GameReviewService {

    private final GameReviewRepository gameReviewRepository;
    private final LibraryEntryRepository libraryEntryRepository;
    private final GameRepository gameRepository;

    @Transactional
    public GameReviewResponse createOrUpdate(
            Long libraryEntryId,
            Long userId,
            CreateGameReviewRequest request
    ) {
        LibraryEntry entry = findOwnedEntry(libraryEntryId, userId);

        GameReview review = gameReviewRepository
                .findByLibraryEntry_Id(libraryEntryId)
                .orElseGet(() -> {
                    GameReview newReview = new GameReview();
                    newReview.setLibraryEntry(entry);
                    return newReview;
                });

        review.setContent(request.content().strip());

        GameReview saved = gameReviewRepository.save(review);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public GameReviewResponse findMyReview(
            Long libraryEntryId,
            Long userId
    ) {
        findOwnedEntry(libraryEntryId, userId);

        GameReview review = gameReviewRepository
                .findByLibraryEntry_Id(libraryEntryId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Review not found"
                        )
                );

        return toResponse(review);
    }

    @Transactional(readOnly = true)
    public List<GameReviewResponse> findByGame(Long gameId) {

        if (!gameRepository.existsById(gameId)) {
            throw new ResourceNotFoundException(
                    "Game not found"
            );
        }

        return gameReviewRepository
                .findByLibraryEntry_Game_IdOrderByCreatedAtDesc(gameId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteMyReview(
            Long libraryEntryId,
            Long userId
    ) {
        findOwnedEntry(libraryEntryId, userId);

        GameReview review = gameReviewRepository
                .findByLibraryEntry_Id(libraryEntryId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Review not found"
                        )
                );

        gameReviewRepository.delete(review);
    }

    private LibraryEntry findOwnedEntry(
            Long libraryEntryId,
            Long userId
    ) {
        return libraryEntryRepository
                .findByIdAndUser_Id(libraryEntryId, userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Library entry not found"
                        )
                );
    }

    private GameReviewResponse toResponse(GameReview review) {
        LibraryEntry entry = review.getLibraryEntry();

        return new GameReviewResponse(
                review.getId(),
                entry.getId(),
                entry.getGame().getId(),
                entry.getUser().getUsername(),
                review.getContent(),
                entry.getRating(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}