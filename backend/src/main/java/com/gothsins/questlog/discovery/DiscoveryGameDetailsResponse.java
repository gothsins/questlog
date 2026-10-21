package com.gothsins.questlog.discovery;

import java.time.LocalDate;
import java.util.List;

public record DiscoveryGameDetailsResponse(
        Long igdbId,
        Long gameId,
        String title,
        LocalDate releaseDate,
        String coverUrl,
        String summary,
        List<String> genres,
        List<String> screenshots,
        String trailerVideoId
) {
}
