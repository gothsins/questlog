package com.gothsins.questlog.discovery;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDate;
import java.time.ZoneOffset;

@RestController
@RequestMapping("/api/discovery")
@SecurityRequirement(name = "bearerAuth")
public class DiscoveryController {
    private final DiscoveryService service;

    public DiscoveryController(DiscoveryService service) {
        this.service = service;
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
