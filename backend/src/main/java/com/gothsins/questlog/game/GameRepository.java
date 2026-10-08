package com.gothsins.questlog.game;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;

import java.util.List;
import java.util.Optional;

public interface GameRepository extends JpaRepository<Game, Long> {

    List<Game> findByTitleIgnoreCase(String title);
    Optional<Game> findByIgdbId(Long igdbId);

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO games (
            igdb_id,
            title,
            release_date,
            cover_url
        )
        VALUES (
            :igdbId,
            :title,
            :releaseDate,
            :coverUrl
        )
        ON CONFLICT (igdb_id) DO NOTHING
        """, nativeQuery = true)
    int insertIgdbGameIfAbsent(
            @Param("igdbId") Long igdbId,
            @Param("title") String title,
            @Param("releaseDate") LocalDate releaseDate,
            @Param("coverUrl") String coverUrl
    );

}