package com.gothsins.questlog.discovery;

import com.gothsins.questlog.game.Game;
import com.gothsins.questlog.game.GameMediaService;
import com.gothsins.questlog.game.GameRepository;
import com.gothsins.questlog.game.dto.GameMediaResponse;
import com.gothsins.questlog.igdb.IgdbGameDetailsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class DiscoveryGameDetailsService {
    private static final String COVER_BASE_URL =
            "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/";

    private final DiscoveryGameSource source;
    private final GameRepository gameRepository;
    private final GameMediaService gameMediaService;

    @Transactional(readOnly = true)
    public DiscoveryGameDetailsResponse find(Long igdbId) {
        IgdbGameDetailsResponse details = source.find(igdbId);
        GameMediaResponse media = gameMediaService.toResponse(details);
        Long gameId = gameRepository.findByIgdbId(igdbId)
                .map(Game::getId)
                .orElse(null);
        LocalDate releaseDate = details.firstReleaseDate() == null
                ? null
                : Instant.ofEpochSecond(details.firstReleaseDate())
                .atZone(ZoneOffset.UTC).toLocalDate();
        String imageId = details.cover() == null ? null : details.cover().imageId();
        String coverUrl = imageId != null && imageId.matches("[A-Za-z0-9_-]+")
                ? COVER_BASE_URL + imageId + ".jpg"
                : null;

        return new DiscoveryGameDetailsResponse(
                igdbId,
                gameId,
                details.name(),
                releaseDate,
                coverUrl,
                media.summary(),
                media.genres(),
                media.screenshots(),
                media.trailerVideoId()
        );
    }
}
