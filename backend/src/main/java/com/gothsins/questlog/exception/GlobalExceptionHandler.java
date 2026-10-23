package com.gothsins.questlog.exception;

import com.gothsins.questlog.auth.PasswordRejectedException;
import com.gothsins.questlog.auth.PwnedPasswordUnavailableException;
import com.gothsins.questlog.ratelimit.RateLimitUnavailableException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.beans.TypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PasswordRejectedException.class)
    public ResponseEntity<ErrorResponse> handlePasswordRejected(
            PasswordRejectedException exception
    ) {
        return ResponseEntity.badRequest().body(new ErrorResponse(
                exception.getMessage(), HttpStatus.BAD_REQUEST.value()
        ));
    }

    @ExceptionHandler({PwnedPasswordUnavailableException.class,
            RateLimitUnavailableException.class})
    public ResponseEntity<ErrorResponse> handleSecurityDependencyUnavailable(
            RuntimeException exception
    ) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ErrorResponse(
                        exception.getMessage(),
                        HttpStatus.SERVICE_UNAVAILABLE.value()
                ));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException exception
    ) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse(
                        "Access denied", HttpStatus.FORBIDDEN.value()
                ));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            ResourceNotFoundException ex
    ) {

        HttpStatus status = HttpStatus.NOT_FOUND;

        ErrorResponse error = new ErrorResponse(
                ex.getMessage(),
                status.value()
        );

        return ResponseEntity
                .status(status)
                .body(error);
    }

    @ExceptionHandler(GameAlreadyInLibraryException.class)
    public ResponseEntity<ErrorResponse> handleGameAlreadyInLibrary(
            GameAlreadyInLibraryException ex
    ) {

        HttpStatus status = HttpStatus.CONFLICT;

        ErrorResponse error = new ErrorResponse(
                ex.getMessage(),
                status.value()
        );

        return ResponseEntity
                .status(status)
                .body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex
    ) {

        List<FieldErrorDetail> errors = ex
                .getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> new FieldErrorDetail(
                        error.getField(),
                        error.getDefaultMessage()
                ))
                .toList();

        HttpStatus status = HttpStatus.BAD_REQUEST;

        ErrorResponse response = new ErrorResponse(
                "Validation failed",
                status.value(),
                errors
        );

        return ResponseEntity
                .status(status)
                .body(response);
    }

    @ExceptionHandler(UsernameAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleUsernameAlreadyExists(
            UsernameAlreadyExistsException ex
    ) {

        HttpStatus status = HttpStatus.CONFLICT;

        ErrorResponse error = new ErrorResponse(
                ex.getMessage(),
                status.value()
        );

        return ResponseEntity
                .status(status)
                .body(error);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex
    ) {

        HttpStatus status = HttpStatus.UNAUTHORIZED;

        ErrorResponse error = new ErrorResponse(
                "Invalid username or password",
                status.value()
        );

        return ResponseEntity
                .status(status)
                .body(error);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException exception
    ) {

        ErrorResponse error = new ErrorResponse(
                "Data conflict",
                HttpStatus.CONFLICT.value()
        );

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(error);
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            TypeMismatchException.class
    })
    public ResponseEntity<ErrorResponse> handleMalformedRequest(
            Exception exception
    ) {
        return ResponseEntity
                .badRequest()
                .body(new ErrorResponse(
                        "Malformed request",
                        HttpStatus.BAD_REQUEST.value()
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpectedException(
            Exception exception
    ) {
        // Spring's own request exceptions (missing parameter, unsupported
        // media type, unknown resource, method validation...) already carry
        // the right 4xx status. Without this branch the catch-all below would
        // turn every one of them into a 500.
        if (exception instanceof org.springframework.web.ErrorResponse framework
                && framework.getStatusCode().is4xxClientError()) {
            int status = framework.getStatusCode().value();
            return ResponseEntity
                    .status(status)
                    .headers(framework.getHeaders())
                    .body(new ErrorResponse(clientErrorMessage(status), status));
        }

        log.error(
                "Unexpected application error",
                exception
        );

        ErrorResponse error = new ErrorResponse(
                "Internal server error",
                HttpStatus.INTERNAL_SERVER_ERROR.value()
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotAllowed(
            HttpRequestMethodNotSupportedException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ErrorResponse(
                        "HTTP method not allowed",
                        HttpStatus.METHOD_NOT_ALLOWED.value()
                ));
    }

    @ExceptionHandler(NicknameAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleNicknameConflict(
            NicknameAlreadyExistsException ex
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(
                        ex.getMessage(),
                        HttpStatus.CONFLICT.value()
                ));
    }

    @ExceptionHandler(AvatarValidationException.class)
    public ResponseEntity<ErrorResponse> handleInvalidAvatar(
            AvatarValidationException ex
    ) {
        return ResponseEntity
                .badRequest()
                .body(new ErrorResponse(
                        ex.getMessage(),
                        HttpStatus.BAD_REQUEST.value()
                ));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleOversizedUpload(
            MaxUploadSizeExceededException ex
    ) {
        return ResponseEntity
                .status(413)
                .body(new ErrorResponse(
                        "Image upload exceeds the allowed size",
                        413
                ));
    }

    private String clientErrorMessage(int status) {
        return switch (status) {
            case 404 -> "Resource not found";
            case 406 -> "Not acceptable";
            case 415 -> "Unsupported media type";
            default -> "Invalid request";
        };
    }
}
