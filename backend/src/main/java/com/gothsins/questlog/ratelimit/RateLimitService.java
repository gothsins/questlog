package com.gothsins.questlog.ratelimit;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class RateLimitService {

    private final LettuceBasedProxyManager<String>
            proxyManager;

    public RateLimitService(
            LettuceBasedProxyManager<String> proxyManager
    ) {
        this.proxyManager = proxyManager;
    }

    public RateLimitDecision check(
            String key,
            int maxRequests,
            Duration window
    ) {

        BucketConfiguration configuration =
                BucketConfiguration.builder()
                        .addLimit(limit ->
                                limit.capacity(maxRequests)
                                        .refillGreedy(
                                                maxRequests,
                                                window
                                        )
                        )
                        .build();

        try {
            Bucket bucket = proxyManager.getProxy(key, () -> configuration);
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
            if (probe.isConsumed()) {
                return RateLimitDecision.allowedRequest();
            }
            long nanos = probe.getNanosToWaitForRefill();
            long seconds = nanos / 1_000_000_000L
                    + (nanos % 1_000_000_000L == 0 ? 0 : 1);
            return RateLimitDecision.rejected(seconds);
        } catch (RuntimeException exception) {
            throw new RateLimitUnavailableException();
        }
    }
}
