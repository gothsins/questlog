package com.gothsins.questlog.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
public class PwnedPasswordClient {

    private static final int MAX_RESPONSE_BYTES = 128 * 1024;
    private final URI baseUri;
    private final Duration timeout;
    private final HttpClient httpClient;

    public PwnedPasswordClient(
            @Value("${security.pwned-passwords.base-url:https://api.pwnedpasswords.com}")
            String baseUrl,
            @Value("${security.pwned-passwords.timeout:2s}")
            Duration timeout
    ) {
        this.baseUri = URI.create(baseUrl);
        this.timeout = timeout;
        if (timeout.isZero() || timeout.isNegative()) {
            throw new IllegalArgumentException("Pwned Passwords timeout must be positive");
        }
        String scheme = baseUri.getScheme();
        String host = baseUri.getHost();
        if (host == null || baseUri.getRawUserInfo() != null
                || baseUri.getRawQuery() != null || baseUri.getRawFragment() != null) {
            throw new IllegalArgumentException("Invalid Pwned Passwords base URL");
        }
        boolean loopbackHttp = "http".equalsIgnoreCase(scheme)
                && ("localhost".equalsIgnoreCase(host)
                || "127.0.0.1".equals(host)
                || "[::1]".equals(host));
        if (!"https".equalsIgnoreCase(scheme) && !loopbackHttp) {
            throw new IllegalArgumentException("Pwned Passwords requires HTTPS");
        }
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(timeout)
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
    }

    public String fetchRange(String prefix) {
        if (prefix == null || !prefix.matches("[0-9A-F]{5}")) {
            throw new IllegalArgumentException("Invalid hash prefix");
        }

        HttpRequest request = HttpRequest.newBuilder(
                        baseUri.resolve("/range/" + prefix))
                .timeout(timeout)
                .header("User-Agent", "Questlog-Password-Check/1.0")
                .header("Add-Padding", "true")
                .header("Accept", "text/plain")
                .GET()
                .build();

        try {
            HttpResponse<InputStream> response = httpClient.send(
                    request, HttpResponse.BodyHandlers.ofInputStream()
            );
            try (InputStream body = response.body()) {
                if (response.statusCode() != 200) {
                    throw new PwnedPasswordUnavailableException();
                }
                byte[] bytes = body.readNBytes(MAX_RESPONSE_BYTES + 1);
                if (bytes.length > MAX_RESPONSE_BYTES) {
                    throw new PwnedPasswordUnavailableException();
                }
                return new String(bytes, StandardCharsets.US_ASCII);
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new PwnedPasswordUnavailableException();
        } catch (IOException exception) {
            throw new PwnedPasswordUnavailableException();
        }
    }
}
