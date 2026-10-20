package com.gothsins.questlog.discovery;

import com.fasterxml.jackson.annotation.JsonProperty;

public record IgdbPopularityPrimitive(@JsonProperty("game_id") Long gameId,
                                      Double value,
                                      @JsonProperty("calculated_at") Long calculatedAt) {}
