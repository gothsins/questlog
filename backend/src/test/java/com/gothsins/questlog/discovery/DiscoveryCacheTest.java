package com.gothsins.questlog.discovery;

import com.gothsins.questlog.igdb.IgdbClient;
import com.gothsins.questlog.igdb.IgdbGameDetailsResponse;
import com.gothsins.questlog.igdb.IgdbGameResponse;
import com.gothsins.questlog.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.serializer.JacksonJsonRedisSerializer;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DiscoveryCacheTest {
    @Configuration
    @EnableCaching
    static class CacheTestConfiguration {
        @Bean CacheManager cacheManager() {
            return new ConcurrentMapCacheManager("discoveryPopular", "discoveryUpcoming", "discoverySteam",
                    "discoveryFps", "discoveryIndie", "discoveryGenres", "discoveryFirstPerson", "discoveryGameDetails");
        }
        @Bean IgdbClient igdbClient() { return mock(IgdbClient.class); }
        @Bean DiscoveryTaxonomyService discoveryTaxonomyService(IgdbClient client) {
            return new DiscoveryTaxonomyService(client);
        }
        @Bean DiscoveryService discoveryService(IgdbClient client, DiscoveryTaxonomyService taxonomy) {
            return new DiscoveryService(client, taxonomy);
        }
        @Bean DiscoveryGameSource discoveryGameSource(IgdbClient client) { return new DiscoveryGameSource(client); }
    }

    @Test
    void sharesSuccessfulResultButDoesNotCacheProviderFailure() {
        try (var context = new AnnotationConfigApplicationContext(CacheTestConfiguration.class)) {
            IgdbClient client = context.getBean(IgdbClient.class);
            DiscoveryService service = context.getBean(DiscoveryService.class);
            when(client.query(eq("/popularity_primitives"), anyString(), eq(IgdbPopularityPrimitive[].class)))
                    .thenThrow(new IllegalStateException("offline"))
                    .thenReturn(List.of());
            assertThrows(IllegalStateException.class, service::popular);
            assertTrue(service.popular().available());
            assertTrue(service.popular().available());
            verify(client, times(2)).query(eq("/popularity_primitives"), anyString(), eq(IgdbPopularityPrimitive[].class));
        }
    }

    @Test
    void detailsCacheOnlySuccessfulExternalRead() {
        try (var context = new AnnotationConfigApplicationContext(CacheTestConfiguration.class)) {
            IgdbClient client = context.getBean(IgdbClient.class);
            DiscoveryGameSource source = context.getBean(DiscoveryGameSource.class);
            IgdbGameDetailsResponse details = new IgdbGameDetailsResponse(
                    99L, "Elden Ring", null, null, null, null);
            when(client.findGameDetailsById(99L))
                    .thenThrow(new IllegalStateException("offline"))
                    .thenReturn(Optional.of(details));
            assertThrows(IllegalStateException.class, () -> source.find(99L));
            assertSame(details, source.find(99L));
            assertSame(details, source.find(99L));
            verify(client, times(2)).findGameDetailsById(99L);
            when(client.findGameDetailsById(100L)).thenReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> source.find(100L));
            assertThrows(ResourceNotFoundException.class, () -> source.find(100L));
            verify(client, times(2)).findGameDetailsById(100L);
        }
    }

    @Test
    void cachedDetailsPreserveExternalReleaseDateAndCover() {
        var serializer = new JacksonJsonRedisSerializer<>(
                JsonMapper.builder().build(), IgdbGameDetailsResponse.class);
        var details = new IgdbGameDetailsResponse(
                99L, "Elden Ring", "Journey", 1645747200L,
                new IgdbGameResponse.Cover("co123"),
                List.of(new IgdbGameDetailsResponse.Genre("RPG")),
                List.of(new IgdbGameDetailsResponse.Screenshot("sc123")),
                List.of(new IgdbGameDetailsResponse.Video("Trailer", "M7lc1UVf-VE")));

        IgdbGameDetailsResponse restored = serializer.deserialize(serializer.serialize(details));

        assertNotNull(restored);
        assertEquals(details.firstReleaseDate(), restored.firstReleaseDate());
        assertEquals("co123", restored.cover().imageId());
        assertEquals("sc123", restored.screenshots().getFirst().imageId());
        assertEquals("M7lc1UVf-VE", restored.videos().getFirst().videoId());
    }

    @Test
    void steamAndVisitsHaveSeparateSuccessfulCaches() {
        try (var context = new AnnotationConfigApplicationContext(CacheTestConfiguration.class)) {
            IgdbClient client = context.getBean(IgdbClient.class);
            DiscoveryService service = context.getBean(DiscoveryService.class);
            when(client.query(eq("/popularity_primitives"), anyString(), eq(IgdbPopularityPrimitive[].class)))
                    .thenReturn(List.of());

            service.popular();
            service.popular();
            service.steam();
            service.steam();

            verify(client).query(eq("/popularity_primitives"), contains("popularity_type = 1"),
                    eq(IgdbPopularityPrimitive[].class));
            verify(client).query(eq("/popularity_primitives"), contains("popularity_type = 5"),
                    eq(IgdbPopularityPrimitive[].class));
        }
    }

    @Test
    void taxonomyAndSectionsRoundTripThroughTypedRedisSerialization() {
        JsonMapper mapper = JsonMapper.builder().build();
        var genreSerializer = new JacksonJsonRedisSerializer<>(mapper, DiscoveryGenres.class);
        var sectionSerializer = new JacksonJsonRedisSerializer<>(mapper, DiscoverySection.class);
        DiscoveryGenres genres = new DiscoveryGenres(5, 32);
        DiscoverySection section = new DiscoverySection(List.of(
                new DiscoveryGame(99, "Game", "https://images.igdb.com/cover.jpg", null,
                        "IGDB PopScore · pico Steam em 24 horas")), true, null);

        assertEquals(genres, genreSerializer.deserialize(genreSerializer.serialize(genres)));
        assertEquals(section, sectionSerializer.deserialize(sectionSerializer.serialize(section)));
    }
}
