package com.gothsins.questlog.game;

import com.gothsins.questlog.game.dto.GameResponse;
import com.gothsins.questlog.igdb.IgdbService;
import com.gothsins.questlog.igdb.dto.IgdbSearchResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.gothsins.questlog.game.dto.GameMediaResponse;
import com.gothsins.questlog.game.dto.SteamLinkResponse;
import com.gothsins.questlog.steam.SteamReviewService;
import com.gothsins.questlog.steam.dto.SteamReviewsResponse;
import com.gothsins.questlog.steam.dto.SteamWrittenReviewsResponse;

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
    private final GameMediaService gameMediaService;
    private final SteamLinkService steamLinkService;
    private final SteamReviewService steamReviewService;

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
            @RequestParam @Size(max = 80) String query
    ) {

        return ResponseEntity.ok(
                igdbService.searchGames(query)
        );
    }

    @Operation(
            summary = "Get game media",
            description = "Returns game description, genres, screenshots and trailer information."
    )
    @GetMapping("/{id}/media")
    public ResponseEntity<GameMediaResponse> findGameMedia(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                gameMediaService.findByGameId(id)
        );
    }

    @Operation(
            summary = "Find Steam app ID for a Questlog game"
    )
    @GetMapping("/{id}/steam-link")
    public ResponseEntity<SteamLinkResponse> findSteamLink(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                steamLinkService.findSteamLink(id)
        );
    }

    @Operation(
            summary = "Get Steam review statistics",
            description = "Returns Steam review statistics for a Questlog game."
    )
    @GetMapping("/{id}/steam-reviews")
    public ResponseEntity<SteamReviewsResponse> findSteamReviews(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                steamReviewService.findByGameId(id)
        );
    }

    @Operation(
            summary = "Get written Steam reviews"
    )
    @GetMapping("/{id}/steam-review-texts")
    public ResponseEntity<SteamWrittenReviewsResponse> findSteamReviewTexts(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                steamReviewService.findWrittenReviewsByGameId(id)
        );
    }
}