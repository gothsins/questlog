package com.gothsins.questlog.igdb;

import com.fasterxml.jackson.annotation.JsonProperty;

public record IgdbGameResponse(

        Long id,

        String name,

        @JsonProperty("first_release_date")
        Long firstReleaseDate,

        Cover cover

) {

    public record Cover(
            @JsonProperty("image_id")
            String imageId
    ) {
    }
}