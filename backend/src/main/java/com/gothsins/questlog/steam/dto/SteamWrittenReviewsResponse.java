
package com.gothsins.questlog.steam.dto;

import java.util.List;

public record SteamWrittenReviewsResponse(
        Long steamAppId,
        boolean available,
        List<Review> reviews,
        String nextCursor
) {

    public static SteamWrittenReviewsResponse unavailable(
            Long steamAppId
    ) {
        return new SteamWrittenReviewsResponse(
                steamAppId,
                false,
                List.of(),
                null
        );
    }

    public record Review(
            String id,
            String content,
            boolean recommended,
            Long createdAt,
            String language,
            Long playtimeMinutes
    ) {
    }
}
