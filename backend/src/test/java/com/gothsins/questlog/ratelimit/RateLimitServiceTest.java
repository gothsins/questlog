package com.gothsins.questlog.ratelimit;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.BucketProxy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RateLimitServiceTest {
    @SuppressWarnings("unchecked")
    private final LettuceBasedProxyManager<String> proxyManager =
            mock(LettuceBasedProxyManager.class);
    private final RateLimitService service = new RateLimitService(proxyManager);

    private BucketProxy proxyFor(Bucket localBucket) {
        BucketProxy proxy = mock(BucketProxy.class);
        when(proxy.tryConsumeAndReturnRemaining(1))
                .thenAnswer(invocation -> localBucket.tryConsumeAndReturnRemaining(1));
        return proxy;
    }

    @Test
    void roundsActualRefillWaitUpToWholeSeconds() {
        BucketProxy bucket = mock(BucketProxy.class);
        when(proxyManager.getProxy(eq("key"), any())).thenReturn(bucket);
        when(bucket.tryConsumeAndReturnRemaining(1))
                .thenReturn(ConsumptionProbe.rejected(0, 1_000_000_001L, 0));

        RateLimitDecision decision = service.check("key", 5, Duration.ofMinutes(1));
        assertFalse(decision.allowed());
        assertEquals(2, decision.retryAfterSeconds());
    }

    @Test
    void rejectsOnRedisFailureInsteadOfAllowingUnmeteredLogin() {
        when(proxyManager.getProxy(eq("key"), any()))
                .thenThrow(new IllegalStateException("redis unavailable"));
        assertThrows(RateLimitUnavailableException.class,
                () -> service.check("key", 5, Duration.ofMinutes(1)));
    }

    @Test
    void bucketRecoversAfterRefill() throws InterruptedException {
        Bucket bucket = Bucket.builder()
                .addLimit(limit -> limit.capacity(1)
                        .refillGreedy(1, Duration.ofMillis(50)))
                .build();
        BucketProxy proxy = proxyFor(bucket);
        when(proxyManager.getProxy(eq("key"), any())).thenReturn(proxy);

        assertTrue(service.check("key", 1, Duration.ofMillis(50)).allowed());
        assertFalse(service.check("key", 1, Duration.ofMillis(50)).allowed());
        Thread.sleep(120);
        assertTrue(service.check("key", 1, Duration.ofMillis(50)).allowed());
    }

    @Test
    void concurrentCallsCannotConsumeMoreThanCapacity() throws Exception {
        Bucket bucket = Bucket.builder()
                .addLimit(limit -> limit.capacity(5)
                        .refillGreedy(5, Duration.ofMinutes(1)))
                .build();
        BucketProxy proxy = proxyFor(bucket);
        when(proxyManager.getProxy(eq("key"), any())).thenReturn(proxy);

        int callers = 20;
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(callers)) {
            List<Callable<Boolean>> tasks = new ArrayList<>();
            for (int i = 0; i < callers; i++) {
                tasks.add(() -> {
                    start.await();
                    return service.check("key", 5, Duration.ofMinutes(1)).allowed();
                });
            }
            List<Future<Boolean>> results = new ArrayList<>();
            for (Callable<Boolean> task : tasks) {
                results.add(executor.submit(task));
            }
            start.countDown();
            long allowed = 0;
            for (Future<Boolean> result : results) {
                if (result.get()) allowed++;
            }
            assertEquals(5, allowed);
        }
    }
}
