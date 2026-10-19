
package com.gothsins.questlog.steam;

import com.gothsins.questlog.game.SteamLinkService;
import com.gothsins.questlog.game.dto.SteamLinkResponse;
import com.gothsins.questlog.steam.dto.SteamWrittenReviewsApiResponse;
import com.gothsins.questlog.steam.dto.SteamWrittenReviewsResponse;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.web.client.RestClientException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SteamWrittenReviewsServiceTest {

    private static final Long GAME_ID = 13L;
    private static final Long STEAM_APP_ID = 1245620L;

    @Mock
    private SteamLinkService steamLinkService;

    @Mock
    private SteamClient steamClient;

    @InjectMocks
    private SteamReviewService service;

    @Test
    void shouldMapSteamWrittenReviews() {

        when(steamLinkService.findSteamLink(GAME_ID))
                .thenReturn(new SteamLinkResponse(STEAM_APP_ID));

        var author = new SteamWrittenReviewsApiResponse.Author(
                3600L
        );

        var review = new SteamWrittenReviewsApiResponse.Review(
                "123456",
                "  Um dos melhores jogos que já joguei!  ",
                true,
                1720000000L,
                "brazilian",
                author
        );

        var payload = new SteamWrittenReviewsApiResponse.Payload(
                List.of(review),
                "next-cursor"
        );

        when(steamClient.findWrittenReviews(STEAM_APP_ID))
                .thenReturn(
                        new SteamWrittenReviewsApiResponse(payload)
                );

        SteamWrittenReviewsResponse result =
                service.findWrittenReviewsByGameId(GAME_ID);

        assertTrue(result.available());
        assertEquals(STEAM_APP_ID, result.steamAppId());
        assertEquals(1, result.reviews().size());
        assertEquals("next-cursor", result.nextCursor());

        var first = result.reviews().getFirst();

        assertEquals(
                "Um dos melhores jogos que já joguei!",
                first.content()
        );

        assertTrue(first.recommended());
        assertEquals(3600L, first.playtimeMinutes());
    }

    @Test
    void shouldHandleGameWithoutSteamLink() {

        when(steamLinkService.findSteamLink(GAME_ID))
                .thenReturn(new SteamLinkResponse(null));

        SteamWrittenReviewsResponse result =
                service.findWrittenReviewsByGameId(GAME_ID);

        assertFalse(result.available());
        assertTrue(result.reviews().isEmpty());

        verifyNoInteractions(steamClient);
    }

    @Test
    void shouldHandleSteamApiFailure() {

        when(steamLinkService.findSteamLink(GAME_ID))
                .thenReturn(new SteamLinkResponse(STEAM_APP_ID));

        when(steamClient.findWrittenReviews(STEAM_APP_ID))
                .thenThrow(
                        new RestClientException(
                                "Steam unavailable"
                        )
                );

        SteamWrittenReviewsResponse result =
                service.findWrittenReviewsByGameId(GAME_ID);

        assertFalse(result.available());
        assertTrue(result.reviews().isEmpty());
    }

    @Test
    void shouldHandleEmptyReviewList() {

        when(steamLinkService.findSteamLink(GAME_ID))
                .thenReturn(new SteamLinkResponse(STEAM_APP_ID));

        when(steamClient.findWrittenReviews(STEAM_APP_ID))
                .thenReturn(
                        new SteamWrittenReviewsApiResponse(
                                new SteamWrittenReviewsApiResponse.Payload(
                                        List.of(),
                                        null
                                )
                        )
                );

        SteamWrittenReviewsResponse result =
                service.findWrittenReviewsByGameId(GAME_ID);

        assertTrue(result.available());
        assertTrue(result.reviews().isEmpty());
    }
}
