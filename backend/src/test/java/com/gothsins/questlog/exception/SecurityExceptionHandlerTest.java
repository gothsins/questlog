package com.gothsins.questlog.exception;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.*;

class SecurityExceptionHandlerTest {
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void accessDeniedIs403WithoutSensitiveDetails() {
        var response = handler.handleAccessDenied(
                new AccessDeniedException("internal ownership detail"));
        assertEquals(403, response.getStatusCode().value());
        assertEquals("Access denied", response.getBody().message());
        assertFalse(response.getBody().message().contains("ownership"));
    }
}
