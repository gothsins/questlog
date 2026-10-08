package com.gothsins.questlog.igdb;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.game.Game;
import com.gothsins.questlog.game.GameRepository;
import com.gothsins.questlog.igdb.dto.IgdbSearchResult;
import com.gothsins.questlog.library.LibraryEntryService;
import com.gothsins.questlog.library.dto.LibraryEntryResponse;
import com.gothsins.questlog.metrics.QuestlogMetrics;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class IgdbImportService {

    private final IgdbService igdbService;
    private final GameRepository gameRepository;
    private final LibraryEntryService libraryEntryService;
    private final QuestlogMetrics questlogMetrics;
    private final CacheManager cacheManager;

    public LibraryEntryResponse importToLibrary(
            Long userId,
            Long igdbId
    ) {

        Long gameId = gameRepository.findByIgdbId(igdbId)
                .map(Game::getId)
                .orElseGet(() -> importGame(igdbId));

        return libraryEntryService.addGameToLibrary(
                userId,
                gameId
        );
    }

    private Long importGame(Long igdbId) {

        IgdbSearchResult externalGame =
                igdbService.findGameById(igdbId);

        int inserted = gameRepository.insertIgdbGameIfAbsent(
                externalGame.igdbId(),
                externalGame.title(),
                externalGame.releaseDate(),
                externalGame.coverUrl()
        );

        if (inserted == 1) {
            questlogMetrics.incrementGamesCreated();

            Cache catalogCache =
                    cacheManager.getCache("gamesList");

            if (catalogCache != null) {
                catalogCache.clear();
            }
        }

        return gameRepository.findByIgdbId(igdbId)
                .map(Game::getId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Imported game not found"
                        )
                );
    }
}