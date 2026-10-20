package com.gothsins.questlog.discovery;

import com.gothsins.questlog.igdb.IgdbClient;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DiscoveryCacheTest {
    @Configuration
    @EnableCaching
    static class CacheTestConfiguration {
        @Bean CacheManager cacheManager() {
            return new ConcurrentMapCacheManager("discoveryPopular", "discoveryUpcoming");
        }
        @Bean IgdbClient igdbClient() { return mock(IgdbClient.class); }
        @Bean DiscoveryService discoveryService(IgdbClient client) { return new DiscoveryService(client); }
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
}
