
package com.gothsins.questlog.steam.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SteamReviewsApiResponse(
        Payload response
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Payload(
            @JsonProperty("query_summary")
            QuerySummary querySummary
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuerySummary(
            @JsonProperty("review_score_desc")
            String reviewScoreDesc,

            @JsonProperty("total_positive")
            Long totalPositive,

            @JsonProperty("total_negative")
            Long totalNegative,

            @JsonProperty("total_reviews")
            Long totalReviews
    ) {
    }
}
