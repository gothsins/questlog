package com.gothsins.questlog.ratelimit;

import com.gothsins.questlog.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;
import java.nio.charset.StandardCharsets;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitService rateLimitService;
    private final JsonMapper jsonMapper;

    public RateLimitInterceptor(
            RateLimitService rateLimitService,
            JsonMapper jsonMapper
    ) {
        this.rateLimitService = rateLimitService;
        this.jsonMapper = jsonMapper;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) throws Exception {

        String path = request.getRequestURI()
                .substring(request.getContextPath().length());
        if (!HttpMethod.POST.matches(request.getMethod())) {
            return true;
        }
        String ip = request.getRemoteAddr();

        int maxRequests;
        Duration window;

        if (path.equals("/api/auth/login")) {

            maxRequests = 5;
            window = Duration.ofMinutes(1);

        } else if (path.equals("/api/auth/register")) {

            maxRequests = 3;
            window = Duration.ofMinutes(10);

        } else {

            return true;
        }

        String key =
                "rate-limit:" +
                        path +
                        ":" +
                        ip;

        RateLimitDecision decision;
        try {
            decision = rateLimitService.check(key, maxRequests, window);
        } catch (RateLimitUnavailableException exception) {
            writeError(response, HttpStatus.SERVICE_UNAVAILABLE,
                    exception.getMessage());
            return false;
        }

        if (decision.allowed()) {
            return true;
        }

        response.setHeader(HttpHeaders.RETRY_AFTER,
                Long.toString(decision.retryAfterSeconds()));
        writeError(response, HttpStatus.TOO_MANY_REQUESTS,
                "Too many requests");

        return false;
    }

    private void writeError(HttpServletResponse response,
                            HttpStatus status, String message) throws Exception {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        jsonMapper.writeValue(response.getWriter(),
                new ErrorResponse(message, status.value()));
    }
}
