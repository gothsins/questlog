
package com.gothsins.questlog.game;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.game.dto.SteamLinkResponse;
import com.gothsins.questlog.igdb.IgdbClient;
import com.gothsins.questlog.igdb.IgdbExternalGameResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SteamLinkService {

    private static final long MAX_STEAM_APP_ID =
            4_294_967_295L;

    private final GameRepository gameRepository;
    private final IgdbClient igdbClient;

    @Cacheable(value = "steamLinks", key = "#p0")
    @Transactional(readOnly = true)
    public SteamLinkResponse findSteamLink(Long gameId) {

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Game not found"
                        )
                );

        if (game.getIgdbId() == null) {
            return new SteamLinkResponse(null);
        }

        Long steamAppId = igdbClient
                .findExternalGames(game.getIgdbId())
                .stream()
                .filter(source ->
                        source != null
                                && source.externalGameSource() != null
                                && source.externalGameSource().name() != null
                )
                .filter(source -> {
                    String name = source
                            .externalGameSource()
                            .name()
                            .strip()
                            .toLowerCase(Locale.ROOT);

                    return name.equals("steam")
                            || name.equals("steam store");
                })
                .map(IgdbExternalGameResponse::uid)
                .filter(uid ->
                        uid != null
                                && uid.matches("[1-9][0-9]{0,9}")
                )
                .map(Long::parseLong)
                .filter(id -> id <= MAX_STEAM_APP_ID)
                .findFirst()
                .orElse(null);

        return new SteamLinkResponse(steamAppId);
    }
}
