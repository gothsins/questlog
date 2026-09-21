package com.gothsins.questlog.auth;

import com.gothsins.questlog.auth.dto.AuthResponse;
import com.gothsins.questlog.auth.dto.LoginRequest;
import com.gothsins.questlog.exception.UsernameAlreadyExistsException;
import com.gothsins.questlog.security.JwtService;
import com.gothsins.questlog.user.User;
import com.gothsins.questlog.user.UserRepository;
import com.gothsins.questlog.user.dto.RegisterRequest;
import com.gothsins.questlog.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public UserResponse register(RegisterRequest request) {

        if (userRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException(
                    "Username already exists"
            );
        }

        User user = new User();
        user.setUsername(request.username());
        user.setPassword(
                passwordEncoder.encode(request.password())
        );

        User savedUser = userRepository.save(user);

        return new UserResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getCreatedAt()
        );
    }

    public AuthResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.username(),
                        request.password()
                )
        );

        String token =
                jwtService.generateToken(request.username());

        return new AuthResponse(token);
    }
}