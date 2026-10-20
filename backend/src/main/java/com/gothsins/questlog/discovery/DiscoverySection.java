package com.gothsins.questlog.discovery;

import java.time.Instant;
import java.util.List;

public record DiscoverySection(List<DiscoveryGame> games, boolean available, Instant updatedAt) {
    public static DiscoverySection unavailable() {
        return new DiscoverySection(List.of(), false, null);
    }
}
