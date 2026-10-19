
package com.gothsins.questlog.review;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.game.Game;
import com.gothsins.questlog.game.GameRepository;
import com.gothsins.questlog.library.LibraryEntry;
import com.gothsins.questlog.library.LibraryEntryRepository;
import com.gothsins.questlog.review.dto.CreateGameReviewRequest;
import com.gothsins.questlog.review.dto.GameReviewResponse;
import com.gothsins.questlog.user.User;
import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameReviewServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long ENTRY_ID = 10L;
    private static final Long GAME_ID = 20L;

    private static final String CONTENT =
            "Hollow Knight possui uma atmosfera incrível e uma trilha sonora maravilhosa.";

    @Mock
    private GameReviewRepository gameReviewRepository;

    @Mock
    private LibraryEntryRepository libraryEntryRepository;

    @Mock
    private GameRepository gameRepository;

    @InjectMocks
    private GameReviewService gameReviewService;

    private LibraryEntry createEntry() {
        User user = new User();
        user.setId(USER_ID);
        user.setUsername("gui");

        Game game = new Game();
        game.setId(GAME_ID);
        game.setTitle("Hollow Knight");

        LibraryEntry entry = new LibraryEntry();
        entry.setId(ENTRY_ID);
        entry.setUser(user);
        entry.setGame(game);
        entry.setRating(new BigDecimal("9.5"));

        return entry;
    }

    private GameReview createReview(LibraryEntry entry) {
        GameReview review = new GameReview();
        review.setId(100L);
        review.setLibraryEntry(entry);
        review.setContent(CONTENT);

        return review;
    }

    @Test
    void shouldCreateReview() {
        LibraryEntry entry = createEntry();

        when(libraryEntryRepository.findByIdAndUser_Id(
                ENTRY_ID, USER_ID
        )).thenReturn(Optional.of(entry));

        when(gameReviewRepository.findByLibraryEntry_Id(ENTRY_ID))
                .thenReturn(Optional.empty());

        when(gameReviewRepository.save(any(GameReview.class)))
                .thenAnswer(invocation -> {
                    GameReview review = invocation.getArgument(0);
                    review.setId(100L);
                    return review;
                });

        GameReviewResponse result = gameReviewService.createOrUpdate(
                ENTRY_ID,
                USER_ID,
                new CreateGameReviewRequest(CONTENT)
        );

        assertEquals(100L, result.id());
        assertEquals(ENTRY_ID, result.libraryEntryId());
        assertEquals(GAME_ID, result.gameId());
        assertEquals("gui", result.username());
        assertEquals(CONTENT, result.content());
        assertEquals(new BigDecimal("9.5"), result.rating());

        verify(gameReviewRepository).save(argThat(review ->
                review.getLibraryEntry() == entry &&
                        CONTENT.equals(review.getContent())
        ));
    }

    @Test
    void shouldUpdateExistingReviewWithoutCreatingAnother() {
        LibraryEntry entry = createEntry();
        GameReview existing = createReview(entry);

        String newContent =
                "Uma experiência excelente, cheia de desafios e momentos inesquecíveis.";

        when(libraryEntryRepository.findByIdAndUser_Id(
                ENTRY_ID, USER_ID
        )).thenReturn(Optional.of(entry));

        when(gameReviewRepository.findByLibraryEntry_Id(ENTRY_ID))
                .thenReturn(Optional.of(existing));

        when(gameReviewRepository.save(existing))
                .thenReturn(existing);

        GameReviewResponse result = gameReviewService.createOrUpdate(
                ENTRY_ID,
                USER_ID,
                new CreateGameReviewRequest(newContent)
        );

        assertEquals(100L, result.id());
        assertEquals(newContent, result.content());

        verify(gameReviewRepository).save(existing);
    }

    @Test
    void shouldRejectReviewUpdateFromAnotherUser() {
        Long anotherUserId = 2L;

        when(libraryEntryRepository.findByIdAndUser_Id(
                ENTRY_ID, anotherUserId
        )).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> gameReviewService.createOrUpdate(
                        ENTRY_ID,
                        anotherUserId,
                        new CreateGameReviewRequest(CONTENT)
                )
        );

        verifyNoInteractions(gameReviewRepository);
    }

    @Test
    void shouldFindOwnReview() {
        LibraryEntry entry = createEntry();
        GameReview review = createReview(entry);

        when(libraryEntryRepository.findByIdAndUser_Id(
                ENTRY_ID, USER_ID
        )).thenReturn(Optional.of(entry));

        when(gameReviewRepository.findByLibraryEntry_Id(ENTRY_ID))
                .thenReturn(Optional.of(review));

        GameReviewResponse result =
                gameReviewService.findMyReview(ENTRY_ID, USER_ID);

        assertEquals(100L, result.id());
        assertEquals(CONTENT, result.content());
        assertEquals("gui", result.username());
    }

    @Test
    void shouldReturnNotFoundWhenReviewDoesNotExist() {
        LibraryEntry entry = createEntry();

        when(libraryEntryRepository.findByIdAndUser_Id(
                ENTRY_ID, USER_ID
        )).thenReturn(Optional.of(entry));

        when(gameReviewRepository.findByLibraryEntry_Id(ENTRY_ID))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> gameReviewService.findMyReview(
                        ENTRY_ID, USER_ID
                )
        );
    }

    @Test
    void shouldListReviewsForExistingGame() {
        GameReview review = createReview(createEntry());

        when(gameRepository.existsById(GAME_ID))
                .thenReturn(true);

        when(gameReviewRepository
                .findByLibraryEntry_Game_IdOrderByCreatedAtDesc(GAME_ID))
                .thenReturn(List.of(review));

        List<GameReviewResponse> result =
                gameReviewService.findByGame(GAME_ID);

        assertEquals(1, result.size());
        assertEquals("gui", result.getFirst().username());
        assertEquals(CONTENT, result.getFirst().content());
    }

    @Test
    void shouldRejectReviewsForNonexistentGame() {
        when(gameRepository.existsById(GAME_ID))
                .thenReturn(false);

        assertThrows(
                ResourceNotFoundException.class,
                () -> gameReviewService.findByGame(GAME_ID)
        );

        verifyNoInteractions(gameReviewRepository);
    }

    @Test
    void shouldDeleteOwnReview() {
        LibraryEntry entry = createEntry();
        GameReview review = createReview(entry);

        when(libraryEntryRepository.findByIdAndUser_Id(
                ENTRY_ID, USER_ID
        )).thenReturn(Optional.of(entry));

        when(gameReviewRepository.findByLibraryEntry_Id(ENTRY_ID))
                .thenReturn(Optional.of(review));

        gameReviewService.deleteMyReview(ENTRY_ID, USER_ID);

        verify(gameReviewRepository).delete(review);
    }

    @Test
    void shouldRejectDeletionFromAnotherUser() {
        Long anotherUserId = 2L;

        when(libraryEntryRepository.findByIdAndUser_Id(
                ENTRY_ID, anotherUserId
        )).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> gameReviewService.deleteMyReview(
                        ENTRY_ID, anotherUserId
                )
        );

        verifyNoInteractions(gameReviewRepository);
    }

    @Test
    void shouldRejectInvalidReviewContent() {
        try (ValidatorFactory factory =
                     Validation.buildDefaultValidatorFactory()) {

            var validator = factory.getValidator();

            assertTrue(validator.validate(
                    new CreateGameReviewRequest(CONTENT)
            ).isEmpty());

            assertFalse(validator.validate(
                    new CreateGameReviewRequest("Texto curto")
            ).isEmpty());

            assertFalse(validator.validate(
                    new CreateGameReviewRequest("   " + "curto" + "   ")
            ).isEmpty());

            assertFalse(validator.validate(
                    new CreateGameReviewRequest("a".repeat(2001))
            ).isEmpty());

            assertFalse(validator.validate(
                    new CreateGameReviewRequest(null)
            ).isEmpty());
        }
    }
}
