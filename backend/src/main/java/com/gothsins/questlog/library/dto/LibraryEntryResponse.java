package com.gothsins.questlog.library.dto;

import com.gothsins.questlog.library.GameStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LibraryEntryResponse(

        Long id,
        Long gameId,
        String title,
        String coverUrl,
        GameStatus status,
        BigDecimal rating,
        BigDecimal hoursPlayed,
        LocalDateTime createdAt,
        LocalDateTime updatedAt

) {
}