package com.gothsins.questlog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;

import java.time.Duration;

@Configuration
public class RedisConfig {

    @Bean
    public RedisCacheConfiguration redisCacheConfiguration() {

        return RedisCacheConfiguration
                .defaultCacheConfig()

                .entryTtl(Duration.ofMinutes(30))

                .disableCachingNullValues()

                .serializeValuesWith(
                        RedisSerializationContext
                                .SerializationPair
                                .fromSerializer(
                                        RedisSerializer.json()
                                )
                );
    }
}