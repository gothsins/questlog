package com.gothsins.questlog.discovery;

public record HomeDiscoveryResponse(
        DiscoverySection popular,
        DiscoverySection upcoming,
        DiscoverySection steam,
        DiscoverySection fps,
        DiscoverySection indie,
        DiscoveryGame featured
) {
}
