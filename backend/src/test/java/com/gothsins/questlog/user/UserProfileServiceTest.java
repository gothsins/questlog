
package com.gothsins.questlog.user;

import com.gothsins.questlog.exception.NicknameAlreadyExistsException;
import com.gothsins.questlog.exception.ResourceNotFoundException;
import com.gothsins.questlog.user.dto.UpdateUserProfileRequest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserProfileService service;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("gui");
        user.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void shouldFindOwnProfile() {
        when(userRepository.findByUsername("gui"))
                .thenReturn(Optional.of(user));

        var response = service.findMyProfile("gui");

        assertEquals(1L, response.id());
        assertEquals("gui", response.username());
        assertNull(response.nickname());
        assertNull(response.avatarUrl());
    }

    @Test
    void shouldUpdateNickname() {
        when(userRepository.findByUsername("gui"))
                .thenReturn(Optional.of(user));

        var response = service.updateMyProfile(
                "gui",
                new UpdateUserProfileRequest("GuiDev")
        );

        assertEquals("GuiDev", response.nickname());
        assertEquals("GuiDev", user.getNickname());

        verify(userRepository)
                .existsByNicknameIgnoreCaseAndIdNot(
                        "GuiDev",
                        1L
                );
    }

    @Test
    void shouldRejectNicknameUsedByAnotherUser() {
        when(userRepository.findByUsername("gui"))
                .thenReturn(Optional.of(user));

        when(userRepository
                .existsByNicknameIgnoreCaseAndIdNot(
                        "OutroDev",
                        1L
                ))
                .thenReturn(true);

        assertThrows(
                NicknameAlreadyExistsException.class,
                () -> service.updateMyProfile(
                        "gui",
                        new UpdateUserProfileRequest("OutroDev")
                )
        );

        assertNull(user.getNickname());
    }

    @Test
    void shouldFailWhenAuthenticatedUserDoesNotExist() {
        when(userRepository.findByUsername("gui"))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> service.findMyProfile("gui")
        );
    }
}
