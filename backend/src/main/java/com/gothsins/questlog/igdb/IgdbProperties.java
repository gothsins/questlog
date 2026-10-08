package com.gothsins.questlog.igdb;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "igdb")
public record IgdbProperties(
        String clientId,
        String clientSecret,
        String apiUrl,
        String tokenUrl
) {
}