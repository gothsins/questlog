package com.gothsins.questlog.exception;

public record FieldErrorDetail (
        String field,
        String message
){
}
