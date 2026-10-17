package com.gothsins.questlog.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SecurityCorsTest {
    private final SecurityConfig config = new SecurityConfig();

    @Test
    void configuredOriginCanReadRetryAfter() {
        var source = config.corsConfigurationSource(
                List.of("https://questlog.example"));
        var cors = source.getCorsConfiguration(
                new MockHttpServletRequest("OPTIONS", "/api/auth/login"));
        assertEquals(List.of("https://questlog.example"),
                cors.getAllowedOrigins());
        assertEquals(List.of("Retry-After"), cors.getExposedHeaders());
        assertEquals(false, cors.getAllowCredentials());
    }

    @Test
    void wildcardOriginIsRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> config.corsConfigurationSource(List.of("*")));
    }
}
