package com.gothsins.questlog.igdb;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import com.fasterxml.jackson.annotation.JsonProperty;


import java.time.Instant;

@Service
public class TwitchAuthService {

    private final RestClient restClient;
    private final IgdbProperties properties;

    private String accessToken;
    private Instant expiresAt = Instant.EPOCH;

    public TwitchAuthService(
            RestClient.Builder restClientBuilder,
            IgdbProperties properties
    ) {
        this.restClient = restClientBuilder
                .baseUrl(properties.tokenUrl())
                .build();

        this.properties = properties;
    }

    public synchronized String getAccessToken() {

        if (accessToken != null
                && Instant.now()
                .isBefore(expiresAt.minusSeconds(60))) {

            return accessToken;
        }

        TwitchTokenResponse response =
                restClient
                        .post()
                        .uri(uriBuilder ->
                                uriBuilder
                                        .queryParam(
                                                "client_id",
                                                properties.clientId()
                                        )
                                        .queryParam(
                                                "client_secret",
                                                properties.clientSecret()
                                        )
                                        .queryParam(
                                                "grant_type",
                                                "client_credentials"
                                        )
                                        .build()
                        )
                        .retrieve()
                        .body(TwitchTokenResponse.class);

        if (response == null
                || response.accessToken() == null) {

            throw new IllegalStateException(
                    "Unable to obtain Twitch access token"
            );
        }

        accessToken = response.accessToken();

        expiresAt = Instant.now()
                .plusSeconds(response.expiresIn());

        return accessToken;
    }

    private record TwitchTokenResponse(

            @JsonProperty("access_token")
            String accessToken,

            @JsonProperty("expires_in")
            long expiresIn,

            @JsonProperty("token_type")
            String tokenType

    ) {
    }
}