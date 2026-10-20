package com.gothsins.questlog.discovery;

import java.time.LocalDate;

public record DiscoveryGame(long igdbId, String title, String coverUrl,
                            LocalDate releaseDate, String popularitySource) {}
