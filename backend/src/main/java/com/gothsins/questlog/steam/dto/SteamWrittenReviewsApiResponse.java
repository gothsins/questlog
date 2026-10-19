
package com.gothsins.questlog.steam.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SteamWrittenReviewsApiResponse(
        Payload response
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Payload(
            List<Review> reviews,
            String cursor
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Review(
            @JsonProperty("recommendationid")
            String recommendationId,

            String review,

            @JsonProperty("voted_up")
            Boolean votedUp,

            @JsonProperty("timestamp_created")
            Long timestampCreated,

            String language,

            Author author
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Author(
            @JsonProperty("playtime_at_review")
            Long playtimeAtReview
    ) {
    }
}
