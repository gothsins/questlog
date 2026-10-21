package com.gothsins.questlog.igdb;

import org.junit.jupiter.api.Test;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IgdbRequestLimiterTest {
    @Test
    void reservesAtMostFourRequestStartsPerSecond() {
        IgdbRequestLimiter limiter = new IgdbRequestLimiter();
        long now = TimeUnit.SECONDS.toNanos(10);

        assertEquals(0, limiter.reserveDelay(now));
        assertEquals(TimeUnit.MILLISECONDS.toNanos(275), limiter.reserveDelay(now));
        assertEquals(TimeUnit.MILLISECONDS.toNanos(550), limiter.reserveDelay(now));
        assertEquals(TimeUnit.MILLISECONDS.toNanos(825), limiter.reserveDelay(now));
        assertTrue(limiter.reserveDelay(now) >= TimeUnit.SECONDS.toNanos(1));
    }
}
