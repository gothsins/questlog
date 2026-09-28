package com.gothsins.questlog.ratelimit;

import com.gothsins.questlog.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;

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

        String path = request.getRequestURI();
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

        boolean allowed = rateLimitService.isAllowed(
                key,
                maxRequests,
                window
        );

        if (allowed) {
            return true;
        }

        response.setStatus(
                HttpStatus.TOO_MANY_REQUESTS.value()
        );

        response.setContentType(
                MediaType.APPLICATION_JSON_VALUE
        );

        ErrorResponse error = new ErrorResponse(
                "Too many requests",
                HttpStatus.TOO_MANY_REQUESTS.value()
        );

        jsonMapper.writeValue(
                response.getWriter(),
                error
        );

        return false;
    }
}