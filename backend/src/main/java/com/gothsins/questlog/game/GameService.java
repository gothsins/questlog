package com.gothsins.questlog.game;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.game.dto.GameResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;

    private GameResponse toResponse(Game game) {

        return new GameResponse(
                game.getId(),
                game.getTitle(),
                game.getReleaseDate(),
                game.getCoverUrl()
        );
    }

    @Cacheable(
            value = "gamesList",
            key = "'all'"
    )
    @Transactional(readOnly = true)
    public List<GameResponse> findAll() {

        return gameRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Cacheable(value = "games", key = "#id")
    @Transactional(readOnly = true)
    public GameResponse findById(Long id) {

        Game game = gameRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Game not found")
                );

        return toResponse(game);
    }
}