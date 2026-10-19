package com.gothsins.questlog.auth;

public class PwnedPasswordUnavailableException extends RuntimeException {
    public PwnedPasswordUnavailableException() {
        super("Password safety check unavailable; try again later");
    }
}
