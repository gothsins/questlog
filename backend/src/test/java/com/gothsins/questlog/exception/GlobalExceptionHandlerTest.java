package com.gothsins.questlog.exception;

import org.junit.jupiter.api.Test;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.MissingServletRequestParameterException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.mock;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void malformedJsonIs400NotAServerError() {
        var response = handler.handleMalformedRequest(
                mock(HttpMessageNotReadableException.class));

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Malformed request", response.getBody().message());
    }

    @Test
    void pathOrParameterTypeMismatchIs400() {
        var response = handler.handleMalformedRequest(
                mock(TypeMismatchException.class));

        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void missingRequestParameterKeepsItsClientErrorStatus() {
        var response = handler.handleUnexpectedException(
                new MissingServletRequestParameterException("query", "String"));

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Invalid request", response.getBody().message());
    }

    @Test
    void frameworkNotFoundIs404WithoutInternalDetails() {
        var response = handler.handleUnexpectedException(
                new ErrorResponseException(HttpStatus.NOT_FOUND));

        assertEquals(404, response.getStatusCode().value());
        assertEquals("Resource not found", response.getBody().message());
    }

    @Test
    void trulyUnexpectedFailuresStillReturnGeneric500() {
        var response = handler.handleUnexpectedException(
                new IllegalStateException("database password is hunter2"));

        assertEquals(500, response.getStatusCode().value());
        assertEquals("Internal server error", response.getBody().message());
        assertFalse(response.getBody().message().contains("hunter2"));
    }
}
