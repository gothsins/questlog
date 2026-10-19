
package com.gothsins.questlog.user;

import com.gothsins.questlog.exception.NicknameAlreadyExistsException;
import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.user.dto.UpdateUserProfileRequest;
import com.gothsins.questlog.user.dto.UserProfileResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserProfileResponse findMyProfile(
            String username
    ) {
        User user = findUser(username);

        return toResponse(user);
    }

    @Transactional
    public UserProfileResponse updateMyProfile(
            String username,
            UpdateUserProfileRequest request
    ) {
        User user = findUser(username);

        String nickname = request.nickname();

        boolean alreadyExists = userRepository
                .existsByNicknameIgnoreCaseAndIdNot(
                        nickname,
                        user.getId()
                );

        if (alreadyExists) {
            throw new NicknameAlreadyExistsException(
                    "Nickname already exists"
            );
        }

        user.setNickname(nickname);

        return toResponse(user);
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );
    }

    private UserProfileResponse toResponse(User user) {

        String avatarUrl = user.getAvatarVersion() == null
                ? null
                : "/api/users/"
                + user.getId()
                + "/avatar?v="
                + user.getAvatarVersion();

        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getNickname(),
                avatarUrl,
                user.getCreatedAt()
        );
    }
}
