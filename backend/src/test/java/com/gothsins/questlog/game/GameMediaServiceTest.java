
package com.gothsins.questlog.game;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.game.dto.GameMediaResponse;
import com.gothsins.questlog.igdb.IgdbClient;
import com.gothsins.questlog.igdb.IgdbGameDetailsResponse;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameMediaServiceTest {

    private static final Long GAME_ID = 10L;
    private static final Long IGDB_ID = 555L;

    @Mock
    private GameRepository gameRepository;

    @Mock
    private IgdbClient igdbClient;

    @InjectMocks
    private GameMediaService gameMediaService;

    private Game createGame(Long igdbId) {
        Game game = new Game();
        game.setId(GAME_ID);
        game.setTitle("Hollow Knight");
        game.setIgdbId(igdbId);
        return game;
    }

    @Test
    void shouldReturnGameMedia() {

        when(gameRepository.findById(GAME_ID))
                .thenReturn(Optional.of(createGame(IGDB_ID)));

        IgdbGameDetailsResponse details =
                new IgdbGameDetailsResponse(
                        IGDB_ID,
                        "Hollow Knight",
                        "  Uma aventura subterrânea.  ",
                        List.of(
                                new IgdbGameDetailsResponse.Genre(
                                        "Adventure"
                                ),
                                new IgdbGameDetailsResponse.Genre(
                                        "Platform"
                                )
                        ),
                        List.of(
                                new IgdbGameDetailsResponse.Screenshot(
                                        "sc123"
                                )
                        ),
                        List.of(
                                new IgdbGameDetailsResponse.Video(
                                        "Official Trailer",
                                        "M7lc1UVf-VE"
                                )
                        )
                );

        when(igdbClient.findGameDetailsById(IGDB_ID))
                .thenReturn(Optional.of(details));

        GameMediaResponse response =
                gameMediaService.findByGameId(GAME_ID);

        assertEquals(
                "Uma aventura subterrânea.",
                response.summary()
        );

        assertEquals(
                List.of("Adventure", "Platform"),
                response.genres()
        );

        assertEquals(
                List.of(
                        "https://images.igdb.com/igdb/image/upload/t_1080p/sc123.jpg"
                ),
                response.screenshots()
        );

        assertEquals(
                "M7lc1UVf-VE",
                response.trailerVideoId()
        );
    }

    @Test
    void shouldReturnEmptyMediaForManualGame() {

        when(gameRepository.findById(GAME_ID))
                .thenReturn(Optional.of(createGame(null)));

        GameMediaResponse response =
                gameMediaService.findByGameId(GAME_ID);

        assertNull(response.summary());
        assertTrue(response.genres().isEmpty());
        assertTrue(response.screenshots().isEmpty());
        assertNull(response.trailerVideoId());

        verifyNoInteractions(igdbClient);
    }

    @Test
    void shouldThrowWhenGameDoesNotExist() {

        when(gameRepository.findById(GAME_ID))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> gameMediaService.findByGameId(GAME_ID)
        );

        verifyNoInteractions(igdbClient);
    }

    @Test
    void shouldReturnEmptyMediaWhenIgdbHasNoDetails() {

        when(gameRepository.findById(GAME_ID))
                .thenReturn(Optional.of(createGame(IGDB_ID)));

        when(igdbClient.findGameDetailsById(IGDB_ID))
                .thenReturn(Optional.empty());

        GameMediaResponse response =
                gameMediaService.findByGameId(GAME_ID);

        assertTrue(response.genres().isEmpty());
        assertTrue(response.screenshots().isEmpty());
        assertNull(response.trailerVideoId());
    }

    @Test
    void shouldIgnoreInvalidMediaAndPreferTrailer() {

        when(gameRepository.findById(GAME_ID))
                .thenReturn(Optional.of(createGame(IGDB_ID)));

        IgdbGameDetailsResponse details =
                new IgdbGameDetailsResponse(
                        IGDB_ID,
                        "Hollow Knight",
                        null,
                        null,
                        List.of(
                                new IgdbGameDetailsResponse.Screenshot(
                                        "invalid image"
                                ),
                                new IgdbGameDetailsResponse.Screenshot(
                                        "sc456"
                                )
                        ),
                        List.of(
                                new IgdbGameDetailsResponse.Video(
                                        "Gameplay",
                                        "dQw4w9WgXc"
                                ),
                                new IgdbGameDetailsResponse.Video(
                                        "Launch Trailer",
                                        "M7lc1UVf-VE"
                                )
                        )
                );

        when(igdbClient.findGameDetailsById(IGDB_ID))
                .thenReturn(Optional.of(details));

        GameMediaResponse response =
                gameMediaService.findByGameId(GAME_ID);

        assertEquals(1, response.screenshots().size());
        assertTrue(response.genres().isEmpty());

        assertEquals(
                "M7lc1UVf-VE",
                response.trailerVideoId()
        );
    }
}
