package com.gothsins.questlog.auth;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;

@Component
public class PasswordPolicy {

    private static final Set<String> COMMON_PASSWORDS = Set.of(
            "password", "password123", "12345678", "123456789",
            "qwerty123", "admin123", "senha123", "questlog123"
    );

    public void validate(String password) {
        if (password == null || password.isBlank()) {
            throw new PasswordRejectedException("Password is required");
        }

        if (!isWellFormedUnicode(password)) {
            throw new PasswordRejectedException("Password contains invalid Unicode");
        }

        if (password.codePointCount(0, password.length()) < 8) {
            throw new PasswordRejectedException(
                    "Password must contain at least 8 characters"
            );
        }

        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new PasswordRejectedException(
                    "Password must be at most 72 UTF-8 bytes"
            );
        }

        if (COMMON_PASSWORDS.contains(password.toLowerCase(Locale.ROOT))) {
            throw new PasswordRejectedException("Choose a less common password");
        }
    }

    private boolean isWellFormedUnicode(String value) {
        for (int i = 0; i < value.length(); i++) {
            char current = value.charAt(i);
            if (Character.isHighSurrogate(current)) {
                if (i + 1 >= value.length()
                        || !Character.isLowSurrogate(value.charAt(i + 1))) {
                    return false;
                }
                i++;
            } else if (Character.isLowSurrogate(current)) {
                return false;
            }
        }
        return true;
    }
}
