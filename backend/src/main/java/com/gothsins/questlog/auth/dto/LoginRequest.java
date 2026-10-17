package com.gothsins.questlog.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(

        @Schema(
                description = "Username used for authentication",
                example = "gui"
        )
        @NotBlank
        @Size(max = 50)
        String username,

        @Schema(
                description = "User password",
                example = "minhaSenha123"
        )
        @NotBlank
        @Size(max = 256)
        String password

) {
}
