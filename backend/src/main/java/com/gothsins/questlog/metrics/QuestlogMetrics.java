package com.gothsins.questlog.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class QuestlogMetrics {

    private final Counter gamesCreatedCounter;

    public QuestlogMetrics(MeterRegistry meterRegistry) {

        this.gamesCreatedCounter = Counter.builder(
                        "questlog.games.created"
                )
                .description(
                        "Total number of games created in the catalog"
                )
                .register(meterRegistry);
    }

    public void incrementGamesCreated() {
        gamesCreatedCounter.increment();
    }
}