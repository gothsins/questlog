
package com.gothsins.questlog.game;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.game.dto.GameMediaResponse;
import com.gothsins.questlog.igdb.IgdbClient;
import com.gothsins.questlog.igdb.IgdbGameDetailsResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class GameMediaService {

    private static final String SCREENSHOT_BASE_URL =
            "https://images.igdb.com/igdb/image/upload/t_1080p/";

    private final GameRepository gameRepository;
    private final IgdbClient igdbClient;

    @Cacheable(value = "gameMedia", key = "#p0")
    @Transactional(readOnly = true)
    public GameMediaResponse findByGameId(Long gameId) {

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Game not found"
                        )
                );

        if (game.getIgdbId() == null) {
            return GameMediaResponse.empty();
        }

        return igdbClient
                .findGameDetailsById(game.getIgdbId())
                .map(this::toResponse)
                .orElseGet(GameMediaResponse::empty);
    }

    private GameMediaResponse toResponse(
            IgdbGameDetailsResponse details
    ) {

        String summary = details.summary();

        if (summary != null) {
            summary = summary.strip();

            if (summary.isEmpty()) {
                summary = null;
            }
        }

        List<String> genres = details.genres() == null
                ? List.of()
                : details.genres()
                .stream()
                .filter(Objects::nonNull)
                .map(IgdbGameDetailsResponse.Genre::name)
                .filter(Objects::nonNull)
                .map(String::strip)
                .filter(name -> !name.isBlank())
                .distinct()
                .toList();

        List<String> screenshots = details.screenshots() == null
                ? List.of()
                : details.screenshots()
                .stream()
                .filter(Objects::nonNull)
                .map(
                        IgdbGameDetailsResponse.Screenshot::imageId
                )
                .filter(Objects::nonNull)
                .filter(id ->
                        id.matches("[A-Za-z0-9_-]+")
                )
                .distinct()
                .limit(8)
                .map(id ->
                        SCREENSHOT_BASE_URL + id + ".jpg"
                )
                .toList();

        String trailerVideoId = findTrailerVideoId(
                details.videos()
        );

        return new GameMediaResponse(
                summary,
                genres,
                screenshots,
                trailerVideoId
        );
    }

    private String findTrailerVideoId(
            List<IgdbGameDetailsResponse.Video> videos
    ) {

        if (videos == null || videos.isEmpty()) {
            return null;
        }

        List<IgdbGameDetailsResponse.Video> validVideos =
                videos.stream()
                        .filter(Objects::nonNull)
                        .filter(video ->
                                video.videoId() != null
                                        && video.videoId()
                                        .matches("[A-Za-z0-9_-]{11}")
                        )
                        .toList();

        return validVideos.stream()
                .filter(video ->
                        video.name() != null
                                && video.name()
                                .toLowerCase(Locale.ROOT)
                                .contains("trailer")
                )
                .map(IgdbGameDetailsResponse.Video::videoId)
                .findFirst()
                .or(() ->
                        validVideos.stream()
                                .map(
                                        IgdbGameDetailsResponse.Video::videoId
                                )
                                .findFirst()
                )
                .orElse(null);
    }
}
