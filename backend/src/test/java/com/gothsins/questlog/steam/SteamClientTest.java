
package com.gothsins.questlog.steam;

import com.gothsins.questlog.steam.dto.SteamReviewsApiResponse;

import org.junit.jupiter.api.Test;

import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class SteamClientTest {

    private final RestClient.Builder builder =
            RestClient.builder();

    private final MockRestServiceServer server =
            MockRestServiceServer.bindTo(builder).build();

    private final SteamClient steamClient =
            new SteamClient(builder);

    @Test
    void shouldFetchAndParseSteamReviewSummary() {

        server.expect(request -> {

            assertEquals(
                    HttpMethod.GET,
                    request.getMethod()
            );

            assertEquals(
                    "api.steampowered.com",
                    request.getURI().getHost()
            );

            assertEquals(
                    "/IUserReviewsService/GetAppReviews/v1/",
                    request.getURI().getPath()
            );

            String rawQuery =
                    request.getURI().getRawQuery();

            assertNotNull(rawQuery);
            assertTrue(rawQuery.startsWith("input_json="));

            String decodedInput = URLDecoder.decode(
                    rawQuery.substring("input_json=".length()),
                    StandardCharsets.UTF_8
            );

            assertTrue(
                    decodedInput.contains("\"appid\": 1245620")
            );

            assertTrue(
                    decodedInput.contains("\"purchase_type\": 1")
            );
        }).andRespond(
                withSuccess(
                        """
                        {
                            "response": {
                                "query_summary": {
                                    "review_score_desc": "Very Positive",
                                    "total_positive": 90,
                                    "total_negative": 10,
                                    "total_reviews": 100
                                },
                                "reviews": [],
                                "cursor": "*"
                            }
                        }
                        """,
                        MediaType.APPLICATION_JSON
                )
        );

        SteamReviewsApiResponse result =
                steamClient.findReviewSummary(1245620L);

        var summary = result.response().querySummary();

        assertNotNull(summary);
        assertEquals("Very Positive", summary.reviewScoreDesc());
        assertEquals(90L, summary.totalPositive());
        assertEquals(10L, summary.totalNegative());
        assertEquals(100L, summary.totalReviews());

        server.verify();
    }

    @Test
    void shouldRejectInvalidSteamAppId() {

        assertThrows(
                IllegalArgumentException.class,
                () -> steamClient.findReviewSummary(-1L)
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> steamClient.findReviewSummary(null)
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> steamClient.findReviewSummary(4_294_967_296L)
        );

        server.verify();
    }
}
