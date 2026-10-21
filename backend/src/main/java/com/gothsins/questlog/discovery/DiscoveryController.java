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
import java.time.LocalDate;
import java.time.ZoneOffset;

@RestController
@RequestMapping("/api/discovery")
@SecurityRequirement(name = "bearerAuth")
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
        DiscoverySection popular;
        DiscoverySection upcoming;
        try {
            popular = service.popular();
        } catch (RuntimeException unavailable) {
            popular = DiscoverySection.unavailable();
        }
        try {
            upcoming = service.upcoming();
            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            upcoming = new DiscoverySection(upcoming.games().stream()
                    .filter(game -> game.releaseDate() != null && game.releaseDate().isAfter(today))
                    .toList(), upcoming.available(), upcoming.updatedAt());
        } catch (RuntimeException unavailable) {
            upcoming = DiscoverySection.unavailable();
        }
        return new HomeDiscoveryResponse(popular, upcoming);
    }
}
