package com.gothsins.questlog.igdb;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.util.Optional;

import java.util.List;

@Component
public class IgdbClient {

    private final RestClient restClient;
    private final TwitchAuthService twitchAuthService;
    private final IgdbProperties properties;

    public IgdbClient(
            RestClient.Builder restClientBuilder,
            TwitchAuthService twitchAuthService,
            IgdbProperties properties
    ) {
        this.restClient = restClientBuilder
                .baseUrl(properties.apiUrl())
                .build();

        this.twitchAuthService = twitchAuthService;
        this.properties = properties;
    }

    public List<IgdbGameResponse> searchGames(String query) {

        String accessToken =
                twitchAuthService.getAccessToken();

        String body = """
                search "%s";
                fields id,name,first_release_date,cover.image_id;
                limit 10;
                """.formatted(query);

        return restClient
                .post()
                .uri("/games")
                .header(
                        "Client-ID",
                        properties.clientId()
                )
                .header(
                        "Authorization",
                        "Bearer " + accessToken
                )
                .contentType(
                        MediaType.TEXT_PLAIN
                )
                .body(body)
                .retrieve()
                .body(
                        new ParameterizedTypeReference<
                                List<IgdbGameResponse>
                                >() {}
                );
    }

    public Optional<IgdbGameResponse> findGameById(Long igdbId) {

        String body = """
            fields id,name,first_release_date,cover.image_id;
            where id = %d;
            limit 1;
            """.formatted(igdbId);

        List<IgdbGameResponse> games = restClient
                .post()
                .uri("/games")
                .header("Client-ID", properties.clientId())
                .header(
                        "Authorization",
                        "Bearer " + twitchAuthService.getAccessToken()
                )
                .contentType(MediaType.TEXT_PLAIN)
                .body(body)
                .retrieve()
                .body(new ParameterizedTypeReference<
                        List<IgdbGameResponse>>() {});

        if (games == null || games.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(games.get(0));
    }


    public Optional<IgdbGameDetailsResponse> findGameDetailsById(
            Long igdbId
    ) {

        String body = """
            fields
                id,
                name,
                summary,
                genres.name,
                screenshots.image_id,
                videos.name,
                videos.video_id;
            where id = %d;
            limit 1;
            """.formatted(igdbId);

        List<IgdbGameDetailsResponse> games = restClient
                .post()
                .uri("/games")
                .header(
                        "Client-ID",
                        properties.clientId()
                )
                .header(
                        "Authorization",
                        "Bearer " + twitchAuthService.getAccessToken()
                )
                .contentType(MediaType.TEXT_PLAIN)
                .body(body)
                .retrieve()
                .body(
                        new ParameterizedTypeReference<
                                List<IgdbGameDetailsResponse>
                                >() {}
                );

        if (games == null || games.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(games.getFirst());
    }

    public List<IgdbExternalGameResponse> findExternalGames(
            Long igdbId
    ) {
        String body = """
            fields uid,external_game_source.name;
            where game = %d;
            limit 100;
            """.formatted(igdbId);

        List<IgdbExternalGameResponse> results = restClient
                .post()
                .uri("/external_games")
                .header("Client-ID", properties.clientId())
                .header(
                        "Authorization",
                        "Bearer " + twitchAuthService.getAccessToken()
                )
                .contentType(MediaType.TEXT_PLAIN)
                .body(body)
                .retrieve()
                .body(
                        new ParameterizedTypeReference<
                                List<IgdbExternalGameResponse>
                                >() {}
                );

        return results == null ? List.of() : results;
    }

}