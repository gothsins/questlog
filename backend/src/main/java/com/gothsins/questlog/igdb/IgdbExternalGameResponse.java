package com.gothsins.questlog.igdb;

import com.fasterxml.jackson.annotation.JsonProperty;

public record IgdbExternalGameResponse(
        String uid,

        @JsonProperty("external_game_source")
        ExternalGameSource externalGameSource
) {
    public record ExternalGameSource(
            String name
    ) {
    }
}