
package com.gothsins.questlog.igdb;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record IgdbGameDetailsResponse(
        Long id,
        String name,
        String summary,
        List<Genre> genres,
        List<Screenshot> screenshots,
        List<Video> videos
) {

    public record Genre(
            String name
    ) {
    }

    public record Screenshot(
            @JsonProperty("image_id")
            String imageId
    ) {
    }

    public record Video(
            String name,

            @JsonProperty("video_id")
            String videoId
    ) {
    }
}
