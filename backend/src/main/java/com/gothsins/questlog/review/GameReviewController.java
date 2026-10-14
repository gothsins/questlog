package com.gothsins.questlog.review;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.review.dto.CreateGameReviewRequest;
import com.gothsins.questlog.review.dto.GameReviewResponse;
import com.gothsins.questlog.user.User;
import com.gothsins.questlog.user.UserRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(
        name = "Reviews",
        description = "Game reviews created by Questlog users"
)
@SecurityRequirement(name = "bearerAuth")
public class GameReviewController {

    private final GameReviewService gameReviewService;
    private final UserRepository userRepository;

    private Long getAuthenticatedUserId(Authentication authentication) {
        User user = userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Authenticated user not found"
                        )
                );

        return user.getId();
    }

    @GetMapping("/api/games/{gameId}/reviews")
    public ResponseEntity<List<GameReviewResponse>> findByGame(
            @PathVariable Long gameId
    ) {
        return ResponseEntity.ok(
                gameReviewService.findByGame(gameId)
        );
    }

    @GetMapping("/api/library/{entryId}/review")
    public ResponseEntity<GameReviewResponse> findMyReview(
            @PathVariable Long entryId,
            Authentication authentication
    ) {
        Long userId = getAuthenticatedUserId(authentication);

        return ResponseEntity.ok(
                gameReviewService.findMyReview(entryId, userId)
        );
    }

    @PutMapping("/api/library/{entryId}/review")
    public ResponseEntity<GameReviewResponse> createOrUpdate(
            @PathVariable Long entryId,
            @Valid @RequestBody CreateGameReviewRequest request,
            Authentication authentication
    ) {
        Long userId = getAuthenticatedUserId(authentication);

        return ResponseEntity.ok(
                gameReviewService.createOrUpdate(
                        entryId,
                        userId,
                        request
                )
        );
    }

    @DeleteMapping("/api/library/{entryId}/review")
    public ResponseEntity<Void> deleteMyReview(
            @PathVariable Long entryId,
            Authentication authentication
    ) {
        Long userId = getAuthenticatedUserId(authentication);

        gameReviewService.deleteMyReview(entryId, userId);

        return ResponseEntity.noContent().build();
    }
}