package com.gothsins.questlog.discovery;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record IgdbDiscoveryGame(Long id, String name,
                                @JsonProperty("first_release_date") Long firstReleaseDate,
                                @JsonProperty("game_type") Integer gameType,
                                @JsonProperty("version_parent") Long versionParent,
                                @JsonProperty("parent_game") Long parentGame,
                                Cover cover,
                                List<Long> genres,
                                @JsonProperty("player_perspectives") List<Long> playerPerspectives,
                                @JsonProperty("total_rating") Double totalRating,
                                @JsonProperty("total_rating_count") Integer totalRatingCount) {
    public IgdbDiscoveryGame(Long id, String name, Long firstReleaseDate,
                             Integer gameType, Long versionParent, Long parentGame,
                             Cover cover) {
        this(id, name, firstReleaseDate, gameType, versionParent, parentGame,
                cover, null, null, null, null);
    }
    public record Cover(@JsonProperty("image_id") String imageId) {}
}
