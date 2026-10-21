package com.gothsins.questlog.discovery;

import com.gothsins.questlog.game.Game;
import com.gothsins.questlog.game.GameMediaService;
import com.gothsins.questlog.game.GameRepository;
import com.gothsins.questlog.game.dto.GameMediaResponse;
import com.gothsins.questlog.igdb.IgdbGameDetailsResponse;
import com.gothsins.questlog.igdb.IgdbGameResponse;
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
class DiscoveryGameDetailsServiceTest {
    @Mock DiscoveryGameSource source;
    @Mock GameRepository gameRepository;
    @Mock GameMediaService gameMediaService;
    @InjectMocks DiscoveryGameDetailsService service;

    @Test
    void normalizesDetailsAndResolvesInternalIdWithoutWriting() {
        IgdbGameDetailsResponse details = new IgdbGameDetailsResponse(
                99L, "Elden Ring", "Journey", 1645747200L,
                new IgdbGameResponse.Cover("co123"), List.of(), List.of(), List.of());
        when(source.find(99L)).thenReturn(details);
        when(gameMediaService.toResponse(details)).thenReturn(
                new GameMediaResponse("Journey", List.of("RPG"), List.of("image"), "M7lc1UVf-VE"));
        Game game = new Game();
        game.setId(42L);
        when(gameRepository.findByIgdbId(99L)).thenReturn(Optional.of(game));

        DiscoveryGameDetailsResponse result = service.find(99L);

        assertEquals(42L, result.gameId());
        assertEquals(99L, result.igdbId());
        assertEquals("2022-02-25", result.releaseDate().toString());
        assertEquals("https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co123.jpg", result.coverUrl());
        assertEquals("M7lc1UVf-VE", result.trailerVideoId());
        verify(gameRepository).findByIgdbId(99L);
        verifyNoMoreInteractions(gameRepository);
    }

    @Test
    void missingOptionalFieldsRemainAbsent() {
        IgdbGameDetailsResponse details = new IgdbGameDetailsResponse(
                199L, "Future Game", null, null,
                new IgdbGameResponse.Cover("invalid!"), null, null, null);
        when(source.find(199L)).thenReturn(details);
        when(gameMediaService.toResponse(details)).thenReturn(GameMediaResponse.empty());
        when(gameRepository.findByIgdbId(199L)).thenReturn(Optional.empty());

        DiscoveryGameDetailsResponse result = service.find(199L);

        assertNull(result.gameId());
        assertNull(result.releaseDate());
        assertNull(result.coverUrl());
        assertTrue(result.screenshots().isEmpty());
    }
}
