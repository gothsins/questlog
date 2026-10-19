
package com.gothsins.questlog.review;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.game.Game;
import com.gothsins.questlog.game.GameRepository;
import com.gothsins.questlog.library.LibraryEntry;
import com.gothsins.questlog.library.LibraryEntryRepository;
import com.gothsins.questlog.review.dto.CreateGameReviewRequest;
import com.gothsins.questlog.user.User;
import com.gothsins.questlog.user.UserRepository;

import jakarta.persistence.EntityManager;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "security.jwt.secret=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
        "security.jwt.expiration=3600000",
        "igdb.client-id=test-client",
        "igdb.client-secret=test-secret"
})
@Transactional
class GameReviewRepositoryIT {

    private static final String CONTENT =
            "Hollow Knight possui uma atmosfera incrível e uma trilha sonora maravilhosa.";

    @Autowired
    private GameReviewRepository gameReviewRepository;

    @Autowired
    private LibraryEntryRepository libraryEntryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private GameReviewService gameReviewService;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User createUser() {
        User user = new User();

        user.setUsername(
                "review_it_" + UUID.randomUUID()
                        .toString()
                        .substring(0, 12)
        );

        user.setPassword("test-password-hash");

        return userRepository.saveAndFlush(user);
    }

    private LibraryEntry createLibraryEntry() {
        User user = createUser();

        Game game = new Game();
        game.setTitle("Hollow Knight - Integration Test");

        Game savedGame = gameRepository.saveAndFlush(game);

        LibraryEntry entry = new LibraryEntry();
        entry.setUser(user);
        entry.setGame(savedGame);

        return libraryEntryRepository.saveAndFlush(entry);
    }

    private GameReview createReview(LibraryEntry entry) {
        GameReview review = new GameReview();

        review.setLibraryEntry(entry);
        review.setContent(CONTENT);

        return gameReviewRepository.saveAndFlush(review);
    }

    @Test
    void shouldPersistReviewAndFindByGame() {
        LibraryEntry entry = createLibraryEntry();

        Long entryId = entry.getId();
        Long gameId = entry.getGame().getId();

        createReview(entry);

        entityManager.clear();

        GameReview saved = gameReviewRepository
                .findByLibraryEntry_Id(entryId)
                .orElseThrow();

        assertEquals(CONTENT, saved.getContent());
        assertNotNull(saved.getId());
        assertNotNull(saved.getCreatedAt());

        List<GameReview> reviews = gameReviewRepository
                .findByLibraryEntry_Game_IdOrderByCreatedAtDesc(
                        gameId
                );

        assertEquals(1, reviews.size());
        assertEquals(CONTENT, reviews.getFirst().getContent());
    }

    @Test
    void shouldRejectDuplicateReview() {
        LibraryEntry entry = createLibraryEntry();

        createReview(entry);

        GameReview duplicate = new GameReview();
        duplicate.setLibraryEntry(entry);
        duplicate.setContent(CONTENT);

        assertThrows(
                DataIntegrityViolationException.class,
                () -> gameReviewRepository.saveAndFlush(duplicate)
        );
    }

    @Test
    void shouldDeleteReviewWhenLibraryEntryIsDeleted() {

        LibraryEntry entry = createLibraryEntry();
        GameReview review = createReview(entry);

        Long entryId = entry.getId();
        Long reviewId = review.getId();

        entityManager.flush();

        entityManager.clear();

        libraryEntryRepository.deleteById(entryId);
        libraryEntryRepository.flush();

        Long count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM game_reviews
                WHERE id = ?
                """,
                Long.class,
                reviewId
        );

        assertEquals(0L, count);
    }

    @Test
    void shouldRejectReviewWithShortContent() {
        LibraryEntry entry = createLibraryEntry();

        GameReview review = new GameReview();
        review.setLibraryEntry(entry);
        review.setContent("Muito bom");

        assertThrows(
                DataIntegrityViolationException.class,
                () -> gameReviewRepository.saveAndFlush(review)
        );
    }

    @Test
    void shouldPreventAnotherUserFromUpdatingReview() {
        LibraryEntry entry = createLibraryEntry();
        GameReview review = createReview(entry);

        User anotherUser = createUser();

        assertThrows(
                ResourceNotFoundException.class,
                () -> gameReviewService.createOrUpdate(
                        entry.getId(),
                        anotherUser.getId(),
                        new CreateGameReviewRequest(
                                "Tentativa de alterar a análise de outro usuário."
                        )
                )
        );

        assertEquals(CONTENT, review.getContent());
    }
}
