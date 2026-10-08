package com.gothsins.questlog.library.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ImportIgdbGameRequest(

        @NotNull
        @Positive
        Long igdbId

) {
}