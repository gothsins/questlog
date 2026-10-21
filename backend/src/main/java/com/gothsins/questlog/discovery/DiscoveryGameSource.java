package com.gothsins.questlog.discovery;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.igdb.IgdbClient;
import com.gothsins.questlog.igdb.IgdbGameDetailsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DiscoveryGameSource {
    private final IgdbClient igdbClient;

    @Cacheable("discoveryGameDetails")
    public IgdbGameDetailsResponse find(Long igdbId) {
        return igdbClient.findGameDetailsById(igdbId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found in IGDB"));
    }
}
