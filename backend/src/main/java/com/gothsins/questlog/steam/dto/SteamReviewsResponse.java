
package com.gothsins.questlog.steam.dto;

public record SteamReviewsResponse(
        Long steamAppId,
        boolean available,
        String reviewScoreDescription,
        Long totalPositive,
        Long totalNegative,
        Long totalReviews,
        Double positivePercentage
) {

    public static SteamReviewsResponse unavailable(
            Long steamAppId
    ) {
        return new SteamReviewsResponse(
                steamAppId,
                false,
                null,
                null,
                null,
                null,
                null
        );
    }
}
