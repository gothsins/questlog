package com.gothsins.questlog.igdb;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class TwitchAuthServiceTest {

    @Test
    void clientSecretIsSentInFormBodyAndNeverInRequestUrl() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        AtomicReference<URI> requestUri = new AtomicReference<>();
        AtomicReference<String> requestBody = new AtomicReference<>();
        AtomicReference<String> contentType = new AtomicReference<>();
        server.createContext("/oauth2/token", exchange -> {
            requestUri.set(exchange.getRequestURI());
            contentType.set(exchange.getRequestHeaders().getFirst("Content-Type"));
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] response = "{\"access_token\":\"synthetic-token\",\"expires_in\":3600}"
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            try (var output = exchange.getResponseBody()) {
                output.write(response);
            }
        });
        server.start();

        try {
            IgdbProperties properties = new IgdbProperties(
                    "synthetic-client", "synthetic-secret", "http://127.0.0.1",
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/oauth2/token");
            TwitchAuthService service = new TwitchAuthService(RestClient.builder(), properties);

            assertEquals("synthetic-token", service.getAccessToken());
            assertEquals("/oauth2/token", requestUri.get().getPath());
            assertNull(requestUri.get().getRawQuery());
            assertTrue(contentType.get().startsWith("application/x-www-form-urlencoded"));
            String decodedBody = URLDecoder.decode(requestBody.get(), StandardCharsets.UTF_8);
            assertTrue(decodedBody.contains("client_id=synthetic-client"));
            assertTrue(decodedBody.contains("client_secret=synthetic-secret"));
            assertTrue(decodedBody.contains("grant_type=client_credentials"));
        } finally {
            server.stop(0);
        }
    }
}
