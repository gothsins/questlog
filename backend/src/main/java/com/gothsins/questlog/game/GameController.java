package com.gothsins.questlog.game;

import com.gothsins.questlog.game.dto.CreateGameRequest;
import com.gothsins.questlog.game.dto.GameResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    @PostMapping
    public ResponseEntity<GameResponse> create(
            @Valid @RequestBody CreateGameRequest request
    ) {

        GameResponse response = gameService.create(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<GameResponse>> findAll() {
        return ResponseEntity.ok(gameService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(gameService.findById(id));
    }
}