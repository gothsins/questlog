package com.gothsins.questlog.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private static final String TEST_SECRET = Base64.getEncoder()
            .encodeToString("0123456789abcdef0123456789abcdef"
                    .getBytes(StandardCharsets.UTF_8));

    @Test
    void signedTokenShouldBeValidForItsOwner() {
        JwtService service = new JwtService(TEST_SECRET, 3_600_000L);
        String token = service.generateToken("gui");

        assertEquals("gui", service.extractUsername(token));
        assertTrue(service.isTokenValid(token, "gui"));
        assertFalse(service.isTokenValid(token, "gui2"));
    }

    @Test
    void modifiedSignatureMustBeRejected() {
        JwtService service = new JwtService(TEST_SECRET, 3_600_000L);
        String token = service.generateToken("gui");
        String[] pieces = token.split("\\.");
        assertEquals(3, pieces.length);

        String signature = pieces[2];
        String modifiedSignature = (signature.charAt(0) == 'A' ? "B" : "A")
                + signature.substring(1);
        String forged = pieces[0] + "." + pieces[1] + "." + modifiedSignature;

        assertThrows(JwtException.class,
                () -> service.extractUsername(forged));
    }

    @Test
    void expiredTokenMustBeRejected() {
        JwtService service = new JwtService(TEST_SECRET, -1_000L);
        String expiredToken = service.generateToken("gui");

        assertThrows(JwtException.class,
                () -> service.isTokenValid(expiredToken, "gui"));
    }
}
