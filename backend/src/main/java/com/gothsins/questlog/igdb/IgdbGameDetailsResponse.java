
package com.gothsins.questlog.igdb;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record IgdbGameDetailsResponse(
        Long id,
        String name,
        String summary,
        @JsonProperty("first_release_date") Long firstReleaseDate,
        IgdbGameResponse.Cover cover,
        List<Genre> genres,
        List<Screenshot> screenshots,
        List<Video> videos
) {
    public IgdbGameDetailsResponse(Long id, String name, String summary,
                                   List<Genre> genres, List<Screenshot> screenshots,
                                   List<Video> videos) {
        this(id, name, summary, null, null, genres, screenshots, videos);
    }

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
