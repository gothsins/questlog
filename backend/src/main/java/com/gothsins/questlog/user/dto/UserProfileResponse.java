
package com.gothsins.questlog.user.dto;

import java.time.LocalDateTime;

public record UserProfileResponse(
        Long id,
        String username,
        String nickname,
        String avatarUrl,
        LocalDateTime createdAt
) {
}
