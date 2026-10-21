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
    static final int STEAM_PEAK_TYPE = 5;
    static final int MAIN_GAME_TYPE = 0;
    private static final String COVER_BASE = "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/";

    private final IgdbClient client;
    private final DiscoveryTaxonomyService taxonomy;

    public DiscoveryService(IgdbClient client, DiscoveryTaxonomyService taxonomy) {
        this.client = client;
        this.taxonomy = taxonomy;
    }

    @Cacheable(value = "discoveryPopular", key = "'igdb-visits-v1'", sync = true)
    public DiscoverySection popular() {
        return rankedGames(IGDB_VISITS_TYPE, "IGDB PopScore · visitas às páginas");
    }

    @Cacheable(value = "discoverySteam", key = "'steam-peak-v1'", sync = true)
    public DiscoverySection steam() {
        return rankedGames(STEAM_PEAK_TYPE, "IGDB PopScore · pico Steam em 24 horas");
    }

    private DiscoverySection rankedGames(int popularityType, String source) {
        List<IgdbPopularityPrimitive> primitives = client.query(
                "/popularity_primitives",
                "fields game_id,value,calculated_at; where popularity_type = "
                        + popularityType + "; sort value desc; limit 40;",
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
                        + "where id = (" + ids + "); limit 40;",
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
            if (game != null) games.add(normalize(game, source));
            if (games.size() == 10) break;
        }
        Instant calculatedAt = ranked.stream().map(IgdbPopularityPrimitive::calculatedAt)
                .filter(value -> value != null && value > 0)
                .map(Instant::ofEpochSecond).max(Comparator.naturalOrder()).orElse(null);
        return new DiscoverySection(games, true, calculatedAt);
    }

    @Cacheable(value = "discoveryFps", key = "'first-person-shooter-v1'", sync = true)
    public DiscoverySection fps() {
        long shooterId = taxonomy.genres().shooterId();
        long firstPersonId = taxonomy.firstPersonId();
        long now = Instant.now().getEpochSecond();
        List<IgdbDiscoveryGame> candidates = client.query("/games",
                collectionFields() + " where genres = " + shooterId
                        + " & player_perspectives = " + firstPersonId
                        + commonCollectionFilters(now)
                        + "; sort total_rating_count desc; limit 70;",
                IgdbDiscoveryGame[].class);
        List<DiscoveryGame> games = candidates.stream()
                .filter(this::isMainGame)
                .filter(game -> isReleased(game, now))
                .filter(game -> contains(game.genres(), shooterId))
                .filter(game -> contains(game.playerPerspectives(), firstPersonId))
                .filter(game -> hasReliableRating(game, 20))
                .sorted(Comparator.comparing(IgdbDiscoveryGame::totalRatingCount).reversed()
                        .thenComparing(IgdbDiscoveryGame::id))
                .collect(java.util.stream.Collectors.toMap(IgdbDiscoveryGame::id,
                        game -> game, (first, duplicate) -> first,
                        java.util.LinkedHashMap::new))
                .values().stream().limit(10)
                .map(game -> normalize(game, "IGDB · Shooter em primeira pessoa"))
                .toList();
        return new DiscoverySection(games, true, Instant.now());
    }

    @Cacheable(value = "discoveryIndie", key = "'indie-v1'", sync = true)
    public DiscoverySection indie() {
        long indieId = taxonomy.genres().indieId();
        long now = Instant.now().getEpochSecond();
        String filters = " where genres = " + indieId + commonCollectionFilters(now) + "; ";
        List<IgdbDiscoveryGame> established = client.query("/games",
                collectionFields() + filters + "sort total_rating_count desc; limit 70;",
                IgdbDiscoveryGame[].class);
        List<IgdbDiscoveryGame> acclaimed = client.query("/games",
                collectionFields() + filters + "sort total_rating desc; limit 70;",
                IgdbDiscoveryGame[].class);
        List<IgdbDiscoveryGame> counted = eligibleIndies(established, indieId, now)
                .stream().sorted(Comparator.comparing(IgdbDiscoveryGame::totalRatingCount).reversed())
                .toList();
        List<IgdbDiscoveryGame> rated = eligibleIndies(acclaimed, indieId, now)
                .stream().filter(game -> game.totalRating() != null)
                .sorted(Comparator.comparing(IgdbDiscoveryGame::totalRating).reversed())
                .toList();
        List<DiscoveryGame> games = mixIndies(counted, rated).stream()
                .map(game -> normalize(game, "IGDB · gênero Indie"))
                .toList();
        return new DiscoverySection(games, true, Instant.now());
    }

    public DiscoveryGame featured(DiscoverySection steam, DiscoverySection popular,
                                  DiscoverySection fps, DiscoverySection indie) {
        for (DiscoverySection section : List.of(steam, popular, fps, indie)) {
            if (!section.available()) continue;
            for (DiscoveryGame game : section.games()) {
                if (game.coverUrl() != null && game.releaseDate() != null) return game;
            }
        }
        return null;
    }

    private String collectionFields() {
        return "fields id,name,first_release_date,game_type,version_parent,parent_game,"
                + "cover.image_id,genres,player_perspectives,total_rating,total_rating_count;";
    }

    private String commonCollectionFilters(long now) {
        return " & game_type = " + MAIN_GAME_TYPE
                + " & version_parent = null & parent_game = null"
                + " & first_release_date < " + now
                + " & total_rating_count >= 20";
    }

    private boolean contains(List<Long> values, long id) {
        return values != null && values.contains(id);
    }

    private boolean isReleased(IgdbDiscoveryGame game, long now) {
        return game.firstReleaseDate() != null && game.firstReleaseDate() > 0
                && game.firstReleaseDate() < now;
    }

    private boolean hasReliableRating(IgdbDiscoveryGame game, int minimum) {
        return game.totalRatingCount() != null && game.totalRatingCount() >= minimum;
    }

    private List<IgdbDiscoveryGame> eligibleIndies(List<IgdbDiscoveryGame> candidates,
                                                    long indieId, long now) {
        return candidates.stream()
                .filter(this::isMainGame)
                .filter(game -> isReleased(game, now))
                .filter(game -> contains(game.genres(), indieId))
                .filter(game -> hasReliableRating(game, 50))
                .filter(game -> game.cover() != null && validImage(game.cover().imageId()))
                .toList();
    }

    private List<IgdbDiscoveryGame> mixIndies(List<IgdbDiscoveryGame> established,
                                               List<IgdbDiscoveryGame> acclaimed) {
        List<IgdbDiscoveryGame> selected = new ArrayList<>();
        Set<Long> ids = new HashSet<>();
        int establishedIndex = 0;
        int acclaimedIndex = 0;
        while (selected.size() < 10
                && (establishedIndex < established.size() || acclaimedIndex < acclaimed.size())) {
            if (establishedIndex < established.size()) {
                IgdbDiscoveryGame game = established.get(establishedIndex++);
                if (ids.add(game.id())) selected.add(game);
            }
            if (selected.size() < 10 && acclaimedIndex < acclaimed.size()) {
                IgdbDiscoveryGame game = acclaimed.get(acclaimedIndex++);
                if (ids.add(game.id())) selected.add(game);
            }
        }
        return selected;
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
                validImage(image) ? COVER_BASE + image + ".jpg" : null,
                releaseDate(game.firstReleaseDate()), source);
    }

    private boolean validImage(String image) {
        return image != null && image.matches("[A-Za-z0-9_-]+");
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
