package com.gothsins.questlog.game.dto;

import java.time.LocalDate;

public record GameResponse(
        Long id,
        String title,
        LocalDate releaseDate,
        String coverUrl
) {
}