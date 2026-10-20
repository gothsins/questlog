package com.gothsins.questlog.discovery;

import com.gothsins.questlog.igdb.IgdbClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DiscoveryServiceTest {
    private IgdbClient client;
    private DiscoveryService service;

    @BeforeEach
    void setUp() {
        client = mock(IgdbClient.class);
        service = new DiscoveryService(client);
    }

    @Test
    void popularPreservesVisitRankAndSkipsInvalidOrNonMainGames() {
        assertEquals(1, DiscoveryService.IGDB_VISITS_TYPE);
        when(client.query(eq("/popularity_primitives"), contains("popularity_type = 1"), eq(IgdbPopularityPrimitive[].class)))
                .thenReturn(List.of(new IgdbPopularityPrimitive(13L, 7.0, 1000L),
                        new IgdbPopularityPrimitive(11L, 9.0, 1000L),
                        new IgdbPopularityPrimitive(12L, 8.0, 1000L),
                        new IgdbPopularityPrimitive(11L, 6.0, 1000L)));
        when(client.query(eq("/games"), anyString(), eq(IgdbDiscoveryGame[].class)))
                .thenReturn(List.of(game(13L, "Third", 0, null),
                        game(12L, "DLC", 1, null), game(11L, "First", 0, null)));
        DiscoverySection section = service.popular();
        assertEquals(List.of("First", "Third"), section.games().stream().map(DiscoveryGame::title).toList());
        assertEquals(Instant.ofEpochSecond(1000), section.updatedAt());
        assertEquals("IGDB PopScore · visitas às páginas", section.games().getFirst().popularitySource());
        verify(client).query(eq("/games"), contains("11,12,13"), eq(IgdbDiscoveryGame[].class));
    }

    @Test
    void upcomingKeepsOnlyFutureMainGamesAndDeduplicatesNames() {
        long future = Instant.now().plusSeconds(86400 * 30).getEpochSecond();
        long past = Instant.now().minusSeconds(86400 * 30).getEpochSecond();
        when(client.query(eq("/games"), contains("game_type = 0"), eq(IgdbDiscoveryGame[].class)))
                .thenReturn(List.of(game(2L, "Later", 0, future + 86400),
                        game(1L, "Soon", 0, future), game(3L, "SOON", 0, future),
                        game(4L, "Old", 0, past), game(5L, "Addon", 1, future),
                        game(6L, "Unknown", 0, null),
                        game(7L, "Invalid date", 0, Long.MAX_VALUE)));
        assertEquals(List.of("Soon", "Later"), service.upcoming().games().stream()
                .map(DiscoveryGame::title).toList());
    }

    @Test
    void providerFailureIsNotTurnedIntoAValidRanking() {
        when(client.query(eq("/popularity_primitives"), anyString(), eq(IgdbPopularityPrimitive[].class)))
                .thenThrow(new IllegalStateException("provider unavailable"));
        assertThrows(IllegalStateException.class, service::popular);
    }

    private IgdbDiscoveryGame game(long id, String name, int type, Long release) {
        return new IgdbDiscoveryGame(id, name, release, type, null, null,
                new IgdbDiscoveryGame.Cover("cover" + id));
    }
}
