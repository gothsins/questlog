
package com.gothsins.questlog.config;

import com.gothsins.questlog.game.dto.GameResponse;
import com.gothsins.questlog.igdb.dto.IgdbSearchResult;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.JacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Configuration
public class RedisConfig {

    @Bean
    public RedisCacheManager redisCacheManager(
            RedisConnectionFactory connectionFactory,
            JsonMapper jsonMapper
    ) {

        RedisCacheConfiguration defaultConfig =
                RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(30))
                        .disableCachingNullValues();

        JavaType igdbListType = jsonMapper.getTypeFactory()
                .constructCollectionType(
                        List.class,
                        IgdbSearchResult.class
                );

        JavaType gameListType = jsonMapper.getTypeFactory()
                .constructCollectionType(
                        List.class,
                        GameResponse.class
                );

        RedisCacheConfiguration igdbConfig = defaultConfig
                .entryTtl(Duration.ofMinutes(10))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(
                                        new JacksonJsonRedisSerializer<>(
                                                jsonMapper,
                                                igdbListType
                                        )
                                )
                );

        RedisCacheConfiguration gamesListConfig = defaultConfig
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(
                                        new JacksonJsonRedisSerializer<>(
                                                jsonMapper,
                                                gameListType
                                        )
                                )
                );

        RedisCacheConfiguration gamesConfig = defaultConfig
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(
                                        new JacksonJsonRedisSerializer<>(
                                                jsonMapper,
                                                GameResponse.class
                                        )
                                )
                );

        return RedisCacheManager
                .builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(
                        Map.of(
                                "igdbSearch", igdbConfig,
                                "gamesList", gamesListConfig,
                                "games", gamesConfig
                        )
                )
                .disableCreateOnMissingCache()
                .build();
    }
}
