package com.gothsins.questlog.igdb.dto;

import java.time.LocalDate;

public record IgdbSearchResult(
        Long igdbId,
        String title,
        LocalDate releaseDate,
        String coverUrl
) {
}