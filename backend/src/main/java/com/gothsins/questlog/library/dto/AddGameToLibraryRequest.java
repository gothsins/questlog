package com.gothsins.questlog.library.dto;

import jakarta.validation.constraints.NotNull;

public record AddGameToLibraryRequest(

        @NotNull
        Long gameId

) {
}