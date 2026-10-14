
package com.gothsins.questlog.game;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.game.dto.GameMediaResponse;
import com.gothsins.questlog.igdb.IgdbService;
import com.gothsins.questlog.ratelimit.RateLimitService;
import com.gothsins.questlog.security.CustomUserDetailsService;
import com.gothsins.questlog.security.JwtService;
import com.gothsins.questlog.security.SecurityConfig;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import com.gothsins.questlog.steam.SteamReviewService;
import com.gothsins.questlog.steam.dto.SteamReviewsResponse;

import java.util.List;

import static org.mockito.Mockito.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(GameController.class)
@Import(SecurityConfig.class)
@WithMockUser(username = "gui")
class GameMediaControllerTest {

    private static final Long GAME_ID = 10L;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GameService gameService;

    @MockitoBean
    private IgdbService igdbService;

    @MockitoBean
    private GameMediaService gameMediaService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @MockitoBean
    private RateLimitService rateLimitService;

    @MockitoBean
    private CacheManager cacheManager;

    @MockitoBean
    private SteamLinkService steamLinkService;

    @MockitoBean
    private SteamReviewService steamReviewService;

    @Test
    void shouldReturnGameMediaWith200() throws Exception {

        GameMediaResponse response = new GameMediaResponse(
                "Uma aventura subterrânea incrível.",
                List.of("Adventure", "Platform"),
                List.of(
                        "https://images.igdb.com/igdb/image/upload/t_1080p/sc123.jpg"
                ),
                "M7lc1UVf-VE"
        );

        when(gameMediaService.findByGameId(GAME_ID))
                .thenReturn(response);

        mockMvc.perform(
                        get("/api/games/{id}/media", GAME_ID)
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.summary")
                                .value("Uma aventura subterrânea incrível.")
                )
                .andExpect(
                        jsonPath("$.genres[0]")
                                .value("Adventure")
                )
                .andExpect(
                        jsonPath("$.screenshots[0]")
                                .value(
                                        "https://images.igdb.com/igdb/image/upload/t_1080p/sc123.jpg"
                                )
                )
                .andExpect(
                        jsonPath("$.trailerVideoId")
                                .value("M7lc1UVf-VE")
                );

        verify(gameMediaService).findByGameId(GAME_ID);
    }

    @Test
    void shouldReturnEmptyMediaForManualGame() throws Exception {

        when(gameMediaService.findByGameId(GAME_ID))
                .thenReturn(GameMediaResponse.empty());

        mockMvc.perform(
                        get("/api/games/{id}/media", GAME_ID)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.genres").isEmpty())
                .andExpect(jsonPath("$.screenshots").isEmpty());

        verify(gameMediaService).findByGameId(GAME_ID);
    }

    @Test
    void shouldReturn404WhenGameDoesNotExist() throws Exception {

        when(gameMediaService.findByGameId(GAME_ID))
                .thenThrow(
                        new ResourceNotFoundException(
                                "Game not found"
                        )
                );

        mockMvc.perform(
                        get("/api/games/{id}/media", GAME_ID)
                )
                .andExpect(status().isNotFound())
                .andExpect(
                        jsonPath("$.message")
                                .value("Game not found")
                );

        verify(gameMediaService).findByGameId(GAME_ID);
    }

    @Test
    void shouldReturnSteamReviewsWith200() throws Exception {

        SteamReviewsResponse response = new SteamReviewsResponse(
                1245620L,
                true,
                "Very Positive",
                900L,
                100L,
                1000L,
                90.0
        );

        when(steamReviewService.findByGameId(GAME_ID))
                .thenReturn(response);

        mockMvc.perform(
                        get("/api/games/{id}/steam-reviews", GAME_ID)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true))
                .andExpect(jsonPath("$.steamAppId").value(1245620))
                .andExpect(jsonPath("$.positivePercentage").value(90.0));

        verify(steamReviewService).findByGameId(GAME_ID);
    }

    @Test
    void shouldReturnUnavailableWhenSteamHasNoData() throws Exception {

        when(steamReviewService.findByGameId(GAME_ID))
                .thenReturn(
                        SteamReviewsResponse.unavailable(1245620L)
                );

        mockMvc.perform(
                        get("/api/games/{id}/steam-reviews", GAME_ID)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false))
                .andExpect(jsonPath("$.steamAppId").value(1245620));

        verify(steamReviewService).findByGameId(GAME_ID);
    }
}
