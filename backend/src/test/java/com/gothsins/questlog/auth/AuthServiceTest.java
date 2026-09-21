package com.gothsins.questlog.auth;

import com.gothsins.questlog.auth.dto.AuthResponse;
import com.gothsins.questlog.auth.dto.LoginRequest;
import com.gothsins.questlog.exception.UsernameAlreadyExistsException;
import com.gothsins.questlog.security.JwtService;
import com.gothsins.questlog.user.User;
import com.gothsins.questlog.user.UserRepository;
import com.gothsins.questlog.user.dto.RegisterRequest;
import com.gothsins.questlog.user.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Test
    void shouldRegisterUserWithEncodedPassword() {

        RegisterRequest request =
                new RegisterRequest("gui", "minhaSenha123");

        String encodedPassword = "$2a$10$fakeEncodedPassword";

        when(userRepository.existsByUsername(request.username()))
                .thenReturn(false);

        when(passwordEncoder.encode(request.password()))
                .thenReturn(encodedPassword);

        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> {
                    User user = invocation.getArgument(0);

                    user.setId(1L);
                    user.setCreatedAt(LocalDateTime.now());

                    return user;
                });

        UserResponse result = authService.register(request);

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("gui", result.username());
        assertNotNull(result.createdAt());

        ArgumentCaptor<User> captor =
                ArgumentCaptor.forClass(User.class);

        verify(userRepository).save(captor.capture());

        User savedUser = captor.getValue();

        assertEquals("gui", savedUser.getUsername());
        assertEquals(encodedPassword, savedUser.getPassword());
        assertNotEquals(
                request.password(),
                savedUser.getPassword()
        );

        verify(passwordEncoder)
                .encode(request.password());
    }

    @Test
    void shouldThrowExceptionWhenUsernameAlreadyExists() {

        RegisterRequest request =
                new RegisterRequest("gui", "minhaSenha123");

        when(userRepository.existsByUsername(request.username()))
                .thenReturn(true);

        UsernameAlreadyExistsException exception =
                assertThrows(
                        UsernameAlreadyExistsException.class,
                        () -> authService.register(request)
                );

        assertEquals(
                "Username already exists",
                exception.getMessage()
        );

        verify(userRepository)
                .existsByUsername(request.username());

        verifyNoInteractions(passwordEncoder);

        verify(userRepository, never())
                .save(any(User.class));
    }

    @Test
    void shouldLoginAndReturnToken() {

        LoginRequest request =
                new LoginRequest("gui", "minhaSenha123");

        String token = "fake.jwt.token";

        when(authenticationManager.authenticate(
                any(UsernamePasswordAuthenticationToken.class)
        )).thenReturn(
                new UsernamePasswordAuthenticationToken(
                        request.username(),
                        null
                )
        );

        when(jwtService.generateToken(request.username()))
                .thenReturn(token);

        AuthResponse response =
                authService.login(request);

        assertNotNull(response);
        assertEquals(token, response.token());

        verify(authenticationManager)
                .authenticate(
                        any(UsernamePasswordAuthenticationToken.class)
                );

        verify(jwtService)
                .generateToken(request.username());
    }

    @Test
    void shouldNotGenerateTokenWhenAuthenticationFails() {

        LoginRequest request =
                new LoginRequest("gui", "senhaErrada");

        when(authenticationManager.authenticate(
                any(UsernamePasswordAuthenticationToken.class)
        )).thenThrow(
                new BadCredentialsException(
                        "Bad credentials"
                )
        );

        assertThrows(
                BadCredentialsException.class,
                () -> authService.login(request)
        );

        verifyNoInteractions(jwtService);
    }
}