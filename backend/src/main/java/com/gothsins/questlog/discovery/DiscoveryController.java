package com.gothsins.questlog.discovery;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.gothsins.questlog.exception.ErrorResponse;
import com.gothsins.questlog.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.web.client.RestClientException;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/discovery")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class DiscoveryController {
    private final DiscoveryService service;
    private final DiscoveryGameDetailsService gameDetailsService;

    public DiscoveryController(DiscoveryService service, DiscoveryGameDetailsService gameDetailsService) {
        this.service = service;
        this.gameDetailsService = gameDetailsService;
    }

    @GetMapping("/games/{igdbId}")
    public ResponseEntity<?> gameDetails(@PathVariable String igdbId) {
        Long parsedId;
        try {
            parsedId = Long.valueOf(igdbId);
        } catch (NumberFormatException invalid) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid IGDB ID", 400));
        }
        if (parsedId <= 0) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid IGDB ID", 400));
        }
        try {
            return ResponseEntity.ok(gameDetailsService.find(parsedId));
        } catch (ResourceNotFoundException notFound) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Game not found in IGDB", 404));
        } catch (RuntimeException unavailable) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("IGDB temporarily unavailable", 503));
        }
    }

    @GetMapping("/home")
    public HomeDiscoveryResponse home() {
        DiscoverySection popular = loadSection("popular", service::popular);
        DiscoverySection upcoming = loadSection("upcoming", service::upcoming);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        upcoming = new DiscoverySection(upcoming.games().stream()
                .filter(game -> game.releaseDate() != null && game.releaseDate().isAfter(today))
                .toList(), upcoming.available(), upcoming.updatedAt());
        DiscoverySection steam = loadSection("steam", service::steam);
        DiscoverySection fps = loadSection("fps", service::fps);
        DiscoverySection indie = loadSection("indie", service::indie);
        fps = preferDistinct(fps, steam);
        indie = preferDistinct(indie, steam, popular, fps);
        DiscoveryGame featured = service.featured(steam, popular, fps, indie);
        return new HomeDiscoveryResponse(popular, upcoming, steam, fps, indie, featured);
    }

    private DiscoverySection preferDistinct(DiscoverySection target, DiscoverySection... earlier) {
        if (!target.available() || target.games().isEmpty()) return target;
        Set<Long> seen = new HashSet<>();
        for (DiscoverySection section : earlier) {
            if (section.available()) {
                section.games().forEach(game -> seen.add(game.igdbId()));
            }
        }
        List<DiscoveryGame> ordered = new ArrayList<>();
        target.games().stream().filter(game -> !seen.contains(game.igdbId())).forEach(ordered::add);
        target.games().stream().filter(game -> seen.contains(game.igdbId())).forEach(ordered::add);
        return new DiscoverySection(ordered, true, target.updatedAt());
    }

    private DiscoverySection loadSection(String name, Supplier<DiscoverySection> loader) {
        try {
            return loader.get();
        } catch (RestClientException | DataAccessException | IllegalStateException unavailable) {
            log.warn("Discovery section {} unavailable: {}", name,
                    unavailable.getClass().getSimpleName());
            return DiscoverySection.unavailable();
        }
    }
}
