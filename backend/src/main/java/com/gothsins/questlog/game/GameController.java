package com.gothsins.questlog.game;

import com.gothsins.questlog.game.dto.CreateGameRequest;
import com.gothsins.questlog.game.dto.GameResponse;
import com.gothsins.questlog.igdb.IgdbService;
import com.gothsins.questlog.igdb.dto.IgdbSearchResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(
        name = "Games",
        description = "Game catalog operations"
)
@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class GameController {

    private final GameService gameService;
    private final IgdbService igdbService;

    @Operation(
            summary = "List games",
            description = "Returns all games available in the Questlog catalog."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Games successfully returned"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication required"
            )
    })
    @GetMapping
    public ResponseEntity<List<GameResponse>> findAll() {
        return ResponseEntity.ok(gameService.findAll());
    }

    @Operation(
            summary = "Find game by ID",
            description = "Returns a game from the catalog by its identifier."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Game found"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication required"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Game not found"
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<GameResponse> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(gameService.findById(id));
    }

    @Operation(
            summary = "Search games",
            description = "Searches the IGDB catalog for games."
    )
    @GetMapping("/search")
    public ResponseEntity<List<IgdbSearchResult>> searchGames(
            @RequestParam String query
    ) {

        return ResponseEntity.ok(
                igdbService.searchGames(query)
        );
    }
}