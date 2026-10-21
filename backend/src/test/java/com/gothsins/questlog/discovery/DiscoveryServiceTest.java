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
    private DiscoveryTaxonomyService taxonomy;
    private DiscoveryService service;

    @BeforeEach
    void setUp() {
        client = mock(IgdbClient.class);
        taxonomy = mock(DiscoveryTaxonomyService.class);
        service = new DiscoveryService(client, taxonomy);
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

    @Test
    void steamUsesPeakTypeAndPreservesRankAfterExcludingAddons() {
        assertEquals(5, DiscoveryService.STEAM_PEAK_TYPE);
        when(client.query(eq("/popularity_primitives"), contains("popularity_type = 5"), eq(IgdbPopularityPrimitive[].class)))
                .thenReturn(List.of(new IgdbPopularityPrimitive(2L, 80.0, 1000L),
                        new IgdbPopularityPrimitive(3L, 90.0, 1000L),
                        new IgdbPopularityPrimitive(1L, 100.0, 1000L),
                        new IgdbPopularityPrimitive(4L, 95.0, 1000L),
                        new IgdbPopularityPrimitive(1L, 70.0, 1000L)));
        when(client.query(eq("/games"), anyString(), eq(IgdbDiscoveryGame[].class)))
                .thenReturn(List.of(game(2L, "Second", 0, null),
                        game(3L, "Expansion", 1, null), game(1L, "First", 0, null),
                        new IgdbDiscoveryGame(4L, "Special edition", null, 0, 1L, null,
                                new IgdbDiscoveryGame.Cover("cover4"))));

        DiscoverySection section = service.steam();

        assertEquals(List.of("First", "Second"), section.games().stream().map(DiscoveryGame::title).toList());
        assertEquals("IGDB PopScore · pico Steam em 24 horas", section.games().getFirst().popularitySource());
    }

    @Test
    void fpsRequiresBothShooterAndFirstPersonMetadata() {
        when(taxonomy.genres()).thenReturn(new DiscoveryGenres(5, 32));
        when(taxonomy.firstPersonId()).thenReturn(1L);
        when(client.query(eq("/games"), argThat(body -> body.contains("genres = 5")
                        && body.contains("player_perspectives = 1")),
                eq(IgdbDiscoveryGame[].class))).thenReturn(List.of(
                collectionGame(1, "FPS", 0, List.of(5L), List.of(1L), 100, 80.0),
                collectionGame(2, "Third person", 0, List.of(5L), List.of(2L), 200, 90.0),
                collectionGame(3, "Other genre", 0, List.of(6L), List.of(1L), 300, 95.0),
                collectionGame(4, "DLC", 1, List.of(5L), List.of(1L), 400, 99.0)));

        assertEquals(List.of("FPS"), service.fps().games().stream().map(DiscoveryGame::title).toList());
    }

    @Test
    void indieMixesEstablishedAndAcclaimedWithoutLowSampleOrDuplicates() {
        when(taxonomy.genres()).thenReturn(new DiscoveryGenres(5, 32));
        IgdbDiscoveryGame established = collectionGame(1, "Established", 0, List.of(32L), List.of(), 500, 70.0);
        IgdbDiscoveryGame acclaimed = collectionGame(2, "Acclaimed", 0, List.of(32L), List.of(), 60, 95.0);
        IgdbDiscoveryGame lowSample = collectionGame(3, "Low sample", 0, List.of(32L), List.of(), 3, 99.0);
        when(client.query(eq("/games"), contains("sort total_rating_count desc"), eq(IgdbDiscoveryGame[].class)))
                .thenReturn(List.of(established, lowSample));
        when(client.query(eq("/games"), contains("sort total_rating desc"), eq(IgdbDiscoveryGame[].class)))
                .thenReturn(List.of(lowSample, acclaimed, established));

        assertEquals(List.of("Established", "Acclaimed"), service.indie().games().stream()
                .map(DiscoveryGame::title).toList());
    }

    @Test
    void featuredPrefersCompleteSteamGameAndFallsBackToRealPopularGame() {
        DiscoveryGame incomplete = new DiscoveryGame(1, "Missing cover", null,
                java.time.LocalDate.now(), "Steam");
        DiscoveryGame popular = new DiscoveryGame(2, "Complete", "https://images.igdb.com/cover.jpg",
                java.time.LocalDate.now(), "IGDB");
        DiscoveryGame steamComplete = new DiscoveryGame(3, "Steam", "https://images.igdb.com/steam.jpg",
                java.time.LocalDate.now(), "Steam peak");
        DiscoverySection steam = new DiscoverySection(List.of(incomplete), true, null);
        DiscoverySection visits = new DiscoverySection(List.of(popular), true, null);

        assertEquals(popular, service.featured(steam, visits, DiscoverySection.unavailable(),
                DiscoverySection.unavailable()));
        assertEquals(steamComplete, service.featured(new DiscoverySection(List.of(steamComplete), true, null),
                visits, DiscoverySection.unavailable(), DiscoverySection.unavailable()));
    }

    private IgdbDiscoveryGame collectionGame(long id, String name, int type, List<Long> genres,
                                              List<Long> perspectives, int count, Double rating) {
        return new IgdbDiscoveryGame(id, name, Instant.now().minusSeconds(86400).getEpochSecond(),
                type, null, null, new IgdbDiscoveryGame.Cover("cover" + id),
                genres, perspectives, rating, count);
    }

    private IgdbDiscoveryGame game(long id, String name, int type, Long release) {
        return new IgdbDiscoveryGame(id, name, release, type, null, null,
                new IgdbDiscoveryGame.Cover("cover" + id));
    }
}
