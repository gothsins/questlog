package com.gothsins.questlog.ratelimit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "security.jwt.secret=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
        "igdb.client-id=test-client",
        "igdb.client-secret=test-secret"
})
class RateLimitRedisIT {
    @Autowired private RateLimitService service;

    @Test
    void redisBucketReturnsWaitAndRecoversAfterRefill() throws Exception {
        String key = "security-it:" + UUID.randomUUID();
        Duration window = Duration.ofMillis(100);

        assertTrue(service.check(key, 1, window).allowed());
        RateLimitDecision blocked = service.check(key, 1, window);
        assertFalse(blocked.allowed());
        assertEquals(1, blocked.retryAfterSeconds());
        Thread.sleep(220);
        assertTrue(service.check(key, 1, window).allowed());
    }

    @Test
    void concurrentRequestsShareAtomicRedisCapacity() throws Exception {
        String key = "security-it:" + UUID.randomUUID();
        int callers = 20;
        CountDownLatch start = new CountDownLatch(1);

        try (var executor = Executors.newFixedThreadPool(callers)) {
            List<Callable<Boolean>> tasks = new ArrayList<>();
            for (int i = 0; i < callers; i++) {
                tasks.add(() -> {
                    start.await();
                    return service.check(key, 5, Duration.ofMinutes(1)).allowed();
                });
            }
            List<Future<Boolean>> results = new ArrayList<>();
            for (Callable<Boolean> task : tasks) {
                results.add(executor.submit(task));
            }
            start.countDown();
            long accepted = 0;
            for (Future<Boolean> result : results) {
                if (result.get()) accepted++;
            }
            assertEquals(5, accepted);
        }
    }
}
