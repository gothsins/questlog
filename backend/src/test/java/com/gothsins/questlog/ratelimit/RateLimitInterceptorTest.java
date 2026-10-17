package com.gothsins.questlog.ratelimit;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RateLimitInterceptorTest {
    private final RateLimitService service = mock(RateLimitService.class);
    private final RateLimitInterceptor interceptor =
            new RateLimitInterceptor(service, JsonMapper.builder().build());

    private MockHttpServletRequest request(String path) {
        MockHttpServletRequest request =
                new MockHttpServletRequest("POST", path);
        request.setRemoteAddr("127.0.0.1");
        return request;
    }

    @Test
    void loginUsesFiveTokensPerMinuteAndHonorsRecovery() throws Exception {
        String key = "rate-limit:/api/auth/login:127.0.0.1";
        when(service.check(key, 5, Duration.ofMinutes(1)))
                .thenReturn(RateLimitDecision.rejected(12))
                .thenReturn(RateLimitDecision.allowedRequest());

        MockHttpServletResponse rejected = new MockHttpServletResponse();
        assertFalse(interceptor.preHandle(
                request("/api/auth/login"), rejected, new Object()));
        assertEquals(429, rejected.getStatus());
        assertEquals("12", rejected.getHeader("Retry-After"));
        assertEquals("no-store", rejected.getHeader("Cache-Control"));
        assertTrue(rejected.getContentAsString().contains("Too many requests"));

        MockHttpServletResponse recovered = new MockHttpServletResponse();
        assertTrue(interceptor.preHandle(
                request("/api/auth/login"), recovered, new Object()));
        verify(service, times(2)).check(key, 5, Duration.ofMinutes(1));
    }

    @Test
    void registrationUsesThreeTokensPerTenMinutes() throws Exception {
        when(service.check("rate-limit:/api/auth/register:127.0.0.1",
                3, Duration.ofMinutes(10)))
                .thenReturn(RateLimitDecision.rejected(200));

        MockHttpServletResponse response = new MockHttpServletResponse();
        assertFalse(interceptor.preHandle(
                request("/api/auth/register"), response, new Object()));
        assertEquals(429, response.getStatus());
        assertEquals("200", response.getHeader("Retry-After"));
    }

    @Test
    void redisFailureFailsClosedWithConsistent503() throws Exception {
        when(service.check(anyString(), anyInt(), any(Duration.class)))
                .thenThrow(new RateLimitUnavailableException());

        MockHttpServletResponse response = new MockHttpServletResponse();
        assertFalse(interceptor.preHandle(
                request("/api/auth/login"), response, new Object()));
        assertEquals(503, response.getStatus());
        assertTrue(response.getContentAsString().contains("Rate limiting temporarily unavailable"));
    }

    @Test
    void ignoresUnrelatedMethodsAndUntrustedForwardedHeaders() throws Exception {
        MockHttpServletRequest get = new MockHttpServletRequest(
                "GET", "/api/auth/login");
        assertTrue(interceptor.preHandle(get,
                new MockHttpServletResponse(), new Object()));

        MockHttpServletRequest post = request("/api/auth/login");
        post.addHeader("X-Forwarded-For", "203.0.113.4");
        when(service.check("rate-limit:/api/auth/login:127.0.0.1",
                5, Duration.ofMinutes(1)))
                .thenReturn(RateLimitDecision.allowedRequest());
        assertTrue(interceptor.preHandle(post,
                new MockHttpServletResponse(), new Object()));
        verify(service).check("rate-limit:/api/auth/login:127.0.0.1",
                5, Duration.ofMinutes(1));
        verifyNoMoreInteractions(service);
    }
}
