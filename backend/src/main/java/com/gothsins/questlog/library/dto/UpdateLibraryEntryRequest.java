package com.gothsins.questlog.library.dto;

import com.gothsins.questlog.library.GameStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record UpdateLibraryEntryRequest(

        GameStatus status,

        @DecimalMin("0.0")
        @DecimalMax("10.0")
        BigDecimal rating,

        @PositiveOrZero
        BigDecimal hoursPlayed

) {
}