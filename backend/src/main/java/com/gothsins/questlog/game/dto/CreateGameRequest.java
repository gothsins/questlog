package com.gothsins.questlog.game.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateGameRequest(

        @NotBlank
        @Size(max = 150)
        String title,

        LocalDate releaseDate,

        @Size(max = 255)
        String coverUrl

) {
}