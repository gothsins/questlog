
package com.gothsins.questlog.steam;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.game.SteamLinkService;
import com.gothsins.questlog.game.dto.SteamLinkResponse;
import com.gothsins.questlog.steam.dto.SteamReviewsApiResponse;
import com.gothsins.questlog.steam.dto.SteamReviewsResponse;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.web.client.RestClientException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SteamReviewServiceTest {

    private static final Long GAME_ID = 13L;
    private static final Long STEAM_APP_ID = 1245620L;

    @Mock
    private SteamLinkService steamLinkService;

    @Mock
    private SteamClient steamClient;

    @InjectMocks
    private SteamReviewService steamReviewService;

    private SteamReviewsApiResponse apiResponse(
            Long positive,
            Long negative,
            Long total
    ) {
        return new SteamReviewsApiResponse(
                new SteamReviewsApiResponse.Payload(
                        new SteamReviewsApiResponse.QuerySummary(
                                "Very Positive",
                                positive,
                                negative,
                                total
                        )
                )
        );
    }

    @Test
    void shouldCalculatePositivePercentage() {

        when(steamLinkService.findSteamLink(GAME_ID))
                .thenReturn(new SteamLinkResponse(STEAM_APP_ID));

        when(steamClient.findReviewSummary(STEAM_APP_ID))
                .thenReturn(apiResponse(900L, 100L, 1000L));

        SteamReviewsResponse result =
                steamReviewService.findByGameId(GAME_ID);

        assertTrue(result.available());
        assertEquals(STEAM_APP_ID, result.steamAppId());
        assertEquals("Very Positive", result.reviewScoreDescription());
        assertEquals(900L, result.totalPositive());
        assertEquals(100L, result.totalNegative());
        assertEquals(1000L, result.totalReviews());
        assertEquals(90.0, result.positivePercentage());
    }

    @Test
    void shouldReturnUnavailableWhenGameHasNoSteamLink() {

        when(steamLinkService.findSteamLink(GAME_ID))
                .thenReturn(new SteamLinkResponse(null));

        SteamReviewsResponse result =
                steamReviewService.findByGameId(GAME_ID);

        assertFalse(result.available());
        assertNull(result.steamAppId());

        verifyNoInteractions(steamClient);
    }

    @Test
    void shouldHandleGameWithZeroReviews() {

        when(steamLinkService.findSteamLink(GAME_ID))
                .thenReturn(new SteamLinkResponse(STEAM_APP_ID));

        when(steamClient.findReviewSummary(STEAM_APP_ID))
                .thenReturn(apiResponse(0L, 0L, 0L));

        SteamReviewsResponse result =
                steamReviewService.findByGameId(GAME_ID);

        assertTrue(result.available());
        assertEquals(0L, result.totalReviews());
        assertNull(result.positivePercentage());
    }

    @Test
    void shouldHandleSteamApiFailure() {

        when(steamLinkService.findSteamLink(GAME_ID))
                .thenReturn(new SteamLinkResponse(STEAM_APP_ID));

        when(steamClient.findReviewSummary(STEAM_APP_ID))
                .thenThrow(
                        new RestClientException(
                                "Steam rate limit exceeded"
                        )
                );

        SteamReviewsResponse result =
                steamReviewService.findByGameId(GAME_ID);

        assertFalse(result.available());
        assertEquals(STEAM_APP_ID, result.steamAppId());
        assertNull(result.totalReviews());
    }

    @Test
    void shouldHandleMissingSteamSummary() {

        when(steamLinkService.findSteamLink(GAME_ID))
                .thenReturn(new SteamLinkResponse(STEAM_APP_ID));

        when(steamClient.findReviewSummary(STEAM_APP_ID))
                .thenReturn(
                        new SteamReviewsApiResponse(
                                new SteamReviewsApiResponse.Payload(null)
                        )
                );

        SteamReviewsResponse result =
                steamReviewService.findByGameId(GAME_ID);

        assertFalse(result.available());
    }

    @Test
    void shouldReturn404WhenGameDoesNotExist() {

        when(steamLinkService.findSteamLink(GAME_ID))
                .thenThrow(
                        new ResourceNotFoundException(
                                "Game not found"
                        )
                );

        assertThrows(
                ResourceNotFoundException.class,
                () -> steamReviewService.findByGameId(GAME_ID)
        );

        verifyNoInteractions(steamClient);
    }
}
