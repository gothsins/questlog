package com.gothsins.questlog.igdb;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.game.Game;
import com.gothsins.questlog.game.GameRepository;
import com.gothsins.questlog.igdb.dto.IgdbSearchResult;
import com.gothsins.questlog.library.GameStatus;
import com.gothsins.questlog.library.LibraryEntryService;
import com.gothsins.questlog.library.dto.LibraryEntryResponse;
import com.gothsins.questlog.metrics.QuestlogMetrics;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IgdbImportServiceTest {

    @Mock
    private IgdbService igdbService;

    @Mock
    private GameRepository gameRepository;

    @Mock
    private LibraryEntryService libraryEntryService;

    @Mock
    private QuestlogMetrics questlogMetrics;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache catalogCache;

    @InjectMocks
    private IgdbImportService importService;

    private final Long userId = 1L;
    private final Long igdbId = 12345L;
    private final Long gameId = 10L;

    private Game existingGame() {
        Game game = new Game();
        game.setId(gameId);
        game.setIgdbId(igdbId);
        game.setTitle("Touchdown Football");
        return game;
    }

    private IgdbSearchResult externalGame() {
        return new IgdbSearchResult(
                igdbId,
                "Touchdown Football",
                LocalDate.of(2020, 1, 1),
                "https://example.com/cover.jpg"
        );
    }

    private LibraryEntryResponse expectedResponse() {
        return new LibraryEntryResponse(
                100L,
                gameId,
                "Touchdown Football",
                "https://example.com/cover.jpg",
                GameStatus.BACKLOG,
                null,
                BigDecimal.ZERO,
                null,
                null,
                igdbId
        );
    }

    @Test
    void shouldReuseExistingGameWithoutCallingIgdb() {

        when(gameRepository.findByIgdbId(igdbId))
                .thenReturn(Optional.of(existingGame()));

        LibraryEntryResponse expected = expectedResponse();

        when(libraryEntryService.addGameToLibrary(userId, gameId))
                .thenReturn(expected);

        LibraryEntryResponse result =
                importService.importToLibrary(userId, igdbId);

        assertSame(expected, result);

        verify(libraryEntryService)
                .addGameToLibrary(userId, gameId);

        verifyNoInteractions(
                igdbService,
                questlogMetrics,
                cacheManager
        );
    }

    @Test
    void shouldImportNewGameAndAddToLibrary() {

        when(gameRepository.findByIgdbId(igdbId))
                .thenReturn(
                        Optional.empty(),
                        Optional.of(existingGame())
                );

        when(igdbService.findGameById(igdbId))
                .thenReturn(externalGame());

        when(gameRepository.insertIgdbGameIfAbsent(
                igdbId,
                "Touchdown Football",
                LocalDate.of(2020, 1, 1),
                "https://example.com/cover.jpg"
        )).thenReturn(1);

        when(cacheManager.getCache("gamesList"))
                .thenReturn(catalogCache);

        LibraryEntryResponse expected = expectedResponse();

        when(libraryEntryService.addGameToLibrary(userId, gameId))
                .thenReturn(expected);

        LibraryEntryResponse result =
                importService.importToLibrary(userId, igdbId);

        assertSame(expected, result);

        verify(questlogMetrics).incrementGamesCreated();
        verify(catalogCache).clear();

        verify(libraryEntryService)
                .addGameToLibrary(userId, gameId);
    }

    @Test
    void shouldReuseGameWhenInsertFindsConflict() {

        when(gameRepository.findByIgdbId(igdbId))
                .thenReturn(
                        Optional.empty(),
                        Optional.of(existingGame())
                );

        when(igdbService.findGameById(igdbId))
                .thenReturn(externalGame());

        when(gameRepository.insertIgdbGameIfAbsent(
                igdbId,
                "Touchdown Football",
                LocalDate.of(2020, 1, 1),
                "https://example.com/cover.jpg"
        )).thenReturn(0);

        LibraryEntryResponse expected = expectedResponse();

        when(libraryEntryService.addGameToLibrary(userId, gameId))
                .thenReturn(expected);

        LibraryEntryResponse result =
                importService.importToLibrary(userId, igdbId);

        assertSame(expected, result);

        verify(libraryEntryService)
                .addGameToLibrary(userId, gameId);

        verifyNoInteractions(
                questlogMetrics,
                cacheManager
        );
    }

    @Test
    void shouldNotAddToLibraryWhenIgdbGameDoesNotExist() {

        when(gameRepository.findByIgdbId(igdbId))
                .thenReturn(Optional.empty());

        when(igdbService.findGameById(igdbId))
                .thenThrow(new ResourceNotFoundException(
                        "Game not found in IGDB"
                ));

        assertThrows(
                ResourceNotFoundException.class,
                () -> importService.importToLibrary(
                        userId,
                        igdbId
                )
        );

        verifyNoInteractions(
                libraryEntryService,
                questlogMetrics,
                cacheManager
        );
    }
}
