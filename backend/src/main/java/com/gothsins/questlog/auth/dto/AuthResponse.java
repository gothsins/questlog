package com.gothsins.questlog.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record AuthResponse(

        @Schema(
                description = "JWT access token"
        )
        String token

) {
}