package com.gothsins.questlog.discovery;

import com.gothsins.questlog.ratelimit.RateLimitService;
import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.security.CustomUserDetailsService;
import com.gothsins.questlog.security.JwtService;
import com.gothsins.questlog.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.cache.CacheManager;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.time.LocalDate;
import java.time.ZoneOffset;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DiscoveryController.class)
@Import(SecurityConfig.class)
class DiscoveryControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean DiscoveryService service;
    @MockitoBean DiscoveryGameDetailsService gameDetailsService;
    @MockitoBean JwtService jwtService;
    @MockitoBean CustomUserDetailsService userDetailsService;
    @MockitoBean RateLimitService rateLimitService;
    @MockitoBean CacheManager cacheManager;

    @Test
    void anonymousRequestIsRejectedBeforeDiscovery() throws Exception {
        mvc.perform(get("/api/discovery/home")).andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }

    @Test
    @WithMockUser
    void oneProviderFailureLeavesOtherSectionAvailableAndNoPersonalData() throws Exception {
        when(service.popular()).thenThrow(new IllegalStateException("external error"));
        when(service.upcoming()).thenReturn(new DiscoverySection(List.of(
                new DiscoveryGame(42, "Upcoming", null, LocalDate.now(ZoneOffset.UTC).plusDays(30), null),
                new DiscoveryGame(41, "Released overnight", null, LocalDate.now(ZoneOffset.UTC).minusDays(1), null)), true, null));
        when(service.steam()).thenReturn(new DiscoverySection(List.of(
                new DiscoveryGame(100, "Steam game", "https://images.igdb.com/cover.jpg",
                        LocalDate.now(ZoneOffset.UTC).minusDays(1), "Steam peak")), true, null));
        when(service.fps()).thenThrow(new DataAccessResourceFailureException("Redis unavailable"));
        when(service.indie()).thenReturn(DiscoverySection.unavailable());
        when(service.featured(any(), any(), any(), any())).thenCallRealMethod();
        mvc.perform(get("/api/discovery/home"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.popular.available").value(false))
                .andExpect(jsonPath("$.upcoming.games[0].igdbId").value(42))
                .andExpect(jsonPath("$.upcoming.games.length()").value(1))
                .andExpect(jsonPath("$.steam.games[0].igdbId").value(100))
                .andExpect(jsonPath("$.fps.available").value(false))
                .andExpect(jsonPath("$.featured.igdbId").value(100))
                .andExpect(jsonPath("$.library").doesNotExist());
    }

    @Test
    @WithMockUser
    void thematicCollectionsPreferUnseenGamesWithoutChangingSteamOrder() throws Exception {
        DiscoveryGame shared = new DiscoveryGame(1, "Shared", null, null, "IGDB");
        DiscoveryGame distinct = new DiscoveryGame(2, "Distinct", null, null, "IGDB");
        when(service.popular()).thenReturn(DiscoverySection.unavailable());
        when(service.upcoming()).thenReturn(DiscoverySection.unavailable());
        when(service.steam()).thenReturn(new DiscoverySection(List.of(shared), true, null));
        when(service.fps()).thenReturn(new DiscoverySection(List.of(shared, distinct), true, null));
        when(service.indie()).thenReturn(DiscoverySection.unavailable());

        mvc.perform(get("/api/discovery/home"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.steam.games[0].igdbId").value(1))
                .andExpect(jsonPath("$.fps.games[0].igdbId").value(2))
                .andExpect(jsonPath("$.fps.games[1].igdbId").value(1));
    }

    @Test
    void anonymousDetailsRequestIsRejected() throws Exception {
        mvc.perform(get("/api/discovery/games/42")).andExpect(status().isUnauthorized());
        verifyNoInteractions(gameDetailsService);
    }

    @Test
    @WithMockUser
    void invalidIdIsRejectedWithoutProviderAccess() throws Exception {
        mvc.perform(get("/api/discovery/games/0")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/discovery/games/not-a-number")).andExpect(status().isBadRequest());
        verifyNoInteractions(gameDetailsService);
    }

    @Test
    @WithMockUser
    void providerFailureHasSafeResponse() throws Exception {
        when(gameDetailsService.find(42L)).thenThrow(new IllegalStateException("sensitive provider detail"));
        mvc.perform(get("/api/discovery/games/42"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("IGDB temporarily unavailable"));
    }

    @Test
    @WithMockUser
    void detailsReturnDistinctIgdbAndInternalIds() throws Exception {
        when(gameDetailsService.find(99L)).thenReturn(new DiscoveryGameDetailsResponse(
                99L, 42L, "Elden Ring", null, null, "Journey", List.of("RPG"), List.of(), null));
        mvc.perform(get("/api/discovery/games/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.igdbId").value(99))
                .andExpect(jsonPath("$.gameId").value(42))
                .andExpect(jsonPath("$.summary").value("Journey"));
    }

    @Test
    @WithMockUser
    void missingExternalGameReturnsNotFound() throws Exception {
        when(gameDetailsService.find(99L)).thenThrow(new ResourceNotFoundException("Game not found in IGDB"));
        mvc.perform(get("/api/discovery/games/99"))
                .andExpect(status().isNotFound());
    }
}
