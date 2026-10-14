
package com.gothsins.questlog.review;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GameReviewRepository
        extends JpaRepository<GameReview, Long> {

    Optional<GameReview> findByLibraryEntry_Id(
            Long libraryEntryId
    );

    @EntityGraph(attributePaths = {
            "libraryEntry",
            "libraryEntry.user"
    })
    List<GameReview> findByLibraryEntry_Game_IdOrderByCreatedAtDesc(
            Long gameId
    );
}
