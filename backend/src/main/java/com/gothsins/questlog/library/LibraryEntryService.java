package com.gothsins.questlog.library;

import com.gothsins.questlog.game.Game;
import com.gothsins.questlog.game.GameRepository;
import com.gothsins.questlog.user.User;
import com.gothsins.questlog.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class LibraryEntryService {

    private final LibraryEntryRepository libraryEntryRepository;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;

    public LibraryEntryService(
            LibraryEntryRepository libraryEntryRepository,
            UserRepository userRepository,
            GameRepository gameRepository
    ) {
        this.libraryEntryRepository = libraryEntryRepository;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
    }

    @Transactional
    public LibraryEntry addGameToLibrary(Long userId, Long gameId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Game not found")
                );

        if (libraryEntryRepository.existsByUser_IdAndGame_Id(userId, gameId)) {
            throw new IllegalStateException("Game already exists in user's library");
        }

        LibraryEntry entry = new LibraryEntry();

        entry.setUser(user);
        entry.setGame(game);
        entry.setStatus(GameStatus.BACKLOG);

        return libraryEntryRepository.save(entry);
    }
}