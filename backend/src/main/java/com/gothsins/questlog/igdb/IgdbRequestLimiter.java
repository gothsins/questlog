package com.gothsins.questlog.igdb;

import org.springframework.stereotype.Component;

import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Component
public class IgdbRequestLimiter {
    private static final long INTERVAL_NANOS = TimeUnit.MILLISECONDS.toNanos(275);
    private final Semaphore openRequests = new Semaphore(8);
    private long nextRequestNanos;
    private boolean initialized;

    public <T> T execute(Supplier<T> request) {
        try {
            openRequests.acquire();
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("IGDB request interrupted", interrupted);
        }
        try {
            long delay = reserveDelay(System.nanoTime());
            if (delay > 0) TimeUnit.NANOSECONDS.sleep(delay);
            return request.get();
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("IGDB request interrupted", interrupted);
        } finally {
            openRequests.release();
        }
    }

    synchronized long reserveDelay(long now) {
        if (!initialized || now >= nextRequestNanos) {
            initialized = true;
            nextRequestNanos = now + INTERVAL_NANOS;
            return 0;
        }
        long delay = nextRequestNanos - now;
        nextRequestNanos += INTERVAL_NANOS;
        return delay;
    }
}
