package com.gothsins.questlog.auth;

public class PasswordRejectedException extends RuntimeException {
    public PasswordRejectedException(String message) {
        super(message);
    }
}
