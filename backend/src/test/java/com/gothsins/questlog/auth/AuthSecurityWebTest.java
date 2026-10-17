package com.gothsins.questlog.auth;

import com.gothsins.questlog.ratelimit.RateLimitDecision;
import com.gothsins.questlog.ratelimit.RateLimitService;
import com.gothsins.questlog.ratelimit.RateLimitUnavailableException;
import com.gothsins.questlog.security.CustomUserDetailsService;
import com.gothsins.questlog.security.JwtService;
import com.gothsins.questlog.security.SecurityConfig;
import org.springframework.cache.CacheManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthSecurityWebTest {
    @Autowired private MockMvc mockMvc;
    @MockitoBean private AuthService authService;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private CustomUserDetailsService userDetailsService;
    @MockitoBean private RateLimitService rateLimitService;
    @MockitoBean private CacheManager cacheManager;

    @BeforeEach
    void allowRateLimitByDefault() {
        when(rateLimitService.check(anyString(), anyInt(), any()))
                .thenReturn(RateLimitDecision.allowedRequest());
    }

    @Test
    void anonymousProtectedResourceReturns401() throws Exception {
        mockMvc.perform(get("/api/library"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void invalidLoginReturns401WithoutRevealingAccountExistence() throws Exception {
        when(authService.login(any())).thenThrow(
                new org.springframework.security.authentication.BadCredentialsException(
                        "internal detail"));
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"gui\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message")
                        .value("Invalid username or password"));
    }

    @Test
    void legacyLongPasswordStillReachesAuthentication() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"gui\",\"password\":\""
                                + "x".repeat(257) + "\"}"))
                .andExpect(status().isOk());
        verify(authService).login(argThat(request ->
                request.password().length() == 257));
    }

    @Test
    void breachedPasswordReturns400AndOutageReturns503() throws Exception {
        String body = "{\"username\":\"gui\",\"password\":\"senha longa e segura\"}";
        when(authService.register(any()))
                .thenThrow(new PasswordRejectedException(
                        "This password appears in a breach; choose another"))
                .thenThrow(new PwnedPasswordUnavailableException());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503));
    }

    @Test
    void exhaustedLoginReturns429WithExposedRetryAfter() throws Exception {
        when(rateLimitService.check(anyString(), anyInt(), any()))
                .thenReturn(RateLimitDecision.rejected(12));
        mockMvc.perform(post("/api/auth/login")
                        .header("Origin", "http://localhost:5173")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"gui\",\"password\":\"wrong\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "12"))
                .andExpect(header().string("Access-Control-Expose-Headers", "Retry-After"))
                .andExpect(jsonPath("$.status").value(429));
        verifyNoInteractions(authService);
    }

    @Test
    void redisOutageBlocksLoginWith503BeforeAuthentication() throws Exception {
        when(rateLimitService.check(anyString(), anyInt(), any()))
                .thenThrow(new RateLimitUnavailableException());
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"gui\",\"password\":\"wrong\"}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503));
        verifyNoInteractions(authService);
    }

    @Test
    void contextPathAndForwardedHeadersDoNotChangeTheBucketIdentity() throws Exception {
        mockMvc.perform(post("/questlog/api/auth/login")
                        .contextPath("/questlog")
                        .with(request -> {
                            request.setRemoteAddr("198.51.100.7");
                            return request;
                        })
                        .header("X-Forwarded-For", "203.0.113.4")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"gui\",\"password\":\"wrong\"}"))
                .andExpect(status().isOk());
        verify(rateLimitService).check(eq("rate-limit:/api/auth/login:198.51.100.7"),
                eq(5), any());
    }
}
