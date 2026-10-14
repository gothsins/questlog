
package com.gothsins.questlog.user;

import com.gothsins.questlog.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserAvatarService {

    private final UserRepository userRepository;
    private final UserAvatarRepository avatarRepository;
    private final AvatarImageProcessor imageProcessor;

    @Transactional
    public void upload(String username, MultipartFile file) {

        User user = findUser(username);

        byte[] image = imageProcessor.process(file);

        UserAvatar avatar = avatarRepository
                .findById(user.getId())
                .orElseGet(UserAvatar::new);

        avatar.setUserId(user.getId());
        avatar.setImageData(image);

        avatarRepository.save(avatar);

        user.setAvatarVersion(UUID.randomUUID());
    }

    @Transactional
    public void delete(String username) {

        User user = findUser(username);

        avatarRepository.deleteById(user.getId());

        user.setAvatarVersion(null);
    }

    @Transactional(readOnly = true)
    public byte[] findAvatar(Long userId) {

        return avatarRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Avatar not found"
                        )
                )
                .getImageData();
    }

    private User findUser(String username) {

        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );
    }
}
