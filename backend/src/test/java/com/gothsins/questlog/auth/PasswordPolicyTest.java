package com.gothsins.questlog.auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PasswordPolicyTest {
    private final PasswordPolicy policy = new PasswordPolicy();

    @Test
    void acceptsLongPassphrasesWithoutCompositionRules() {
        assertDoesNotThrow(() -> policy.validate("cavalo verde corre longe"));
        assertDoesNotThrow(() -> policy.validate("🦊🦊🦊🦊🦊🦊🦊🦊"));
        assertDoesNotThrow(() -> policy.validate("a".repeat(72)));
    }

    @Test
    void rejectsShortBlankAndCommonPasswords() {
        assertThrows(PasswordRejectedException.class,
                () -> policy.validate("🦊".repeat(7)));
        assertThrows(PasswordRejectedException.class,
                () -> policy.validate(" ".repeat(8)));
        assertThrows(PasswordRejectedException.class,
                () -> policy.validate("Password123"));
    }

    @Test
    void enforcesBcryptLimitInUtf8BytesRatherThanJavaCharacters() {
        assertDoesNotThrow(() -> policy.validate("é".repeat(36)));
        PasswordRejectedException exception = assertThrows(
                PasswordRejectedException.class,
                () -> policy.validate("é".repeat(37))
        );
        assertTrue(exception.getMessage().contains("72 UTF-8 bytes"));
        assertThrows(PasswordRejectedException.class,
                () -> policy.validate("🦊".repeat(19)));
        assertThrows(PasswordRejectedException.class,
                () -> policy.validate("a".repeat(73)));
    }

    @Test
    void rejectsMalformedSurrogateSequences() {
        assertThrows(PasswordRejectedException.class,
                () -> policy.validate("abcdefgh\uD800"));
    }
}
