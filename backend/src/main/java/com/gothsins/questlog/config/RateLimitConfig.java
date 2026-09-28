package com.gothsins.questlog.config;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.redis.lettuce.Bucket4jLettuce;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    @Bean(
            name = "bucket4jRedisClient",
            destroyMethod = "shutdown"
    )
    public RedisClient bucket4jRedisClient(
            @Value("${spring.data.redis.host:localhost}")
            String host,

            @Value("${spring.data.redis.port:6379}")
            int port
    ) {

        return RedisClient.create(
                "redis://" + host + ":" + port
        );
    }

    @Bean(destroyMethod = "close")
    public StatefulRedisConnection<String, byte[]>
    bucket4jRedisConnection(
            @Qualifier("bucket4jRedisClient")
            RedisClient redisClient
    ) {

        return redisClient.connect(
                RedisCodec.of(
                        StringCodec.UTF8,
                        ByteArrayCodec.INSTANCE
                )
        );
    }

    @Bean
    public LettuceBasedProxyManager<String>
    lettuceBasedProxyManager(
            StatefulRedisConnection<String, byte[]>
                    connection
    ) {

        return Bucket4jLettuce
                .casBasedBuilder(connection)
                .expirationAfterWrite(
                        ExpirationAfterWriteStrategy
                                .basedOnTimeForRefillingBucketUpToMax(
                                        Duration.ofMinutes(1)
                                )
                )
                .build();
    }
}