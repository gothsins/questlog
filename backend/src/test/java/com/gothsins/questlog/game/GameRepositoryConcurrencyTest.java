
package com.gothsins.questlog.game;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(properties = {
        "security.jwt.secret=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
        "igdb.client-id=test-client",
        "igdb.client-secret=test-secret"
})
class GameRepositoryConcurrencyTest {

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void shouldInsertOnlyOneGameWhenRequestsAreConcurrent()
            throws Exception {

        Long igdbId = ThreadLocalRandom.current()
                .nextLong(1_000_000_000L, 2_000_000_000L);

        ExecutorService executor =
                Executors.newFixedThreadPool(2);

        CountDownLatch start = new CountDownLatch(1);

        Callable<Integer> insert = () -> {
            start.await();

            return gameRepository.insertIgdbGameIfAbsent(
                    igdbId,
                    "Concurrent Import Test",
                    null,
                    null
            );
        };

        try {
            Future<Integer> first = executor.submit(insert);
            Future<Integer> second = executor.submit(insert);

            start.countDown();

            int insertedRows =
                    first.get(15, TimeUnit.SECONDS)
                            + second.get(15, TimeUnit.SECONDS);

            Integer totalGames = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM games WHERE igdb_id = ?",
                    Integer.class,
                    igdbId
            );

            assertEquals(1, insertedRows);
            assertEquals(1, totalGames);

        } finally {
            executor.shutdownNow();

            gameRepository.findByIgdbId(igdbId)
                    .ifPresent(gameRepository::delete);
        }
    }
}
