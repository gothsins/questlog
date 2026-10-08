package com.gothsins.questlog.igdb;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.igdb.dto.IgdbSearchResult;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class IgdbService {

    private static final String COVER_BASE_URL =
            "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/";

    private final IgdbClient igdbClient;

    public IgdbService(IgdbClient igdbClient) {
        this.igdbClient = igdbClient;
    }

    @Cacheable(
            value = "igdbSearch",
            key = "#query.trim().toLowerCase()",
            condition = "#query != null && !#query.isBlank()",
            unless = "#result.isEmpty()"
    )
    public List<IgdbSearchResult> searchGames(String query) {

        if (query == null || query.isBlank()) {
            return List.of();
        }

        String normalizedQuery = query.trim();

        String safeQuery = normalizedQuery
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");

        return igdbClient
                .searchGames(safeQuery)
                .stream()
                .map(this::toSearchResult)
                .toList();
    }

    private IgdbSearchResult toSearchResult(
            IgdbGameResponse game
    ) {

        return new IgdbSearchResult(
                game.id(),
                game.name(),
                toLocalDate(game.firstReleaseDate()),
                buildCoverUrl(game.cover())
        );
    }

    private LocalDate toLocalDate(
            Long epochSeconds
    ) {

        if (epochSeconds == null) {
            return null;
        }

        return Instant
                .ofEpochSecond(epochSeconds)
                .atZone(ZoneOffset.UTC)
                .toLocalDate();
    }

    private String buildCoverUrl(
            IgdbGameResponse.Cover cover
    ) {

        if (cover == null
                || cover.imageId() == null) {

            return null;
        }

        return COVER_BASE_URL
                + cover.imageId()
                + ".jpg";
    }

    public IgdbSearchResult findGameById(Long igdbId) {

        return igdbClient.findGameById(igdbId)
                .map(this::toSearchResult)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Game not found in IGDB"
                        )
                );
    }
}