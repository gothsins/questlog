package com.gothsins.questlog.library;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.igdb.IgdbImportService;
import com.gothsins.questlog.library.dto.ImportIgdbGameRequest;
import com.gothsins.questlog.library.dto.AddGameToLibraryRequest;
import com.gothsins.questlog.library.dto.LibraryEntryResponse;
import com.gothsins.questlog.library.dto.UpdateLibraryEntryRequest;
import com.gothsins.questlog.user.User;
import com.gothsins.questlog.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(
        name = "Library",
        description = "Operations for the authenticated user's game library"
)
@RestController
@RequestMapping("/api/library")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class LibraryEntryController {

    private final LibraryEntryService libraryEntryService;
    private final UserRepository userRepository;
    private final IgdbImportService igdbImportService;

    private User getAuthenticatedUser(
            Authentication authentication
    ) {

        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Authenticated user not found"
                        )
                );
    }

    @Operation(
            summary = "Add game to library",
            description = "Adds a game from the catalog to the authenticated user's personal library."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Game successfully added to library"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication required"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Game not found"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Game already exists in user's library"
            )
    })
    @PostMapping
    public ResponseEntity<LibraryEntryResponse> addGame(
            @Valid @RequestBody AddGameToLibraryRequest request,
            Authentication authentication
    ) {

        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Authenticated user not found")
                );

        LibraryEntryResponse response =
                libraryEntryService.addGameToLibrary(
                        user.getId(),
                        request.gameId()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @Operation(
            summary = "Import IGDB game into library",
            description = "Imports or reuses an IGDB game and adds it to the authenticated user's library."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Game added to library"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid IGDB identifier"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Game not found in IGDB"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Game already exists in user's library"
            )
    })
    @PostMapping("/import")
    public ResponseEntity<LibraryEntryResponse> importGame(
            @Valid @RequestBody ImportIgdbGameRequest request,
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        LibraryEntryResponse response =
                igdbImportService.importToLibrary(
                        user.getId(),
                        request.igdbId()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @Operation(
            summary = "List personal library",
            description = "Returns all games belonging to the authenticated user's library."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Library successfully returned"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication required"
            )
    })
    @GetMapping
    public ResponseEntity<List<LibraryEntryResponse>> findAll(
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                libraryEntryService.findAllByUser(user.getId())
        );
    }

    @Operation(
            summary = "Update library entry",
            description = "Updates status, rating or played hours of a game in the authenticated user's library."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Library entry successfully updated"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid update data"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication required"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Library entry not found"
            )
    })
    @PatchMapping("/{id}")
    public ResponseEntity<LibraryEntryResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLibraryEntryRequest request,
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        LibraryEntryResponse response =
                libraryEntryService.update(
                        id,
                        user.getId(),
                        request
                );

        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Remove game from library",
            description = "Removes a game from the authenticated user's personal library."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Library entry successfully removed"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication required"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Library entry not found"
            )
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        libraryEntryService.delete(
                id,
                user.getId()
        );

        return ResponseEntity.noContent().build();
    }
}