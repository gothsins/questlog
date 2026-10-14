package com.gothsins.questlog.review.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record GameReviewResponse(

        Long id,
        Long libraryEntryId,
        Long gameId,
        String username,
        String content,
        BigDecimal rating,
        LocalDateTime createdAt,
        LocalDateTime updatedAt

) {
}