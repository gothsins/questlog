
package com.gothsins.questlog.user;

import com.gothsins.questlog.user.dto.UpdateUserProfileRequest;
import com.gothsins.questlog.user.dto.UserProfileResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping
    public ResponseEntity<UserProfileResponse> findMyProfile(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                userProfileService.findMyProfile(
                        authentication.getName()
                )
        );
    }

    @PatchMapping
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateUserProfileRequest request
    ) {
        return ResponseEntity.ok(
                userProfileService.updateMyProfile(
                        authentication.getName(),
                        request
                )
        );
    }
}
