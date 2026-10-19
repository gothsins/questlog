
package com.gothsins.questlog.steam;

import com.gothsins.questlog.steam.dto.SteamReviewsApiResponse;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import com.gothsins.questlog.steam.dto.SteamWrittenReviewsApiResponse;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class SteamClient {

    private static final String REVIEWS_URL =
            "https://api.steampowered.com/IUserReviewsService/GetAppReviews/v1/";

    private static final long MAX_STEAM_APP_ID =
            4_294_967_295L;

    private final RestClient restClient;

    public SteamClient(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    public SteamReviewsApiResponse findReviewSummary(
            Long steamAppId
    ) {

        if (steamAppId == null
                || steamAppId <= 0
                || steamAppId > MAX_STEAM_APP_ID) {
            throw new IllegalArgumentException(
                    "Invalid Steam app ID"
            );
        }

        String inputJson = """
                {
                    "appid": %d,
                    "filter": 1,
                    "review_type": 0,
                    "purchase_type": 1,
                    "languages": ["all"],
                    "num_per_page": 1
                }
                """.formatted(steamAppId);

        String encodedInput = URLEncoder.encode(
                inputJson,
                StandardCharsets.UTF_8
        );

        URI uri = URI.create(
                REVIEWS_URL + "?input_json=" + encodedInput
        );

        SteamReviewsApiResponse result = restClient
                .get()
                .uri(uri)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(SteamReviewsApiResponse.class);

        if (result == null || result.response() == null) {
            throw new IllegalStateException(
                    "Invalid Steam reviews response"
            );
        }

        return result;
    }


    public SteamWrittenReviewsApiResponse findWrittenReviews(
            Long steamAppId
    ) {

        if (steamAppId == null
                || steamAppId <= 0
                || steamAppId > MAX_STEAM_APP_ID) {
            throw new IllegalArgumentException(
                    "Invalid Steam app ID"
            );
        }

        String inputJson = """
            {
                "appid": %d,
                "filter": 1,
                "review_type": 0,
                "purchase_type": 1,
                "languages": ["brazilian", "english"],
                "num_per_page": 5
            }
            """.formatted(steamAppId);

        String encodedInput = URLEncoder.encode(
                inputJson,
                StandardCharsets.UTF_8
        );

        URI uri = URI.create(
                REVIEWS_URL + "?input_json=" + encodedInput
        );

        SteamWrittenReviewsApiResponse result = restClient
                .get()
                .uri(uri)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(SteamWrittenReviewsApiResponse.class);

        if (result == null || result.response() == null) {
            throw new IllegalStateException(
                    "Invalid Steam reviews response"
            );
        }

        return result;
    }

}
