package com.gothsins.questlog.library;

import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.game.dto.GameResponse;
import com.gothsins.questlog.library.dto.AddGameToLibraryRequest;
import com.gothsins.questlog.library.dto.LibraryEntryResponse;
import com.gothsins.questlog.library.dto.UpdateLibraryEntryRequest;
import com.gothsins.questlog.user.User;
import com.gothsins.questlog.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/library")
@RequiredArgsConstructor
public class LibraryEntryController {

    private final LibraryEntryService libraryEntryService;
    private final UserRepository userRepository;
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

    @PostMapping
    public ResponseEntity<LibraryEntryResponse> addGame(
            @Valid @RequestBody AddGameToLibraryRequest request,
            Authentication authentication
    ) {

        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new IllegalStateException("Authenticated user not found")
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

    @GetMapping
    public ResponseEntity<List<LibraryEntryResponse>> findAll(
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                libraryEntryService.findAllByUser(user.getId())
        );
    }

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