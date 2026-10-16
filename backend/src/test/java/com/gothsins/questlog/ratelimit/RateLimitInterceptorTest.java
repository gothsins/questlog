package com.gothsins.questlog.ratelimit;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitInterceptorTest {

    @Mock private RateLimitService rateLimitService;
    @Mock private JsonMapper jsonMapper;
    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @InjectMocks private RateLimitInterceptor interceptor;

    @Test
    void loginShouldUseFiveTokensPerMinute() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(rateLimitService.isAllowed(
                "rate-limit:/api/auth/login:127.0.0.1",
                5, Duration.ofMinutes(1))).thenReturn(true);

        assertTrue(interceptor.preHandle(request, response, new Object()));
        verify(rateLimitService).isAllowed(
                "rate-limit:/api/auth/login:127.0.0.1",
                5, Duration.ofMinutes(1));
    }

    @Test
    void registrationShouldUseThreeTokensPerTenMinutes() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/register");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(rateLimitService.isAllowed(
                "rate-limit:/api/auth/register:127.0.0.1",
                3, Duration.ofMinutes(10))).thenReturn(true);

        assertTrue(interceptor.preHandle(request, response, new Object()));
        verify(rateLimitService).isAllowed(
                "rate-limit:/api/auth/register:127.0.0.1",
                3, Duration.ofMinutes(10));
    }

    @Test
    void exhaustedLoginBucketShouldReturn429() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        assertFalse(interceptor.preHandle(request, response, new Object()));
        verify(response).setStatus(429);
        verify(response).setContentType("application/json");
    }

    @Test
    void unrelatedPathsShouldNotConsumeTokens() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/users/me");

        assertTrue(interceptor.preHandle(request, response, new Object()));
        verifyNoInteractions(rateLimitService);
    }
}
