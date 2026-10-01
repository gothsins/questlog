package com.gothsins.questlog.game.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateGameRequest(

        @Schema(
                description = "Game title",
                example = "Dark Souls III"
        )
        @NotBlank
        @Size(max = 150)
        String title,

        @Schema(
                description = "Original release date",
                example = "2016-03-24"
        )
        LocalDate releaseDate,

        @Schema(
                description = "URL of the game cover image",
                example = "https://example.com/dark-souls-3.jpg"
        )
        @Size(max = 255)
        String coverUrl

) {
}