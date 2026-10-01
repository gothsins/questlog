package com.gothsins.questlog.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

        @Schema(
                description = "Username used for authentication",
                example = "gui"
        )
        @NotBlank
        String username,

        @Schema(
                description = "User password",
                example = "minhaSenha123"
        )
        @NotBlank
        String password

) {
}