package com.gothsins.questlog.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

class PasswordSecurityTest {

    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    @Test
    void passwordHashMustNotBePlaintext() {
        String rawPassword = "SenhaDeTeste123456!";
        String hash = encoder.encode(rawPassword);

        assertNotEquals(rawPassword, hash);
        assertTrue(encoder.matches(rawPassword, hash));
        assertFalse(encoder.matches("SenhaIncorreta123!", hash));
    }

    @Test
    void samePasswordMustHaveDifferentSaltedHashes() {
        String rawPassword = "SenhaDeTeste123456!";

        assertNotEquals(encoder.encode(rawPassword), encoder.encode(rawPassword));
    }
}
