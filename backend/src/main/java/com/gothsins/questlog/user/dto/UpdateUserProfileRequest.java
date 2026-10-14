
package com.gothsins.questlog.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserProfileRequest(

        @NotBlank
        @Size(min = 3, max = 24)
        @Pattern(
                regexp = "^[a-zA-Z0-9_]+$",
                message = "Nickname may contain only letters, numbers and underscores"
        )
        String nickname

) {
}
