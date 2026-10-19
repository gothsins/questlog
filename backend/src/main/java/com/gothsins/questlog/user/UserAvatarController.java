
package com.gothsins.questlog.user;

import com.gothsins.questlog.user.dto.UserProfileResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserAvatarController {

    private final UserAvatarService avatarService;
    private final UserProfileService profileService;

    @PostMapping(
            value = "/me/avatar",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<UserProfileResponse> uploadAvatar(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {

        String username = authentication.getName();

        avatarService.upload(username, file);

        return ResponseEntity.ok(
                profileService.findMyProfile(username)
        );
    }

    @DeleteMapping("/me/avatar")
    public ResponseEntity<Void> deleteAvatar(
            Authentication authentication
    ) {

        avatarService.delete(authentication.getName());

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/avatar")
    public ResponseEntity<byte[]> findAvatar(
            @PathVariable Long userId
    ) {

        byte[] image = avatarService.findAvatar(userId);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .cacheControl(
                        CacheControl
                                .maxAge(Duration.ofDays(1))
                                .cachePublic()
                )
                .header("X-Content-Type-Options", "nosniff")
                .body(image);
    }
}
