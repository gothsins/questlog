
package com.gothsins.questlog.game;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.game.dto.SteamLinkResponse;
import com.gothsins.questlog.igdb.IgdbClient;
import com.gothsins.questlog.igdb.IgdbExternalGameResponse;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SteamLinkServiceTest {

    private static final Long GAME_ID = 13L;
    private static final Long IGDB_ID = 119133L;

    @Mock
    private GameRepository gameRepository;

    @Mock
    private IgdbClient igdbClient;

    @InjectMocks
    private SteamLinkService steamLinkService;

    private Game game(Long igdbId) {
        Game game = new Game();
        game.setId(GAME_ID);
        game.setTitle("Elden Ring");
        game.setIgdbId(igdbId);
        return game;
    }

    private IgdbExternalGameResponse externalGame(
            String source,
            String uid
    ) {
        return new IgdbExternalGameResponse(
                uid,
                new IgdbExternalGameResponse.ExternalGameSource(
                        source
                )
        );
    }

    @Test
    void shouldFindSteamAppId() {

        when(gameRepository.findById(GAME_ID))
                .thenReturn(Optional.of(game(IGDB_ID)));

        when(igdbClient.findExternalGames(IGDB_ID))
                .thenReturn(List.of(
                        externalGame("GOG", "999"),
                        externalGame("Steam", "1245620")
                ));

        SteamLinkResponse response =
                steamLinkService.findSteamLink(GAME_ID);

        assertEquals(1245620L, response.steamAppId());
    }

    @Test
    void shouldReturnNullForGameWithoutIgdb() {

        when(gameRepository.findById(GAME_ID))
                .thenReturn(Optional.of(game(null)));

        SteamLinkResponse response =
                steamLinkService.findSteamLink(GAME_ID);

        assertNull(response.steamAppId());

        verifyNoInteractions(igdbClient);
    }

    @Test
    void shouldIgnoreInvalidSteamIds() {

        when(gameRepository.findById(GAME_ID))
                .thenReturn(Optional.of(game(IGDB_ID)));

        when(igdbClient.findExternalGames(IGDB_ID))
                .thenReturn(List.of(
                        externalGame("Steam", "invalid-app"),
                        externalGame("Steam", "9999999999")
                ));

        SteamLinkResponse response =
                steamLinkService.findSteamLink(GAME_ID);

        assertNull(response.steamAppId());
    }

    @Test
    void shouldThrowWhenGameDoesNotExist() {

        when(gameRepository.findById(GAME_ID))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> steamLinkService.findSteamLink(GAME_ID)
        );

        verifyNoInteractions(igdbClient);
    }
}
