package com.gothsins.questlog.auth;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class PwnedPasswordClientTest {
    private HttpServer server;
    private AtomicReference<String> requestPath;
    private AtomicReference<String> paddingHeader;
    private volatile int status;
    private volatile long delayMillis;

    @BeforeEach
    void startServer() throws IOException {
        requestPath = new AtomicReference<>();
        paddingHeader = new AtomicReference<>();
        status = 200;
        delayMillis = 0;
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/range/", exchange -> {
            requestPath.set(exchange.getRequestURI().getPath());
            paddingHeader.set(exchange.getRequestHeaders().getFirst("Add-Padding"));
            if (delayMillis > 0) {
                try {
                    Thread.sleep(delayMillis);
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                }
            }
            byte[] body = ("0".repeat(35) + ":1\r\n")
                    .getBytes(StandardCharsets.US_ASCII);
            try {
                exchange.sendResponseHeaders(status, body.length);
                exchange.getResponseBody().write(body);
            } catch (IOException ignored) {
                // A timeout closes the client connection before this test server replies.
            } finally {
                exchange.close();
            }
        });
        server.start();
    }

    @AfterEach
    void stopServer() {
        server.stop(0);
    }

    private PwnedPasswordClient client(Duration timeout) {
        return new PwnedPasswordClient(
                "http://127.0.0.1:" + server.getAddress().getPort(), timeout);
    }

    @Test
    void callsOnlyTheRangePrefixWithPadding() {
        assertFalse(client(Duration.ofSeconds(2)).fetchRange("5BAA6").isEmpty());
        assertEquals("/range/5BAA6", requestPath.get());
        assertEquals("true", paddingHeader.get());
    }

    @Test
    void convertsHttpFailureAndTimeoutToControlledUnavailability() {
        status = 503;
        assertThrows(PwnedPasswordUnavailableException.class,
                () -> client(Duration.ofSeconds(2)).fetchRange("5BAA6"));
        status = 200;
        delayMillis = 300;
        assertThrows(PwnedPasswordUnavailableException.class,
                () -> client(Duration.ofMillis(50)).fetchRange("5BAA6"));
    }

    @Test
    void rejectsUnsafeConfigurationAndNonPrefixInputs() {
        assertThrows(IllegalArgumentException.class,
                () -> new PwnedPasswordClient("http://example.com", Duration.ofSeconds(1)));
        assertThrows(IllegalArgumentException.class,
                () -> client(Duration.ofSeconds(1)).fetchRange("5BAA61E4"));
    }
}
