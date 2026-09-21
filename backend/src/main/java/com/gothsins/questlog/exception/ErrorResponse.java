package com.gothsins.questlog.exception;

import java.util.List;

public record ErrorResponse(
        String message,
        int status,
        List<FieldErrorDetail> errors) {
    public ErrorResponse(String message, int status) {
        this(message, status, null);
    }
}