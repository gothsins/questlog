package com.gothsins.questlog.ratelimit;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
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

    public boolean isAllowed(
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

        Bucket bucket = proxyManager.getProxy(
                key,
                () -> configuration
        );

        return bucket.tryConsume(1);
    }
}