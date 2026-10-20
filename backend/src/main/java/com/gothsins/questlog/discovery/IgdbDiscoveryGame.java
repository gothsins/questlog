package com.gothsins.questlog.discovery;

import com.fasterxml.jackson.annotation.JsonProperty;

public record IgdbDiscoveryGame(Long id, String name,
                                @JsonProperty("first_release_date") Long firstReleaseDate,
                                @JsonProperty("game_type") Integer gameType,
                                @JsonProperty("version_parent") Long versionParent,
                                @JsonProperty("parent_game") Long parentGame,
                                Cover cover) {
    public record Cover(@JsonProperty("image_id") String imageId) {}
}
