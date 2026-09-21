package com.gothsins.questlog.library;

import com.gothsins.questlog.library.dto.AddGameToLibraryRequest;
import com.gothsins.questlog.library.dto.LibraryEntryResponse;
import com.gothsins.questlog.user.User;
import com.gothsins.questlog.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/library")
@RequiredArgsConstructor
public class LibraryEntryController {

    private final LibraryEntryService libraryEntryService;
    private final UserRepository userRepository;

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
}