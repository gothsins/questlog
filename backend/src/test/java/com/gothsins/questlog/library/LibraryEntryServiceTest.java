package com.gothsins.questlog.library;

import com.gothsins.questlog.game.Game;
import com.gothsins.questlog.game.GameRepository;
import com.gothsins.questlog.user.User;
import com.gothsins.questlog.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LibraryEntryServiceTest {

    @Mock
    private LibraryEntryRepository libraryEntryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GameRepository gameRepository;

    @InjectMocks
    private LibraryEntryService libraryEntryService;

    @Test
    void shouldAddGameToLibrary() {

        Long userId = 1L;
        Long gameId = 10L;

        User user = new User();
        user.setId(userId);

        Game game = new Game();
        game.setId(gameId);

        when(userRepository.findById(userId))
                .thenReturn(Optional.of(user));

        when(gameRepository.findById(gameId))
                .thenReturn(Optional.of(game));

        when(libraryEntryRepository.existsByUser_IdAndGame_Id(userId, gameId))
                .thenReturn(false);

        when(libraryEntryRepository.save(any(LibraryEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LibraryEntry result =
                libraryEntryService.addGameToLibrary(userId, gameId);

        assertNotNull(result);

        ArgumentCaptor<LibraryEntry> captor =
                ArgumentCaptor.forClass(LibraryEntry.class);

        verify(libraryEntryRepository).save(captor.capture());

        LibraryEntry savedEntry = captor.getValue();

        assertEquals(user, savedEntry.getUser());
        assertEquals(game, savedEntry.getGame());
        assertEquals(GameStatus.BACKLOG, savedEntry.getStatus());
    }

    @Test
    void shouldThrowExceptionWhenUserDoesNotExist() {

        Long userId = 1L;
        Long gameId = 10L;

        when(userRepository.findById(userId))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> libraryEntryService.addGameToLibrary(userId, gameId)
                );

        assertEquals("User not found", exception.getMessage());

        verify(userRepository).findById(userId);

        verifyNoInteractions(gameRepository);
        verifyNoInteractions(libraryEntryRepository);
    }

    @Test
    void shouldThrowExceptionWhenGameDoesNotExist() {

        Long userId = 1L;
        Long gameId = 10L;

        User user = new User();
        user.setId(userId);

        when(userRepository.findById(userId))
                .thenReturn(Optional.of(user));

        when(gameRepository.findById(gameId))
                .thenReturn(Optional.empty());

        IllegalArgumentException exception =
                assertThrows(
                        IllegalArgumentException.class,
                        () -> libraryEntryService.addGameToLibrary(userId, gameId)
                );

        assertEquals("Game not found", exception.getMessage());

        verify(userRepository).findById(userId);
        verify(gameRepository).findById(gameId);

        verifyNoInteractions(libraryEntryRepository);
    }

    @Test
    void shouldThrowExceptionWhenGameAlreadyExistsInLibrary() {

        Long userId = 1L;
        Long gameId = 10L;

        User user = new User();
        user.setId(userId);

        Game game = new Game();
        game.setId(gameId);

        when(userRepository.findById(userId))
                .thenReturn(Optional.of(user));

        when(gameRepository.findById(gameId))
                .thenReturn(Optional.of(game));

        when(libraryEntryRepository.existsByUser_IdAndGame_Id(userId, gameId))
                .thenReturn(true);

        IllegalStateException exception =
                assertThrows(
                        IllegalStateException.class,
                        () -> libraryEntryService.addGameToLibrary(userId, gameId)
                );

        assertEquals(
                "Game already exists in user's library",
                exception.getMessage()
        );

        verify(libraryEntryRepository, never())
                .save(any(LibraryEntry.class));
    }

}