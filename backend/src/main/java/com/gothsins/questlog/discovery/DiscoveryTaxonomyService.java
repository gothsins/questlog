package com.gothsins.questlog.discovery;

import com.gothsins.questlog.igdb.IgdbClient;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscoveryTaxonomyService {
    private final IgdbClient client;

    @Cacheable(value = "discoveryGenres", key = "'home-v1'", sync = true)
    public DiscoveryGenres genres() {
        List<IgdbTaxon> genres = client.query(
                "/genres", "fields id,name,slug; limit 100;", IgdbTaxon[].class);
        return new DiscoveryGenres(
                findBySlug(genres, "shooter"),
                findBySlug(genres, "indie")
        );
    }

    @Cacheable(value = "discoveryFirstPerson", key = "'home-v1'", sync = true)
    public Long firstPersonId() {
        List<IgdbTaxon> perspectives = client.query(
                "/player_perspectives", "fields id,name,slug; limit 100;", IgdbTaxon[].class);
        return findBySlug(perspectives, "first-person");
    }

    private long findBySlug(List<IgdbTaxon> values, String slug) {
        return values.stream()
                .filter(value -> value != null && value.id() != null && value.id() > 0)
                .filter(value -> slug.equalsIgnoreCase(value.slug()))
                .map(IgdbTaxon::id)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Required IGDB taxonomy unavailable"));
    }
}
