
package com.gothsins.questlog.review;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.review.dto.CreateGameReviewRequest;
import com.gothsins.questlog.review.dto.GameReviewResponse;
import com.gothsins.questlog.security.CustomUserDetailsService;
import com.gothsins.questlog.security.JwtService;
import com.gothsins.questlog.security.SecurityConfig;
import com.gothsins.questlog.user.User;
import com.gothsins.questlog.user.UserRepository;
import com.gothsins.questlog.ratelimit.RateLimitService;
import org.springframework.cache.CacheManager;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(GameReviewController.class)
@Import(SecurityConfig.class)
@WithMockUser(username = "gui")
class GameReviewControllerTest {

    private static final Long USER_ID = 1L;
    private static final Long ENTRY_ID = 10L;
    private static final Long GAME_ID = 20L;

    private static final String CONTENT =
            "Hollow Knight possui uma atmosfera incrível e uma trilha sonora maravilhosa.";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GameReviewService gameReviewService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @MockitoBean
    private RateLimitService rateLimitService;

    @MockitoBean
    private CacheManager cacheManager;

    private void mockAuthenticatedUser() {
        User user = new User();
        user.setId(USER_ID);
        user.setUsername("gui");

        when(userRepository.findByUsername("gui"))
                .thenReturn(Optional.of(user));
    }

    private GameReviewResponse createResponse() {
        return new GameReviewResponse(
                100L,
                ENTRY_ID,
                GAME_ID,
                "gui",
                CONTENT,
                new BigDecimal("9.5"),
                LocalDateTime.of(2026, 10, 12, 18, 0),
                LocalDateTime.of(2026, 10, 12, 18, 0)
        );
    }

    private String requestBody(String content) {
        return "{\"content\":\"" + content + "\"}";
    }

    @Test
    void shouldListReviewsWith200() throws Exception {

        when(gameReviewService.findByGame(GAME_ID))
                .thenReturn(List.of(createResponse()));

        mockMvc.perform(
                        get("/api/games/{gameId}/reviews", GAME_ID)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("gui"))
                .andExpect(jsonPath("$[0].content").value(CONTENT))
                .andExpect(jsonPath("$[0].rating").value(9.5));

        verify(gameReviewService).findByGame(GAME_ID);
    }

    @Test
    void shouldFindOwnReviewWith200() throws Exception {

        mockAuthenticatedUser();

        when(gameReviewService.findMyReview(ENTRY_ID, USER_ID))
                .thenReturn(createResponse());

        mockMvc.perform(
                        get("/api/library/{entryId}/review", ENTRY_ID)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.content").value(CONTENT));

        verify(gameReviewService)
                .findMyReview(ENTRY_ID, USER_ID);
    }

    @Test
    void shouldCreateOrUpdateReviewWith200() throws Exception {

        mockAuthenticatedUser();

        when(gameReviewService.createOrUpdate(
                eq(ENTRY_ID),
                eq(USER_ID),
                any(CreateGameReviewRequest.class)
        )).thenReturn(createResponse());

        mockMvc.perform(
                        put("/api/library/{entryId}/review", ENTRY_ID)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody(CONTENT))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.content").value(CONTENT));

        verify(gameReviewService).createOrUpdate(
                eq(ENTRY_ID),
                eq(USER_ID),
                argThat(request ->
                        CONTENT.equals(request.content())
                )
        );
    }

    @Test
    void shouldDeleteReviewWith204() throws Exception {

        mockAuthenticatedUser();

        mockMvc.perform(
                        delete("/api/library/{entryId}/review", ENTRY_ID)
                )
                .andExpect(status().isNoContent());

        verify(gameReviewService)
                .deleteMyReview(ENTRY_ID, USER_ID);
    }

    @Test
    void shouldRejectShortContentWith400() throws Exception {

        mockMvc.perform(
                        put("/api/library/{entryId}/review", ENTRY_ID)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody("Muito bom"))
                )
                .andExpect(status().isBadRequest());

        verifyNoInteractions(gameReviewService);
    }

    @Test
    void shouldRejectBlankContentWith400() throws Exception {

        mockMvc.perform(
                        put("/api/library/{entryId}/review", ENTRY_ID)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody("   "))
                )
                .andExpect(status().isBadRequest());

        verifyNoInteractions(gameReviewService);
    }

    @Test
    void shouldRejectOversizedContentWith400() throws Exception {

        mockMvc.perform(
                        put("/api/library/{entryId}/review", ENTRY_ID)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody("a".repeat(2001)))
                )
                .andExpect(status().isBadRequest());

        verifyNoInteractions(gameReviewService);
    }

    @Test
    void shouldReturn404WhenReviewDoesNotExist() throws Exception {

        mockAuthenticatedUser();

        when(gameReviewService.findMyReview(ENTRY_ID, USER_ID))
                .thenThrow(
                        new ResourceNotFoundException("Review not found")
                );

        mockMvc.perform(
                        get("/api/library/{entryId}/review", ENTRY_ID)
                )
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message")
                        .value("Review not found"));
    }

    @Test
    void shouldReturn404WhenUserCannotAccessEntry() throws Exception {

        mockAuthenticatedUser();

        when(gameReviewService.createOrUpdate(
                eq(ENTRY_ID),
                eq(USER_ID),
                any(CreateGameReviewRequest.class)
        )).thenThrow(
                new ResourceNotFoundException(
                        "Library entry not found"
                )
        );

        mockMvc.perform(
                        put("/api/library/{entryId}/review", ENTRY_ID)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody(CONTENT))
                )
                .andExpect(status().isNotFound());

        verify(gameReviewService).createOrUpdate(
                eq(ENTRY_ID),
                eq(USER_ID),
                any(CreateGameReviewRequest.class)
        );
    }

    @Test
    @WithAnonymousUser
    void shouldRejectUnauthenticatedRequest() throws Exception {

        mockMvc.perform(
                        get("/api/games/{gameId}/reviews", GAME_ID)
                )
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(gameReviewService);
    }

    @Test
    @WithAnonymousUser
    void shouldRejectInvalidTokenWith401() throws Exception {

        mockMvc.perform(
                        get("/api/games/{gameId}/reviews", GAME_ID)
                                .header(
                                        "Authorization",
                                        "Bearer invalid.token.value"
                                )
                )
                .andExpect(status().isUnauthorized())
                .andExpect(
                        jsonPath("$.status").value(401)
                );

        verifyNoInteractions(gameReviewService);
    }
}
