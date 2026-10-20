package com.gothsins.questlog.discovery;

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
        mvc.perform(get("/api/discovery/home"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.popular.available").value(false))
                .andExpect(jsonPath("$.upcoming.games[0].igdbId").value(42))
                .andExpect(jsonPath("$.upcoming.games.length()").value(1))
                .andExpect(jsonPath("$.library").doesNotExist());
    }
}
