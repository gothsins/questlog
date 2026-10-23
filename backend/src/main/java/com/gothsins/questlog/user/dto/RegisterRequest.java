package com.gothsins.questlog.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank
        @Size(min = 3, max = 50)
        @Pattern(
                regexp = "^[A-Za-z0-9_.-]+$",
                message = "Username may contain only letters, numbers, dots, hyphens and underscores"
        )
        String username,

        @NotBlank
        String password

) {
}
