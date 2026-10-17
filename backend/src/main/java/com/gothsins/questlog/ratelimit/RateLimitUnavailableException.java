package com.gothsins.questlog.ratelimit;

public class RateLimitUnavailableException extends RuntimeException {
    public RateLimitUnavailableException() {
        super("Rate limiting temporarily unavailable");
    }
}
