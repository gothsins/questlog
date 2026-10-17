package com.gothsins.questlog.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
public class PwnedPasswordService {

    private final PwnedPasswordClient client;
    private final boolean enabled;

    public PwnedPasswordService(
            PwnedPasswordClient client,
            @Value("${security.pwned-passwords.enabled:true}") boolean enabled
    ) {
        this.client = client;
        this.enabled = enabled;
    }

    public boolean isCompromised(String password) {
        if (!enabled) {
            return false;
        }

        String hash = sha1Hex(password);
        String prefix = hash.substring(0, 5);
        String suffix = hash.substring(5);
        String range = client.fetchRange(prefix);
        boolean foundEntry = false;
        boolean compromised = false;

        for (String line : range.split("\\R")) {
            if (line.isEmpty()) {
                continue;
            }
            int separator = line.indexOf(':');
            if (separator != 35 || !line.matches("[0-9A-Fa-f]{35}:[0-9]+")) {
                throw new PwnedPasswordUnavailableException();
            }
            foundEntry = true;
            long count;
            try {
                count = Long.parseLong(line.substring(separator + 1));
            } catch (NumberFormatException exception) {
                throw new PwnedPasswordUnavailableException();
            }
            if (line.regionMatches(true, 0, suffix, 0, 35)) {
                compromised |= count > 0;
            }
        }
        if (!foundEntry) {
            throw new PwnedPasswordUnavailableException();
        }
        return compromised;
    }

    private String sha1Hex(String password) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-1")
                    .digest(password.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().withUpperCase().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-1 unavailable");
        }
    }
}
