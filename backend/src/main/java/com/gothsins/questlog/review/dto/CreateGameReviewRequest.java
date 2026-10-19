package com.gothsins.questlog.review.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateGameReviewRequest(

        @NotBlank(message = "Review content is required")
        @Size(max = 2000, message = "Review cannot exceed 2000 characters")
        String content

) {

    @AssertTrue(message = "Review must contain at least 20 characters")
    public boolean isContentLengthValid() {
        if (content == null) {
            return true;
        }

        int length = content.strip().length();

        return length >= 20 && length <= 2000;
    }
}