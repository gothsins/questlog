package com.gothsins.questlog.discovery;

import com.gothsins.questlog.igdb.IgdbClient;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.DateTimeException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class DiscoveryService {
    // IGDB PopScore documents type 1 as IGDB page Visits.
    // https://api-docs.igdb.com/#how-to-use-popularity-api
    static final int IGDB_VISITS_TYPE = 1;
    static final int MAIN_GAME_TYPE = 0;
    private static final String COVER_BASE = "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/";

    private final IgdbClient client;

    public DiscoveryService(IgdbClient client) {
        this.client = client;
    }

    @Cacheable(value = "discoveryPopular", key = "'igdb-visits-v1'", sync = true)
    public DiscoverySection popular() {
        List<IgdbPopularityPrimitive> primitives = client.query(
                "/popularity_primitives",
                "fields game_id,value,calculated_at; where popularity_type = "
                        + IGDB_VISITS_TYPE + "; sort value desc; limit 30;",
                IgdbPopularityPrimitive[].class);

        List<IgdbPopularityPrimitive> ranked = primitives.stream()
                .filter(p -> p.gameId() != null && p.gameId() > 0 && p.value() != null)
                .sorted(Comparator.comparing(IgdbPopularityPrimitive::value).reversed())
                .toList();
        if (ranked.isEmpty()) return new DiscoverySection(List.of(), true, null);

        String ids = ranked.stream().map(p -> p.gameId().toString())
                .distinct().reduce((a, b) -> a + "," + b).orElseThrow();
        List<IgdbDiscoveryGame> details = client.query("/games",
                "fields id,name,first_release_date,game_type,version_parent,parent_game,cover.image_id; "
                        + "where id = (" + ids + "); limit 30;",
                IgdbDiscoveryGame[].class);
        if (details.isEmpty()) {
            throw new IllegalStateException("IGDB did not return details for ranked games");
        }
        Map<Long, IgdbDiscoveryGame> byId = new HashMap<>();
        details.stream().filter(this::isMainGame).forEach(g -> byId.put(g.id(), g));

        List<DiscoveryGame> games = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        for (IgdbPopularityPrimitive primitive : ranked) {
            if (!seen.add(primitive.gameId())) continue;
            IgdbDiscoveryGame game = byId.get(primitive.gameId());
            if (game != null) games.add(normalize(game, "IGDB PopScore · visitas às páginas"));
            if (games.size() == 10) break;
        }
        Instant calculatedAt = ranked.stream().map(IgdbPopularityPrimitive::calculatedAt)
                .filter(value -> value != null && value > 0)
                .map(Instant::ofEpochSecond).max(Comparator.naturalOrder()).orElse(null);
        return new DiscoverySection(games, true, calculatedAt);
    }

    @Cacheable(value = "discoveryUpcoming", key = "'main-games-v1'", sync = true)
    public DiscoverySection upcoming() {
        long now = Instant.now().getEpochSecond();
        List<IgdbDiscoveryGame> results = client.query("/games",
                "fields id,name,first_release_date,game_type,version_parent,parent_game,cover.image_id; "
                        + "where first_release_date > " + now
                        + " & game_type = " + MAIN_GAME_TYPE
                        + " & version_parent = null & parent_game = null; "
                        + "sort first_release_date asc; limit 40;",
                IgdbDiscoveryGame[].class);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Set<Long> ids = new HashSet<>();
        Set<String> names = new HashSet<>();
        List<DiscoveryGame> games = results.stream()
                .filter(this::isMainGame)
                .filter(g -> releaseDate(g.firstReleaseDate()) != null
                        && releaseDate(g.firstReleaseDate()).isAfter(today))
                .sorted(Comparator.comparing(g -> releaseDate(g.firstReleaseDate())))
                .filter(g -> ids.add(g.id()))
                .filter(g -> names.add(g.name().trim().toLowerCase(java.util.Locale.ROOT)))
                .limit(10)
                .map(g -> normalize(g, null)).toList();
        return new DiscoverySection(games, true, Instant.now());
    }

    private boolean isMainGame(IgdbDiscoveryGame game) {
        return game != null && game.id() != null && game.id() > 0
                && game.name() != null && !game.name().isBlank()
                && game.gameType() != null && game.gameType() == MAIN_GAME_TYPE
                && game.versionParent() == null && game.parentGame() == null;
    }

    private DiscoveryGame normalize(IgdbDiscoveryGame game, String source) {
        String image = game.cover() == null ? null : game.cover().imageId();
        return new DiscoveryGame(game.id(), game.name(),
                image == null || image.isBlank() ? null : COVER_BASE + image + ".jpg",
                releaseDate(game.firstReleaseDate()), source);
    }

    private LocalDate releaseDate(Long epochSeconds) {
        if (epochSeconds == null || epochSeconds <= 0) return null;
        try {
            return Instant.ofEpochSecond(epochSeconds).atZone(ZoneOffset.UTC).toLocalDate();
        } catch (DateTimeException invalid) {
            return null;
        }
    }
}
