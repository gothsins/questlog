package com.gothsins.questlog.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Flow;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

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

        CompletableFuture<HttpResponse<byte[]>> responseFuture = httpClient.sendAsync(
                request, info -> new LimitedBodySubscriber(MAX_RESPONSE_BYTES));
        try {
            HttpResponse<byte[]> response = responseFuture.get(
                    timeout.toNanos(), TimeUnit.NANOSECONDS);
            if (response.statusCode() != 200) {
                throw new PwnedPasswordUnavailableException();
            }
            return new String(response.body(), StandardCharsets.US_ASCII);
        } catch (InterruptedException exception) {
            responseFuture.cancel(true);
            Thread.currentThread().interrupt();
            throw new PwnedPasswordUnavailableException();
        } catch (ExecutionException | TimeoutException exception) {
            responseFuture.cancel(true);
            throw new PwnedPasswordUnavailableException();
        }
    }

    private static final class LimitedBodySubscriber
            implements HttpResponse.BodySubscriber<byte[]> {
        private final HttpResponse.BodySubscriber<byte[]> delegate =
                HttpResponse.BodySubscribers.ofByteArray();
        private final int maxBytes;
        private Flow.Subscription subscription;
        private int received;

        private LimitedBodySubscriber(int maxBytes) {
            this.maxBytes = maxBytes;
        }

        @Override
        public CompletionStage<byte[]> getBody() {
            return delegate.getBody();
        }

        @Override
        public void onSubscribe(Flow.Subscription subscription) {
            this.subscription = subscription;
            delegate.onSubscribe(subscription);
        }

        @Override
        public void onNext(List<ByteBuffer> buffers) {
            for (ByteBuffer buffer : buffers) {
                if (buffer.remaining() > maxBytes - received) {
                    subscription.cancel();
                    delegate.onError(new IOException("Pwned response exceeds limit"));
                    return;
                }
                received += buffer.remaining();
            }
            delegate.onNext(buffers);
        }

        @Override
        public void onError(Throwable error) {
            delegate.onError(error);
        }

        @Override
        public void onComplete() {
            delegate.onComplete();
        }
    }
}
