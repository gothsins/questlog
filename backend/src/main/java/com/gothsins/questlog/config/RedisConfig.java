
package com.gothsins.questlog.config;

import com.gothsins.questlog.discovery.DiscoverySection;
import com.gothsins.questlog.igdb.IgdbGameDetailsResponse;
import com.gothsins.questlog.game.dto.GameResponse;
import com.gothsins.questlog.igdb.dto.IgdbSearchResult;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.JacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.json.JsonMapper;
import com.gothsins.questlog.game.dto.GameMediaResponse;
import com.gothsins.questlog.game.dto.SteamLinkResponse;
import com.gothsins.questlog.steam.dto.SteamReviewsResponse;
import com.gothsins.questlog.steam.dto.SteamWrittenReviewsResponse;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Configuration
public class RedisConfig {

    @Bean
    public RedisCacheManager redisCacheManager(
            RedisConnectionFactory connectionFactory,
            JsonMapper jsonMapper,
            @Value("${discovery.cache-ttl:6h}") Duration discoveryTtl
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

        RedisCacheConfiguration steamLinksConfig = defaultConfig
                .entryTtl(Duration.ofHours(12))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(
                                        new JacksonJsonRedisSerializer<>(
                                                jsonMapper,
                                                SteamLinkResponse.class
                                        )
                                )
                );

        RedisCacheConfiguration steamReviewTextsConfig = defaultConfig
                .entryTtl(Duration.ofMinutes(10))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(
                                        new JacksonJsonRedisSerializer<>(
                                                jsonMapper,
                                                SteamWrittenReviewsResponse.class
                                        )
                                )
                );

        RedisCacheConfiguration gameMediaConfig = defaultConfig
                .entryTtl(Duration.ofHours(6))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(
                                        new JacksonJsonRedisSerializer<>(
                                                jsonMapper,
                                                GameMediaResponse.class
                                        )
                                )
                );

        RedisCacheConfiguration steamReviewsConfig = defaultConfig
                .entryTtl(Duration.ofMinutes(15))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(
                                        new JacksonJsonRedisSerializer<>(
                                                jsonMapper,
                                                SteamReviewsResponse.class
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

        RedisCacheConfiguration discoveryConfig = defaultConfig
                .entryTtl(discoveryTtl)
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new JacksonJsonRedisSerializer<>(
                                        jsonMapper, DiscoverySection.class))
                );

        RedisCacheConfiguration discoveryGameConfig = defaultConfig
                .entryTtl(discoveryTtl)
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new JacksonJsonRedisSerializer<>(
                                        jsonMapper, IgdbGameDetailsResponse.class))
                );

        return RedisCacheManager
                .builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(
                        Map.of(
                                "igdbSearch", igdbConfig,
                                "gamesList", gamesListConfig,
                                "games", gamesConfig,
                                "gameMedia", gameMediaConfig,
                                "steamLinks", steamLinksConfig,
                                "steamReviews", steamReviewsConfig,
                                "steamReviewTexts", steamReviewTextsConfig,
                                "discoveryPopular", discoveryConfig,
                                "discoveryUpcoming", discoveryConfig,
                                "discoveryGameDetails", discoveryGameConfig
                        )
                )
                .disableCreateOnMissingCache()
                .build();
    }
}
